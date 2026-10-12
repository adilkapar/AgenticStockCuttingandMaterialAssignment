# 03 — Domain Model

## Overview

The domain model captures the real-world entities from the TRIM PDF. All 13 coil parameters and all order characteristics are modeled precisely because the feasibility matching requires exact or compatible values across these dimensions.

## Entity: Coil (Hammadde / Bobin)

A coil is a roll of flat steel sheet that serves as raw material for cutting operations.

### Schema

```json
{
  "coil_id": "COIL-4521",
  "material_number": "MAT-HDG-DX51D-050",
  "batch_number": "BATCH-2025-0142",
  
  "product_group": "HDG",
  "quality": "DX51D",
  "thickness_mm": 0.50,
  "width_mm": 1500,
  "weight_tons": 12.0,
  
  "surface_group": "A",
  "coating_amount_g_m2": 275,
  "outer_diameter_mm": 1800,
  "inner_diameter_mm": 508,
  "roughness": "N",
  "passivation": false,
  "protective_oil_g_m2": 1.0,
  "origin_supplier": "ArcelorMittal",
  
  "status": "stock",
  "arrival_date": "2025-01-20",
  "stock_entry_date": "2025-01-20",
  "remaining_weight_tons": 12.0,
  "reserved": false,
  "reservation_ids": []
}
```

### Parameter Definitions (from TRIM PDF page 12)

| # | Parameter | Turkish | Description | Example Values |
|---|-----------|---------|-------------|----------------|
| 1 | product_group | Ürün grubu | Process category at supplier | HDG, CR, HRC, EG |
| 2 | quality | Kalite | International standard grade | DX51D, DC01, S235JR |
| 3 | thickness_mm | Kalınlık | Sheet thickness in mm | 0.30 – 6.00 |
| 4 | width_mm | Genişlik | Coil width in mm | 600 – 2000 |
| 5 | weight_tons | Ağırlık | Total coil weight | 3 – 25 |
| 6 | surface_group | Yüzey grubu | Surface quality standard | A, B, C |
| 7 | coating_amount_g_m2 | Kaplama miktarı | Galvanizing coating weight | 100, 150, 200, 275, 350 |
| 8 | outer_diameter_mm | Dış çap | Coil outer diameter | 1000 – 2100 |
| 9 | inner_diameter_mm | İç çap | Core hole diameter | 508, 610 |
| 10 | roughness | Pürüzlülük | Surface roughness class | N (normal), R (rough) |
| 11 | passivation | Pasivasyon | Anti-corrosion treatment | true / false |
| 12 | protective_oil_g_m2 | Koruyucu yağ miktarı | Surface oil amount | 0.5, 1.0, 1.5 |
| 13 | origin_supplier | Menşei | Supplier name | ArcelorMittal, TATA, Erdemir |

### Coil Status Values (from TRIM PDF page 12)

| Status | Turkish | Description |
|--------|---------|-------------|
| `stock` | Stok | Arrived and available in warehouse |
| `in_transit` | Yol | Shipped by supplier, en route |
| `purchase_order` | SAS (Satın Alma Siparişi) | Ordered but not yet produced by supplier |

### Status Availability for Planning

```
Planning urgency:  stock > in_transit > purchase_order

stock:           Available NOW for immediate cutting
in_transit:      Available on estimated arrival_date
purchase_order:  Available on estimated production + shipping date
                 (least certain — may change)
```

## Entity: Order (Sipariş / Satış Siparişi)

An order represents customer demand that requires raw material to be cut.

### Schema

```json
{
  "order_id": "ORD-001",
  "sales_order_number": "4500001234",
  "line_item": 10,
  "order_type": "confirmed",
  "customer_id": "CUST-0042",
  
  "product_group": "HDG",
  "quality": "DX51D",
  "thickness_mm": 0.50,
  "width_mm": 1200,
  "quantity_tons": 8.5,
  "length_mm": null,
  "pieces": null,
  
  "surface_group": "A",
  "coating_amount_g_m2": 275,
  "outer_diameter_mm": 1800,
  "roughness": "N",
  "passivation": false,
  "protective_oil_g_m2": 1.0,
  "top_paint_color": null,
  "surface_shape": null,
  
  "operation_type": "slitting",
  "due_date": "2025-02-15",
  "priority_score": 1,
  
  "fulfillment_status": "open",
  "planned_tons": 0.0,
  "assigned_coil_ids": []
}
```

### Order Types (from TRIM PDF page 13)

| Type | Turkish | Description | Planning Impact |
|------|---------|-------------|-----------------|
| `confirmed` | Kesinleşmiş sipariş | Customer-confirmed order with firm due date | Must plan; tardy = penalty |
| `forecast` | Tahmin | Predicted future demand | Plan if capacity allows; no tardiness penalty |

### Operation Types (from TRIM PDF pages 15-18)

| Type | Turkish | Description | Cutting Dimension |
|------|---------|-------------|-------------------|
| `slitting` | Dilme | Cut coil into narrower strips | 1D (width only) |
| `cut_to_length` | Boy Kesme | Cut strip into sheets of specific length | 1D (length only) |
| `slitting_ctl` | Dilme + Boy Kesme | First slit, then cut to length | 2D (width then length) |
| `slitting_slitting` | Dilme + Dilme | Two-pass slitting (re-slit a strip) | 1D + 1D (sequential) |

### Order Parameters (from TRIM PDF page 13-14)

| # | Parameter | Matching Rule | Notes |
|---|-----------|---------------|-------|
| 1 | product_group | Exact match | Must equal coil's product_group |
| 2 | quality | Exact match | Must equal coil's quality |
| 3 | thickness_mm | Exact match | Must equal coil's thickness |
| 4 | width_mm | Coil >= Order + trim allowance | Coil must be at least as wide |
| 5 | surface_group | Exact match | Must equal coil's surface_group |
| 6 | coating_amount_g_m2 | Exact match | Must equal coil's coating |
| 7 | outer_diameter_mm | Compatible | Coil OD >= Order OD requirement |
| 8 | roughness | Exact match (if specified) | Null = any acceptable |
| 9 | passivation | Exact match (if specified) | Null = any acceptable |
| 10 | protective_oil_g_m2 | Exact match (if specified) | Null = any acceptable |
| 11 | top_paint_color | Special handling | Requires pre-painted coil |
| 12 | surface_shape | Post-processing | Oluk (corrugated) / Trapez |
| 13 | due_date | Coil available before deadline | arrival_date + processing <= due_date |

## Entity: Feasibility Rule Set

The rules that determine whether a coil CAN serve an order. This is a hard constraint — if not met, the assignment is impossible.

### Formal Definition

```
FEASIBLE(coil, order) = TRUE if and only if ALL of the following hold:

  coil.product_group       == order.product_group
  coil.quality             == order.quality
  coil.thickness_mm        == order.thickness_mm
  coil.width_mm            >= order.width_mm + TRIM_ALLOWANCE_MM
  coil.surface_group       == order.surface_group
  coil.coating_amount_g_m2 == order.coating_amount_g_m2
  coil.outer_diameter_mm   >= order.outer_diameter_mm  (if order specifies)
  coil.roughness           == order.roughness           (if order specifies)
  coil.passivation         == order.passivation         (if order specifies)
  coil.protective_oil_g_m2 == order.protective_oil_g_m2 (if order specifies)
  coil.arrival_date        <= order.due_date - PROCESSING_LEAD_TIME_DAYS
  coil.remaining_weight_tons >= MIN_ALLOCATION_TONS
```

Where:
- `TRIM_ALLOWANCE_MM` = minimum trim required by slitting machine (typically 2-5mm per side)
- `PROCESSING_LEAD_TIME_DAYS` = days needed to process once cutting starts
- `MIN_ALLOCATION_TONS` = minimum weight economically worth processing

### Key Insight: Near-Custom Matching

The TRIM PDF states: *"Neredeyse siparişe özel hammadde tedarik etme gereksinimi var"* — the matching is so specific that coils are almost purchased for specific orders. This means:

1. The feasibility network is **sparse** (few coils match each order)
2. Mistakes in matching are costly (idle coils, unplanned orders)
3. The optimization has real economic impact even for small improvements

## Entity: Feasibility Network

The bipartite graph connecting orders to their feasible coils.

### Structure

```
Orders (left nodes)          Coils (right nodes)
+---------+                  +---------+
| ORD-001 |------------------| COIL-4521|
|         |------+           |         |
+---------+      |           +---------+
                 |           +---------+
+---------+     +-----------| COIL-4533|
| ORD-002 |-----------------|         |
|         |                  +---------+
+---------+                  +---------+
                             | COIL-4540|  <- no connections = idle
+---------+                  |         |
| ORD-003 |  <- no connections         |
|         |    = infeasible  +---------+
+---------+
```

### Connected Components (Problem Groups)

The feasibility network naturally decomposes into **independent sub-problems** (connected components). Orders and coils in different groups have no feasibility relationship and can be solved independently.

```
Group 1: {ORD-001, ORD-002, ORD-005} <-> {COIL-4521, COIL-4533}
Group 2: {ORD-003, ORD-004, ORD-006, ORD-007} <-> {COIL-4540, COIL-4541, COIL-4542}
Group 3: {ORD-008} <-> {COIL-4550, COIL-4551}  (oversupplied)
```

This decomposition is a **critical performance optimization** from the TRIM PDF — it enables parallel solving.

### Edge Attributes

Each edge in the feasibility network carries metadata used by the optimizer:

```json
{
  "order_id": "ORD-001",
  "coil_id": "COIL-4521",
  "width_excess_mm": 300,
  "weight_coverage_ratio": 1.41,
  "days_slack": 25,
  "trim_potential_pct": 20.0,
  "preference_score": 0.72
}
```

## Entity: Cutting Pattern

The result of solving the cutting problem for one coil.

### Schema (Slitting Operation)

```json
{
  "pattern_id": "PAT-001",
  "coil_id": "COIL-4521",
  "coil_width_mm": 1500,
  "operation_type": "slitting",
  
  "strips": [
    {"order_id": "ORD-001", "width_mm": 1000, "quantity_tons": 5.0},
    {"order_id": "ORD-005", "width_mm": 480, "quantity_tons": 2.4}
  ],
  
  "trim_left_mm": 10,
  "trim_right_mm": 10,
  "total_trim_mm": 20,
  "trim_loss_pct": 1.33,
  
  "coil_weight_used_tons": 7.4,
  "coil_weight_remaining_tons": 4.6,
  "utilization_pct": 61.7
}
```

### Visual Representation (Slitting)

```
Coil width: 1500mm
+----------------------------------------------------------+
| 10mm |    ORD-001 (1000mm)    |  ORD-005 (480mm) | 10mm |
| TRIM |                        |                  | TRIM |
+----------------------------------------------------------+
         Total trim: 20mm (1.33%)
```

### Schema (Cut-to-Length Operation)

```json
{
  "pattern_id": "PAT-002",
  "coil_id": "COIL-4533",
  "coil_width_mm": 1250,
  "operation_type": "cut_to_length",
  
  "sheets": [
    {"order_id": "ORD-010", "length_mm": 2000, "pieces": 150, "weight_tons": 2.4},
    {"order_id": "ORD-011", "length_mm": 3000, "pieces": 80, "weight_tons": 1.9}
  ],
  
  "end_scrap_pct": 0.5,
  "coil_weight_used_tons": 4.3,
  "coil_weight_remaining_tons": 4.7
}
```

## Entity: Assignment Plan

The complete mapping of coils to orders with cutting patterns. This is the primary output of the system.

### Schema

```json
{
  "plan_id": "PLAN-2025-0215-001",
  "created_at": "2025-02-15T09:30:00Z",
  "created_by": "joule_orchestrator",
  "status": "draft",
  "planning_horizon_start": "2025-02-15",
  "planning_horizon_end": "2025-03-15",
  
  "assignments": [
    {
      "coil_id": "COIL-4521",
      "pattern_id": "PAT-001",
      "orders": [
        {"order_id": "ORD-001", "allocated_tons": 5.0},
        {"order_id": "ORD-005", "allocated_tons": 2.4}
      ],
      "trim_