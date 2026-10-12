# 08 — Implementation Guide

## Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Orchestrator Agent | SAP Joule + SAP AI Core | Native SAP agent framework, enterprise LLM hosting |
| Planning Data Service | SAP CAP (Node.js) | Type-safe OData consumption, SAP auth integration |
| MCP Server | Python + FastAPI + OR-Tools | Best optimization ecosystem, MCP SDK available |
| Solver Engine | Google OR-Tools (CP-SAT) | Free, fast, handles MILP and constraint programming |
| Database | SAP HANA Cloud | Plan history, session state, feasibility cache |
| Event Bus | SAP Event Mesh | Native S/4HANA event publishing |
| LLM | GPT-4o or Claude via BTP AI Core | Reasoning quality + SAP data residency |
| Frontend | SAP Fiori + Joule sidebar | Native SAP UX, no separate app needed |
| Source Control | SAP BTP Git / GitHub | Standard CI/CD |

## Project Structure

```
trim-agentic-system/
│
├── mcp-server/                       # Python MCP optimization server
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── src/
│   │   ├── server.py                # MCP server entry point (SSE transport)
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── feasibility.py      # build_feasibility_network tool
│   │   │   ├── cutting.py          # solve_cutting_pattern tool
│   │   │   ├── assignment.py       # optimize_assignment tool
│   │   │   ├── evaluation.py       # evaluate_plan tool
│   │   │   └── purchasing.py       # suggest_purchase_orders tool
│   │   ├── solvers/
│   │   │   ├── __init__.py
│   │   │   ├── slitting_solver.py  # 1D bin-packing for slitting
│   │   │   ├── ctl_solver.py       # Cut-to-length solver
│   │   │   ├── multi_pass.py       # Combined operation solver
│   │   │   └── assignment_milp.py  # MILP for assignment optimization
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── coil.py             # Coil dataclass
│   │       ├── order.py            # Order dataclass
│   │       └── network.py          # Feasibility network model
│   └── tests/
│       ├── test_feasibility.py
│       ├── test_cutting.py
│       └── test_assignment.py
│
├── planning-data-service/            # SAP CAP application (Node.js)
│   ├── package.json
│   ├── mta.yaml                     # Multi-target app descriptor
│   ├── xs-security.json             # XSUAA security config
│   ├── db/
│   │   └── schema.cds              # HANA persistence (plans, sessions)
│   ├── srv/
│   │   ├── planning-service.cds    # Unified service definition (demand + supply + cross-domain)
│   │   ├── planning-service.js     # Main service implementation
│   │   ├── lib/
│   │   │   ├── demand.js           # Module A: Demand functions (orders, fulfillment)
│   │   │   ├── supply.js           # Module B: Supply functions (coils, reservations)
│   │   │   ├── cross-domain.js     # Module C: Feasibility, supply/demand balance
│   │   │   └── sap-writeback.js    # SAP write-back helpers (BAPI, production orders)
│   │   ├── orchestrator.cds        # Joule orchestrator hooks
│   │   ├── orchestrator.js         # Orchestration logic
│   │   ├── event-handlers.js       # SAP Event Mesh handlers
│   │   └── external/
│   │       ├── S4_SD.cds           # External service: Sales Orders
│   │       ├── S4_MM.cds           # External service: Material Mgmt
│   │       └── S4_PP.cds           # External service: Production
│   └── app/
│       └── planning-cockpit/       # Optional Fiori UI (analytics)
│
├── s4-extensions/                    # SAP S/4HANA side (ABAP)
│   ├── src/
│   │   ├── z_coil_inventory.ddls   # CDS View: coil inventory
│   │   ├── z_order_pool.ddls       # CDS View: order pool
│   │   ├── z_reservation_status.ddls
│   │   ├── ztrim_coil_master.tabl  # Custom table: coil parameters
│   │   ├── ztrim_fulfillment.tabl  # Custom table: fulfillment tracking
│   │   └── ztrim_reservations.tabl # Custom table: planning reservations
│   └── README.md
│
└── docs/                             # This documentation
    ├── 01-problem-definition.md
    ├── 02-architecture.md
    ├── ...
    └── 09-differentiation.md
```

## Implementation Phases

### Phase 1: Foundation (4-6 weeks)

**Goal**: MCP Server works standalone with test data.

| Task | Output |
|------|--------|
| Set up BTP subaccount + services | BTP project running |
| Implement `build_feasibility_network` tool | Tested with sample data |
| Implement `solve_cutting_pattern` (slitting only) | Verified against manual calculations |
| Implement `optimize_assignment` (basic MILP) | Produces valid assignments |
| Deploy MCP Server on BTP Cloud Foundry | Accessible via SSE endpoint |
| Unit tests for all solvers | >90% coverage |

**Validation**: Given 10 orders + 8 coils (hand-crafted), system produces assignments that match expert planner's output.

### Phase 2: SAP Integration (4-6 weeks)

**Goal**: Planning Data Service can read from and write to SAP S/4HANA.

| Task | Output |
|------|--------|
| Create CDS views in S/4HANA | `Z_COIL_INVENTORY`, `Z_ORDER_POOL` |
| Create custom tables for fulfillment tracking | `ztrim_*` tables |
| Implement demand module (CAP service) | Reads live orders via OData |
| Implement supply module (CAP service) | Reads live inventory via OData |
| Implement cross-domain module | Feasibility evaluation working |
| Implement write-back (reservations) | Creates MM reservations |
| Implement write-back (production orders) | Creates PP orders |
| Set up SAP Event Mesh topics | Events flow from S/4 to BTP |

**Validation**: Planning Data Service can read 50+ live orders and 30+ coils from S/4HANA, run optimization, and write back 10 reservations without errors.

### Phase 3: Agentic Orchestration (4-6 weeks)

**Goal**: Joule orchestrates the full flow with LLM reasoning.

| Task | Output |
|------|--------|
| Configure SAP AI Core for LLM | Model deployed, accessible |
| Implement Joule orchestrator agent | Handles full planning flow |
| Connect MCP client to MCP Server | Tool calling works end-to-end |
| Implement ReAct reasoning loop | Multi-step planning with trace |
| Add what-if scenario support | Compare plans side-by-side |
| Add event-driven reactive planning | New order triggers re-plan |
| User testing with planning engineers | Feedback incorporated |

**Validation**: Planner can say "Plan all open orders" in natural language, get a complete plan with explanations, confirm it, and see SAP transactions created.

### Phase 4: Hardening (2-4 weeks)

| Task | Output |
|------|--------|
| Error handling for all SAP APIs | Graceful failures |
| Authorization checks | Role-based access |
| Audit logging | Full trace in HANA |
| Performance optimization | Sub-10s for typical instance |
| Multi-tenant support | Multiple customers on shared infra |
| Documentation for operators | Runbook |

## Key Configuration Files

### MCP Server — `pyproject.toml`

```toml
[project]
name = "trim-mcp-server"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "mcp>=1.0.0",
    "ortools>=9.8",
    "numpy>=1.24",
    "networkx>=3.0",
    "pydantic>=2.0",
    "uvicorn>=0.27",
]

[project.scripts]
serve = "src.server:main"
```

### MCP Server Entry Point — `src/server.py`

```python
from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent
import json

from .tools.feasibility import build_feasibility_network
from .tools.cutting import solve_cutting_pattern
from .tools.assignment import optimize_assignment
from .tools.evaluation import evaluate_plan
from .tools.purchasing import suggest_purchase_orders

app = Server("trim-optimization-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="build_feasibility_network",
            description="Build bipartite feasibility graph between orders and coils. Returns connected components for parallel solving.",
            inputSchema={...}  # Full schema from docs/05
        ),
        Tool(
            name="solve_cutting_pattern",
            description="Find optimal cutting pattern for a coil given assigned orders. Minimizes trim loss.",
            inputSchema={...}
        ),
        Tool(
            name="optimize_assignment", 
            description="Find globally optimal order-to-coil assignment using multi-objective optimization.",
            inputSchema={...}
        ),
        Tool(
            name="evaluate_plan",
            description="Compute KPIs for a complete assignment and cutting plan.",
            inputSchema={...}
        ),
        Tool(
            name="suggest_purchase_orders",
            description="Generate purchase recommendations for orders that cannot be served by available coils.",
            inputSchema={...}
        ),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    match name:
        case "build_feasibility_network":
            result = build_feasibility_network(**arguments)
        case "solve_cutting_pattern":
            result = solve_cutting_pattern(**arguments)
        case "optimize_assignment":
            result = optimize_assignment(**arguments)
        case "evaluate_plan":
            result = evaluate_plan(**arguments)
        case "suggest_purchase_orders":
            result = suggest_purchase_orders(**arguments)
        case _:
            raise ValueError(f"Unknown tool: {name}")
    
    return [TextContent(type="text", text=json.dumps(result, default=str))]

def main():
    import uvicorn
    from mcp.server.sse import SseServerTransport
    
    transport = SseServerTransport("/mcp")
    uvicorn.run(transport.app, host="0.0.0.0", port=8080)

if __name__ == "__main__":
    main()
```

### Planning Data Service — `srv/planning-service.cds`

```cds
using { ztrim.db as db } from '../db/schema';

service PlanningDataService @(requires: 'authenticated-user') {

  // ─── Module A: Demand Functions ───────────────────────────────────
  
  function getOrderPool(
    orderTypes: array of String,
    statusFilter: array of String,
    dueDateBefore: Date,
    productGroup: String
  ) returns {
    orders: array of Order;
    summary: OrderSummary;
  };

  function getUrgentOrders(
    horizonDays: Integer
  ) returns array of UrgentOrder;

  function getFeasibleCoilsForOrder(
    orderId: String,
    includeTransit: Boolean,
    includeSas: Boolean  
  ) returns FeasibleCoilsResult;

  function flagInfeasibleOrders() returns array of InfeasibleOrder;

  action updateFulfillment(
    orderId: String,
    coilId: String,
    allocatedTons: Decimal,
    patternId: String
  ) returns FulfillmentUpdate;

  action createProductionOrder(
    assignment: Assignment
  ) returns { sapOrderNumber: String; };

  // ─── Module B: Supply Functions ───────────────────────────────────

  function getAvailableCoils(
    asOfDate: Date,
    statusFilter: array of String,
    excludeReserved: Boolean,
    productGroup: String,
    quality: String,
    thicknessMm: Decimal,
    minWidthMm: Decimal
  ) returns {
    coils: array of Coil;
    summary: CoilSummary;
  };

  function getCoilDetails(coilId: String) returns CoilDetails;

  function getFeasibleOrdersForCoil(
    coilId: String,
    includeForecast: Boolean
  ) returns FeasibleOrdersResult;

  function getIdleCoils(thresholdDays: Integer) returns array of IdleCoil;

  action reserveCoil(
    coilId: String,
    orderId: String,
    tons: Decimal,
    reservationType: String  // "soft" | "hard"
  ) returns ReservationResult;

  action releaseReservation(reservationId: String) returns ReleaseResult;

  // ─── Module C: Cross-Domain Functions ─────────────────────────────

  function evaluateFeasibility(
    orderId: String,
    coilId: String
  ) returns FeasibilityResult;

  function getSupplyDemandBalance(
    productGroup: String,
    quality: String,
    thicknessMm: Decimal
  ) returns SupplyDemandBalance;
}
```

### BTP Deployment — `mta.yaml` (excerpt)

```yaml
_schema-version: "3.1"
ID: trim-agentic-system
version: 1.0.0

modules:
  - name: trim-planning-data-service
    type: nodejs
    path: planning-data-service
    parameters:
      memory: 512M
      disk-quota: 1024M
    requires:
      - name: trim-hana
      - name: trim-xsuaa
      - name: trim-destination
      - name: trim-event-mesh
      - name: trim-ai-core

  - name: trim-mcp-server
    type: python
    path: mcp-server
    parameters:
      memory: 1024M
      disk-quota: 512M
      command: python -m src.server
    properties:
      SOLVER_TIME_LIMIT: 30
      MAX_PARALLEL_GROUPS: 8

resources:
  - name: trim-hana
    type: com.sap.xs.hdi-container
    
  - name: trim-xsuaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      path: xs-security.json

  - name: trim-destination
    type: org.cloudfoundry.managed-service
    parameters:
      service: destination
      service-plan: lite

  - name: trim-event-mesh
    type: org.cloudfoundry.managed-service
    parameters:
      service: enterprise-messaging
      service-plan: default

  - name: trim-ai-core
    type: org.cloudfoundry.managed-service
    parameters:
      service: aicore
      service-plan: extended
```

## Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| Full plan (50 orders, 40 coils) | < 15 seconds | Group decomposition + parallel solving |
| Single order check | < 3 seconds | Direct feasibility lookup + 1 cutting solve |
| What-if comparison | < 20 seconds | Cached network + incremental re-solve |
| SAP write-back (1 reservation) | < 2 seconds | Direct BAPI call |
| Event reaction (new order) | < 30 seconds | Targeted re-plan of affected group only |

## Monitoring & Operations

### Health Checks

```
GET /health/mcp-server           → { "status": "ok", "solver": "or-tools 9.8" }
GET /health/planning-data-service → { "status": "ok", "s4_connected": true, "modules": ["demand","supply","cross-domain"] }
GET /health/ai-core              → { "status": "ok", "model": "gpt-4o", "latency_ms": 450 }
```

### Key Metrics