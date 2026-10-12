# 04 — System Components: Joule Agent & Planning Data Service

## Design Principles

This system follows a clear separation:

1. **Single agent with LLM reasoning**: Only Joule has a language model and autonomous reasoning capability
2. **Planning Data Service as tool**: SAP data access is a structured service (not an agent) that the orchestrator calls
3. **Tool-augmented**: The agent uses tools (Planning Data Service + MCP Server) rather than containing business logic in the LLM
4. **Structured I/O**: All inputs/outputs are typed JSON — the LLM reasons about *which* function to call, not the data format
5. **Observable**: Every action is logged for audit and explanation

## Why One Agent, Not Three?

In a previous design iteration, we considered separate Order Agent and Stock Agent sub-agents. After evaluation, we consolidated to a single-agent architecture:

| Factor | Multi-Agent (Previous) | Single Agent + Service (Current) |
|--------|----------------------|--------------------------------|
| LLM reasoning | Only orchestrator had LLM anyway | Same — only Joule reasons |
| Data access | Two separate services calling SAP | One unified service calling SAP |
| Feasibility checks | Awkward — spans both domains | Natural — one function, one service |
| Deployment | Multiple units to manage | Two units: agent + service |
| Decision authority | Sub-agents explicitly couldn't decide | Same — service serves data, Joule decides |
| Cross-domain queries | Required inter-agent coordination | Direct function call within same service |

**Key insight**: If a component doesn't have its own LLM and doesn't make autonomous decisions, it's a service, not an agent. Calling data-access layers "agents" adds confusion without value.

---

## Component 1: Joule Orchestrator (The Agent)

### Identity

```yaml
Name: JouleOrchestrator
Role: Central coordinator, user-facing intelligence, decision authority
Owns: Orchestration logic, plan lifecycle, SAP write-back authorization
Runtime: SAP BTP AI Core + SAP Joule Framework
LLM: GPT-4o / Claude / Gemini (via BTP AI Core generative AI hub)
```

### System Prompt

```
You are the Joule Orchestrator for a steel service center's material 
planning system. You coordinate between the Planning Data Service 
(for SAP data on orders and coils) and Optimization Tools (MCP Server) 
to solve the stock cutting and material assignment problem.

Your responsibilities:
1. UNDERSTAND user intent (natural language planning requests)
2. DECOMPOSE complex requests into steps
3. GATHER data from Planning Data Service (demand + supply functions)
4. INVOKE optimization tools via MCP Server
5. EVALUATE results and explain trade-offs
6. EXECUTE decisions by writing back to SAP (with user confirmation)
7. HANDLE exceptions (infeasible orders, coil shortages)

Your reasoning approach:
- Think step-by-step (ReAct pattern: Thought -> Action -> Observation)
- Always check feasibility before optimizing
- Explain trade-offs in business terms (not math)
- When results are suboptimal, suggest what would improve them
- Never guess at data — always call the Planning Data Service

You have access to:
- Planning Data Service: for all demand/supply/feasibility data
  - Demand functions: get_order_pool, get_urgent_orders, get_feasible_coils_for_order, 
    update_fulfillment, flag_infeasible_orders
  - Supply functions: get_available_coils, get_coil_details, get_feasible_orders_for_coil,
    reserve_coil, release_reservation, get_idle_coils
  - Cross-domain: evaluate_feasibility, get_supply_demand_balance
- MCP Tools: build_feasibility_network, solve_cutting_pattern, 
  optimize_assignment, evaluate_plan, suggest_purchase_orders
- SAP Write-back: create reservations, production orders (requires confirmation)
```

### Orchestration Patterns

The orchestrator uses four distinct patterns depending on the situation:

#### Pattern 1: SEQUENTIAL (Full Planning Run)

```
User request: "Plan all open orders"

Step 1: GATHER
  -> PlanningDataService.get_order_pool()
  -> PlanningDataService.get_available_coils()

Step 2: STRUCTURE  
  -> MCP: build_feasibility_network(orders, coils)

Step 3: OPTIMIZE
  -> MCP: optimize_assignment(network, objectives, constraints)

Step 4: DETAIL
  -> MCP: solve_cutting_pattern(coil, orders)  [for each assignment]

Step 5: EVALUATE
  -> MCP: evaluate_plan(assignments, patterns)

Step 6: PRESENT
  -> Synthesize results, explain KPIs, present to user

Step 7: EXECUTE (if user confirms)
  -> PlanningDataService.reserve_coil()  [for each assignment]
  -> PlanningDataService.update_fulfillment()  [for each order]
  -> SAP write-back (reservations, production orders)
```

#### Pattern 2: ITERATIVE (Improving a Plan)

```
User request: "Trim loss is too high, can we do better?"

Step 1: ANALYZE current plan KPIs
Step 2: IDENTIFY worst-performing assignments (highest trim %)
Step 3: CHECK if alternative coils exist for those orders
Step 4: RE-OPTIMIZE with tighter trim objective weight
Step 5: COMPARE old vs new plan KPIs
Step 6: PRESENT trade-offs
```

#### Pattern 3: REACTIVE (Event-Driven)

```
Event: New coil arrived (SAP Event Mesh)

Step 1: RECEIVE event with coil details
Step 2: CHECK if any unplanned orders now become feasible
Step 3: IF yes: suggest assignment to user
Step 4: IF urgent order matched: proactively notify planner
```

#### Pattern 4: EXPLORATORY (What-If)

```
User request: "What if we include forecast orders?"

Step 1: SNAPSHOT current plan state
Step 2: RE-GATHER with modified parameters
Step 3: RE-OPTIMIZE
Step 4: COMPARE scenarios (delta analysis)
Step 5: PRESENT side-by-side with trade-offs
```

### Tool Calling Strategy

Joule has access to two categories of tools:

| Category | Source | Purpose | Examples |
|----------|--------|---------|----------|
| Data Tools | Planning Data Service | Read/write SAP data with domain logic | get_order_pool, reserve_coil, evaluate_feasibility |
| Optimization Tools | MCP Server | Mathematical computation | build_feasibility_network, solve_cutting_pattern |

The LLM decides which tool to call based on:
- User intent analysis
- Current step in the reasoning chain
- What data has already been gathered
- What computation is needed next

---

## Component 2: Planning Data Service (The Service)

### Identity

```yaml
Name: PlanningDataService
Role: Unified SAP data access layer for demand, supply, and cross-domain operations
Type: CAP Application Service (NOT an agent — no LLM, no autonomous reasoning)
Runtime: SAP BTP Cloud Foundry (Node.js/CAP)
Data Sources: SAP S/4HANA SD, MM, PP via OData V4
Writes To: SAP MM (Reservations), SAP PP (Production Orders), Custom Z-tables
```

### Design Rationale

This service consolidates what was previously split across two "agents" (Order Agent + Stock Agent) into a single, cohesive data access layer. The benefits:

1. **Feasibility naturally spans both domains** — checking if a coil can serve an order requires both order parameters and coil parameters in the same function
2. **Single deployment unit** — one CAP project, one `mta.yaml`, one set of SAP destinations
3. **No artificial boundaries** — the supply/demand balance check needs both sides; cross-references are trivial within one service
4. **Clear responsibility** — this service SERVES data; it never DECIDES assignments (that's Joule + MCP)

---

### Module A: Demand Functions

#### `get_order_pool(filters)`
Returns the current pool of orders needing planning.

```typescript
interface GetOrderPoolInput {
  order_types?: ("confirmed" | "forecast")[];
  status_filter?: ("open" | "partially_planned")[];
  due_date_before?: string;  // ISO date
  product_group?: string;
  min_priority?: number;
}

interface GetOrderPoolOutput {
  orders: Order[];
  summary: {
    total_count: number;
    confirmed_count: number;
    forecast_count: number;
    total_demand_tons: number;
    urgent_count: number;
  };
}
```

#### `get_urgent_orders(horizon_days)`
Returns orders requiring immediate attention, sorted by urgency.

```typescript
interface GetUrgentOrdersInput {
  horizon_days: number;  // e.g., 7 = due within a week
}

interface GetUrgentOrdersOutput {
  urgent_orders: Array<{
    order: Order;
    days_until_due: number;
    has_feasible_coil: boolean;
    risk_level: "critical" | "high" | "medium";
  }>;
}
```

#### `get_feasible_coils_for_order(order_id)`
Returns all coils that could potentially serve this order.

```typescript
interface GetFeasibleCoilsInput {
  order_id: string;
  include_transit?: boolean;
  include_sas?: boolean;
}

interface GetFeasibleCoilsOutput {
  order: Order;
  feasible_coils: Array<{
    coil: Coil;
    width_excess_mm: number;
    weight_coverage_ratio: number;
    days_slack: number;
    ranking_score: number;
  }>;
  total_feasible: number;
}
```

#### `update_fulfillment(order_id, allocation)`
Updates the fulfillment state after an assignment is confirmed.

```typescript
interface UpdateFulfillmentInput {
  order_id: string;
  coil_id: string;
  allocated_tons: number;
  pattern_id: string;
}

interface UpdateFulfillmentOutput {
  order_id: string;
  new_status: "open" | "partially_planned" | "fully_planned";
  remaining_tons: number;
  total_planned_tons: number;
}
```

#### `flag_infeasible_orders()`
Identifies orders that cannot be served by ANY available coil.

```typescript
interface FlagInfeasibleOutput {
  infeasible_orders: Array<{
    order: Order;
    reason: string;
    nearest_match?: {
      coil_id: string;
      blocking_parameters: string[];
    };
    recommendation: "purchase" | "relax_constraint" | "postpone";
  }>;
}
```

---

### Module B: Supply Functions

#### `get_available_coils(filters)`
Returns coils available for planning.

```typescript
interface GetAvailableCoilsInput {
  as_of_date?: string;
  status_filter?: ("stock" | "in_transit" | "purchase_order")[];
  exclude_reserved?: boolean;
  product_group?: string;
  quality?: string;
  thickness_mm?: number;
  min_width_mm?: number;
}

interface GetAvailableCoilsOutput {
  coils: Coil[];
  summary: {
    total_count: number;
    stock_count: number;
    transit_count: number;
    sas_count: number;
    total_weight_tons: number;
    avg_age_days: number;
  };
}
```

#### `get_coil_details(coil_id)`
Returns full details for a specific coil including allocation history.

```typescript
interface GetCoilDetailsInput {
  coil_id: string;
}

interface GetCoilDetailsOutput {
  coil: Coil;
  allocation: {
    total_weight_tons: number;
    allocated_tons: number;
    remaining_tons: number;
    reservations: Array<{
      order_id: string;
      tons: number;
      reservation_date: string;
      status: "soft" | "hard";
    }>;
  };
  age_days: number;
  idle: boolean;
}
```

#### `get_feasible_orders_for_coil(coil_id)`
Reverse lookup: which orders can this coil serve?

```typescript
interface GetFeasibleOrdersForCoilInput {
  coil_id: string;
  include_forecast?: boolean;
}

interface GetFeasibleOrdersForCoilOutput {
  coil: Coil;
  feasible_orders: Array<{
    order: Order;
    width_utilization_pct: number;
    weight_demand_tons: number;
  }>;
  total_potential_demand_tons: number;
  utilization_potential: "high" | "medium" | "low";
}
```

#### `reserve_coil(coil_id, order_id, tons)`
Creates a reservation (soft = planning hold; hard = SAP MM reservation).

```typescript
interface ReserveCoilInput {
  coil_id: string;
  order_id: string;
  tons: number;
  reservation_type: "soft" | "hard";
}

interface ReserveCoilOutput {
  success: boolean;
  reservation_id: string;
  coil_remaining_tons: number;
  sap_reservation_number?: string;
}
```

#### `release_reservation(reservation_id)`
Releases a previously created reservation.

```typescript
interface ReleaseReservationInput {
  reservation_id: string;
}

interface ReleaseReservationOutput {
  success: boolean;
  coil_id: string;
  released_tons: number;
  new_remaining_tons: number;
}
```

#### `get_idle_coils(threshold_days)`
Identifies coils in stock too long without assignment.

```typescript
interface GetIdleCoilsInput {
  threshold_days: number;
}

interface GetIdleCoilsOutput {
  idle_coils: Array<{
    coil: Coil;
    days_in_stock: number;
    has_any_feasible_order: boolean;
    recommendation: "find_order" | "return_supplier" | "discount_sale";
  }>;
  total_idle_weight_tons: number;
}
```

---

### Module C: Cross-Domain Functions

#### `evaluate_feasibility(order_id, coil_id)`
Checks if a specific coil can serve a specific order, with detailed rule-by-rule evaluation.

```typescript
interface EvaluateFeasibilityInput {
  order_id: string;
  coil_id: string;
}

interface EvaluateFeasibilityOutput {
  feasible: boolean;
  checks: Array<{
    parameter: string;
    order_value: any;
    coil_value: any;
    rule: string;      // "exact_match" | "gte" | "lte" | "if_specified"
    passed: boolean;
    note?: string;
  }>;
  blocking_reasons?: string[];
}
```

#### `get_supply_demand_balance(spec)`
Reports supply/demand balance for a material specification.

```typescript
interface SupplyDemandBalanceInput {
  product_group: string;
  quality: string;
  thickness_mm: number;
  width_mm_range?: { min: number; max: number };
}

interface SupplyDemandBalanceOutput {
  spec: string;
  supply: {
    stock_tons: number;
    transit_tons: number;
    sas_tons: number;
    total_tons: number;
  };
  demand: {
    confirmed_tons: number;
    forecast_tons: number;
    total_tons: number;
  };
  balance_tons: number;       // positive = oversupply, negative = shortage
  balance_ratio: number;      // supply / demand
  assessment: "balanced" | "oversupplied" | "shortage" | "critical_shortage";
}
```

---

### SAP Integration Points (All in One Service)

| Operation | SAP Module | API | Function |
|-----------|-----------|-----|----------|
| Read sales orders | SD | `API_SALES_ORDER_SRV` OData | get_order_pool |
| Read planned orders | PP | `API_PLANNED_ORDER` OData V4 | get_order_pool |
| Read inventory | MM | `API_MATERIAL_STOCK` OData | get_available_coils |
| Read batch details | MM | `API_BATCH` OData V4 | get_coil_details |
| Read purchase orders | MM | `API_PURCHASEORDER_PROCESS_SRV` | get_available_coils |
| Create reservation | MM | `BAPI_RESERVATION_CREATE1` (RFC) | reserve_coil |
| Read reservations | MM | `API_RESERVATION` OData | get_coil_details |
| Create production order | PP | `API_PRODUCTION_ORDER` OData V4 | update_fulfillment |
| Update custom status | Custom | CDS View + OData PATCH | update_fulfillment |

---

## Component 3: MCP Server (Optimization Tools)

The MCP Server is documented separately in [05-mcp-server.md](./05-mcp-server.md). It is a stateless Python service exposing 5 optimization tools via the Model Context Protocol.

---

## Summary: Complete System Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│  JOULE ORCHESTRATOR (The Only Agent)                                 │
│  • Has LLM (GPT-4o / Claude)                                        │
│  • Reasons autonomously (ReAct pattern)                             │
│  • Makes decisions about WHAT to do                                  │
│  • Explains trade-offs to users                                      │
│  • Authorizes SAP write-backs                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TOOLS AVAILABLE TO JOULE:                                          │
│                                                                     │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  PLANNING DATA SERVICE       │  │  MCP SERVER                   │ │
│  │  (CAP/Node.js)               │  │  (Python/OR-Tools)            │ │
│  │                              │  │                               │ │
│  │  Module A: Demand            │  │  • build_feasibility_network  │ │
│  │  • get_order_pool            │  │  • solve_cutting_pattern      │ │
│  │  • get_urgent_orders         │  │  • optimize_assignment        │ │
│  │  • get_feasible_coils_for..  │  │  • evaluate_plan              │ │
│  │  • update_fulfillment        │  │  • suggest_purchase_orders    │ │
│  │  • flag_infeasible_orders    │  │                               │ │
│  │                              │  │  Stateless computation only   │ │
│  │  Module B: Supply            │  │  No SAP access, no state      │ │
│  │  • get_available_coils       │  └──────────────────────────────┘ │
│  │  • get_coil_details          │                                   │
│  │  • get_feasible_orders_for.. │                                   │
│  │  • reserve_coil              │                                   │
│  │  • release_reservation       │                                   │
│  │  • get_idle_coils            │                                   │
│  │                              │                                   │
│  │  Module C: Cross-Domain      │                                   │
│  │  • evaluate_feasibility      │                                   │
│  │  • get_supply_demand_balance │                                   │
│  └─────────────────────────────┘                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
