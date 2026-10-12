# 07 — SAP Integration Layer

## Overview

This document specifies how the Planning Data Service integrates with SAP S/4HANA. The integration is bidirectional:
- **Read**: Planning Data Service pulls live data from SAP (orders, inventory, batches)
- **Write**: Confirmed plans are written back as SAP transactions (reservations, production orders)
- **Events**: SAP publishes changes that trigger Joule's reactive re-planning

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SAP BTP Integration Layer                 │
│                                                             │
│  ┌─────────────────┐    ┌────────────────────────────────┐ │
│  │  SAP Cloud      │    │  SAP Destination Service       │ │
│  │  Connector      │    │  (manages connection configs)  │ │
│  │  (on-prem link) │    │                                │ │
│  └────────┬────────┘    └──────────────┬─────────────────┘ │
│           │                            │                    │
│  ┌────────▼────────────────────────────▼─────────────────┐ │
│  │         Planning Data Service (CAP Application)        │ │
│  │                                                       │ │
│  │  CDS External Services    ←→   OData V4 Consumption  │ │
│  │  (type-safe SAP access)         (auto-generated)      │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    OData / RFC / Events
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                   SAP S/4HANA System                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Custom CDS Views (Z_* namespace)                     │ │
│  │                                                       │ │
│  │  Z_COIL_INVENTORY    — Coil master + stock + batch    │ │
│  │  Z_ORDER_POOL        — Open orders with fulfillment   │ │
│  │  Z_RESERVATION_STATUS — Current reservations          │ │
│  │  Z_COIL_ORDER_MATCH  — Pre-computed feasibility hints │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Standard APIs                                        │ │
│  │                                                       │ │
│  │  API_SALES_ORDER_SRV          (SD - Sales Orders)     │ │
│  │  API_MATERIAL_STOCK_SRV       (MM - Inventory)        │ │
│  │  API_PURCHASEORDER_PROCESS    (MM - Purchase Orders)  │ │
│  │  API_PRODUCTION_ORDER         (PP - Prod Orders)      │ │
│  │  BAPI_RESERVATION_CREATE1     (MM - Reservations)     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Read Path: SAP → Planning Data Service

### Demand Module Data Sources

#### CDS View: `Z_COIL_ORDER_POOL`

```sql
@AbapCatalog.viewEnhancementCategory: [#NONE]
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Open Orders for Planning'
@OData.publish: true

define view entity Z_COIL_ORDER_POOL
  as select from I_SalesOrder as so
  inner join I_SalesOrderItem as soi
    on so.SalesOrder = soi.SalesOrder
  left outer join ztrim_fulfillment as ful
    on soi.SalesOrder = ful.sales_order
    and soi.SalesOrderItem = ful.line_item
{
  key soi.SalesOrder           as sales_order_number,
  key soi.SalesOrderItem       as line_item,
  
  // Order identification
  concat(soi.SalesOrder, soi.SalesOrderItem) as order_id,
  so.SoldToParty               as customer_id,
  
  // Material parameters (from material master / characteristics)
  soi.Material                 as material_number,
  ztrim_mat.product_group      as product_group,
  ztrim_mat.quality            as quality,
  ztrim_mat.thickness_mm       as thickness_mm,
  soi.OrderQuantity            as quantity_tons,
  ztrim_char.width_mm          as width_mm,
  ztrim_char.surface_group     as surface_group,
  ztrim_char.coating_amount    as coating_amount_g_m2,
  ztrim_char.roughness         as roughness,
  ztrim_char.passivation       as passivation,
  ztrim_char.protective_oil    as protective_oil_g_m2,
  ztrim_char.operation_type    as operation_type,
  
  // Scheduling
  soi.RequestedDeliveryDate    as due_date,
  
  // Fulfillment tracking
  coalesce(ful.planned_tons, 0) as planned_tons,
  soi.OrderQuantity - coalesce(ful.planned_tons, 0) as remaining_tons,
  
  // Status
  case 
    when ful.planned_tons is null then 'open'
    when ful.planned_tons < soi.OrderQuantity then 'partially_planned'
    else 'fully_planned'
  end as fulfillment_status,
  
  // Order type
  case
    when so.SalesOrderType = 'ZFC' then 'forecast'
    else 'confirmed'
  end as order_type,
  
  // Priority calculation
  dats_days_between(soi.RequestedDeliveryDate, $session.system_date) as days_until_due
}
where soi.OrderQuantity - coalesce(ful.planned_tons, 0) > 0  // Only unfulfilled
```

#### CDS View: `Z_COIL_INVENTORY`

```sql
@AbapCatalog.viewEnhancementCategory: [#NONE]
@AccessControl.authorizationCheck: #CHECK  
@EndUserText.label: 'Coil Inventory for Planning'
@OData.publish: true

define view entity Z_COIL_INVENTORY
  as select from I_MaterialStock as ms
  inner join I_Batch as batch
    on ms.Material = batch.Material
    and ms.Batch = batch.Batch
  inner join ztrim_coil_master as cm
    on batch.Batch = cm.batch_number
  left outer join ztrim_reservations as res
    on cm.coil_id = res.coil_id
    and res.status = 'active'
{
  key cm.coil_id               as coil_id,
  
  // Material parameters
  cm.material_number           as material_number,
  cm.batch_number              as batch_number,
  cm.product_group             as product_group,
  cm.quality                   as quality,
  cm.thickness_mm              as thickness_mm,
  cm.width_mm                  as width_mm,
  cm.weight_tons               as weight_tons,
  cm.surface_group             as surface_group,
  cm.coating_amount_g_m2       as coating_amount_g_m2,
  cm.outer_diameter_mm         as outer_diameter_mm,
  cm.inner_diameter_mm         as inner_diameter_mm,
  cm.roughness                 as roughness,
  cm.passivation               as passivation,
  cm.protective_oil_g_m2       as protective_oil_g_m2,
  cm.origin_supplier           as origin_supplier,
  
  // Status and availability
  cm.status                    as status,
  cm.arrival_date              as arrival_date,
  cm.stock_entry_date          as stock_entry_date,
  
  // Remaining capacity
  cm.weight_tons - coalesce(sum(res.reserved_tons), 0) as remaining_weight_tons,
  
  // Age calculation
  dats_days_between($session.system_date, cm.stock_entry_date) as days_in_stock,
  
  // Reservation state
  case when sum(res.reserved_tons) > 0 then true else false end as has_reservations
}
group by cm.coil_id, cm.material_number, cm.batch_number,
         cm.product_group, cm.quality, cm.thickness_mm, cm.width_mm,
         cm.weight_tons, cm.surface_group, cm.coating_amount_g_m2,
         cm.outer_diameter_mm, cm.inner_diameter_mm, cm.roughness,
         cm.passivation, cm.protective_oil_g_m2, cm.origin_supplier,
         cm.status, cm.arrival_date, cm.stock_entry_date
```

## Write Path: Planning Data Service → SAP

### Write-Back Operations

| Action | SAP Object | Method | Service Module | Trigger |
|--------|-----------|--------|----------------|---------|
| Reserve coil for order | MM Reservation | `BAPI_RESERVATION_CREATE1` | Supply module | Plan confirmed |
| Create production order | PP Production Order | `API_PRODUCTION_ORDER` POST | Demand module | Plan confirmed |
| Create purchase requisition | MM Purchase Req | `BAPI_PR_CREATE` | Supply module | Infeasible order |
| Update custom status | Z-table | OData PATCH | Cross-domain | Any plan change |

### Reservation Creation (BAPI Call)

```javascript
// CAP service handler - creating SAP MM reservation
async function createSAPReservation(coilId, orderId, tons, planId) {
  const bapi = await cds.connect.to('SAP_MM_RFC');
  
  const result = await bapi.run({
    'BAPI_RESERVATION_CREATE1': {
      RESERVATION_HEADER: {
        RES_DATE: new Date().toISOString().split('T')[0],
        RES_TYPE: 'M',  // Manual reservation
        MOVE_TYPE: '261', // Goods issue for production
        PLANT: '1000',
        COSTCENTER: '',
        ORDER: '',
      },
      RESERVATION_ITEMS: [{
        ITEM: '0001',
        MATERIAL: coilId,
        PLANT: '1000',
        STGE_LOC: '0001',
        REQUIREMENT_QTY: tons,
        BASE_UOM: 'TO',
        BATCH: getBatchForCoil(coilId),
      }],
      RESERVATION_RETURN: {}
    }
  });
  
  if (result.RESERVATION_RETURN.TYPE === 'E') {
    throw new Error(`SAP reservation failed: ${result.RESERVATION_RETURN.MESSAGE}`);
  }
  
  return {
    sap_reservation_number: result.RESERVATION_RETURN.RES_NO,
    coil_id: coilId,
    order_id: orderId,
    tons: tons
  };
}
```

### Production Order Creation

```javascript
// CAP service handler - creating SAP PP production order
async function createProductionOrder(assignment) {
  const pp = await cds.connect.to('API_PRODUCTION_ORDER');
  
  const prodOrder = await pp.post('/A_ProductionOrder', {
    ManufacturingOrderType: 'ZP01',  // Custom type for cutting
    Material: assignment.coil_id,
    ProductionPlant: '1000',
    TotalQuantity: assignment.total_tons,
    MfgOrderPlannedStartDate: calculateStartDate(assignment),
    MfgOrderPlannedEndDate: assignment.due_date,
    ProductionOrderText: `TRIM Plan ${assignment.plan_id}`,
    // Custom fields for cutting pattern
    YY1_CuttingPattern: assignment.pattern_id,
    YY1_TrimLossPct: assignment.trim_loss_pct,
  });
  
  // Create order components (BOM items = strips)
  for (const strip of assignment.pattern.strips) {
    await pp.post(`/A_ProductionOrder('${prodOrder.ManufacturingOrder}')/to_ProductionOrderComponent`, {
      Material: strip.order_material,
      RequirementQuantity: strip.weight_tons,
      BaseUnit: 'TO',
      // Link back to sales order
      SalesOrder: strip.sales_order_number,
      SalesOrderItem: strip.line_item
    });
  }
  
  return prodOrder.ManufacturingOrder;
}
```

## Event Path: SAP → Reactive Re-Planning

### SAP Event Mesh Configuration

```json
{
  "events": [
    {
      "topic": "sap/s4/mm/inventory/GoodsReceipt",
      "description": "New coil arrived in stock",
      "trigger": "Joule checks unplanned orders against new coil via Planning Data Service"
    },
    {
      "topic": "sap/s4/sd/salesorder/Created",
      "description": "New sales order confirmed",
      "trigger": "Joule checks feasibility and runs reactive plan"
    },
    {
      "topic": "sap/s4/sd/salesorder/Changed",
      "description": "Order quantity or date changed",
      "trigger": "Joule re-evaluates affected assignments"
    },
    {
      "topic": "sap/s4/mm/purchaseorder/DeliveryDateChanged",
      "description": "Supplier delivery delayed",
      "trigger": "Planning Data Service updates availability; Joule re-plans affected"
    }
  ]
}
```

### Event Handler (CAP)

```javascript
// srv/event-handlers.js
const cds = require('@sap/cds');

module.exports = class EventHandlers extends cds.ApplicationService {
  
  async init() {
    const messaging = await cds.connect.to('messaging');
    
    // React to new coil arrival
    messaging.on('sap/s4/mm/inventory/GoodsReceipt', async (event) => {
      const { material, batch, quantity, plant } = event.data;
      
      // Check if this is a coil (by material type)
      if (await isCoilMaterial(material)) {
        const joule = await cds.connect.to('JouleOrchestrator');
        await joule.emit('coil_arrived', {
          coil_id: batch,
          material: material,
          weight_tons: quantity,
          message: `New coil ${batch} arrived. Checking for matching unplanned orders.`
        });
      }
    });
    
    // React to new sales order
    messaging.on('sap/s4/sd/