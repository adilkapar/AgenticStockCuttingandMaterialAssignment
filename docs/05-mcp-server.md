# 05 — MCP Server (Optimization Tool Provider)

## What is the MCP Server?

The MCP (Model Context Protocol) Server is a **stateless optimization service** that exposes mathematical solvers as tools that the Joule orchestrator can call. It follows the MCP standard, meaning:

- Tools are registered with JSON Schema descriptions
- The LLM sees these schemas and decides which tool to call
- Tools receive structured input, run computation, return structured output
- No business logic, no SAP awareness — pure optimization

## Why MCP (vs. plain REST API)?

| Aspect | Plain REST API | MCP Protocol |
|--------|---------------|--------------|
| Discovery | Developer reads docs | LLM reads tool schemas automatically |
| Invocation | Hardcoded API calls | LLM decides which tool + parameters |
| Composition | Developer writes orchestration | LLM reasons about tool chaining |
| Adaptability | New endpoint = new code | New tool = LLM immediately uses it |
| Context | Stateless request/response | Session context maintained by MCP client |

MCP makes the optimization engine **directly usable by the LLM agent** without glue code for each scenario.

## MCP Server Configuration

```json
{
  "name": "trim-optimization-server",
  "version": "1.0.0",
  "description": "Stock cutting and material assignment optimization tools for steel service centers",
  "tools": [
    "build_feasibility_network",
    "solve_cutting_pattern", 
    "optimize_assignment",
    "evaluate_plan",
    "suggest_purchase_orders"
  ],
  "transport": "sse",
  "runtime": "python",
  "solver_backend": "or-tools"
}
```

---

## Tool 1: `build_feasibility_network`

### Purpose
Constructs the bipartite feasibility graph connecting orders to compatible coils. Decomposes into independent problem groups (connected components) for parallel solving.

This is the **foundation step** — all other tools depend on this network.

### Why This Matters
From the TRIM PDF: the problem naturally decomposes into independent groups. A group is a set of orders and coils where at least one coil is feasible for at least one order in the set. Groups with no shared coils/orders are independent and can be solved in parallel.

### MCP Tool Schema

```json
{
  "name": "build_feasibility_network",
  "description": "Build bipartite feasibility graph between orders and coils. Returns connected components (independent problem groups) for parallel solving.",
  "inputSchema": {
    "type": "object",
    "required": ["orders", "coils", "rules"],
    "properties": {
      "orders": {
        "type": "array",
        "items": { "$ref": "#/definitions/Order" },
        "description": "Pool of orders to plan"
      },
      "coils": {
        "type": "array", 
        "items": { "$ref": "#/definitions/Coil" },
        "description": "Pool of available coils"
      },
      "rules": {
        "type": "object",
        "properties": {
          "trim_allowance_mm": { "type": "number", "default": 10 },
          "processing_lead_time_days": { "type": "number", "default": 3 },
          "min_allocation_tons": { "type": "number", "default": 0.5 }
        },
        "description": "Feasibility rule parameters"
      },
      "planning_date": {
        "type": "string",
        "format": "date",
        "description": "Reference date for availability checks"
      }
    }
  }
}
```

### Output Schema

```json
{
  "type": "object",
  "properties": {
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string" },
          "coil_id": { "type": "string" },
          "width_excess_mm": { "type": "number" },
          "weight_coverage_ratio": { "type": "number" },
          "days_slack": { "type": "number" },
          "trim_potential_pct": { "type": "number" }
        }
      }
    },
    "groups": {
      "type": "array",
      "description": "Connected components — independent sub-problems",
      "items": {
        "type": "object",
        "properties": {
          "group_id": { "type": "string" },
          "order_ids": { "type": "array", "items": { "type": "string" } },
          "coil_ids": { "type": "array", "items": { "type": "string" } },
          "total_demand_tons": { "type": "number" },
          "total_supply_tons": { "type": "number" },
          "supply_demand_ratio": { "type": "number" }
        }
      }
    },
    "infeasible_orders": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Orders with zero feasible coils"
    },
    "unmatched_coils": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Coils with zero feasible orders"
    },
    "summary": {
      "type": "object",
      "properties": {
        "total_edges": { "type": "number" },
        "total_groups": { "type": "number" },
        "avg_edges_per_order": { "type": "number" },
        "coverage_pct": { "type": "number" },
        "sparsity": { "type": "number" }
      }
    }
  }
}
```

### Algorithm (Pseudocode)

```python
def build_feasibility_network(orders, coils, rules, planning_date):
    edges = []
    
    for order in orders:
        for coil in coils:
            if is_feasible(order, coil, rules, planning_date):
                edge = {
                    "order_id": order.id,
                    "coil_id": coil.id,
                    "width_excess_mm": coil.width_mm - order.width_mm,
                    "weight_coverage_ratio": coil.remaining_weight / order.quantity_tons,
                    "days_slack": (order.due_date - coil.arrival_date).days - rules.processing_lead_time_days,
                    "trim_potential_pct": (coil.width_mm - order.width_mm) / coil.width_mm * 100
                }
                edges.append(edge)
    
    # Build graph and find connected components
    graph = build_bipartite_graph(edges)
    groups = find_connected_components(graph)
    
    # Identify isolated nodes
    infeasible_orders = [o.id for o in orders if not has_edge(o.id, edges)]
    unmatched_coils = [c.id for c in coils if not has_edge_to(c.id, edges)]
    
    return { edges, groups, infeasible_orders, unmatched_coils, summary }
```

---

## Tool 2: `solve_cutting_pattern`

### Purpose
For a given coil and set of assigned orders, find the optimal cutting pattern that minimizes trim loss. Handles all four operation types from the TRIM PDF.

### Mathematical Formulation (1D Cutting Stock — Slitting)

```
Given:
  W = coil width (mm)
  w_i = width required by order i (mm)
  d_i = demand of order i (tons) — convertible to length needed
  T = trim allowance per side (mm)

Minimize:
  trim_loss = W - sum(x_i * w_i) - 2*T    (where x_i = number of strips of width w_i)

Subject to:
  sum(x_i * w_i) + 2*T <= W               (strips must fit in coil width)
  x_i >= 0, integer                         (non-negative integer strips)
  x_i * w_i * (weight_per_mm_width) <= remaining demand for order i
```

For **combined operations** (slitting + CTL), this becomes a 2D problem solved sequentially:
1. First solve the width assignment (slitting pattern)
2. Then for each strip, solve the length assignment (CTL pattern)

### MCP Tool Schema

```json
{
  "name": "solve_cutting_pattern",
  "description": "Find optimal cutting pattern for a coil given assigned orders. Minimizes trim loss while respecting machine constraints.",
  "inputSchema": {
    "type": "object",
    "required": ["coil", "orders"],
    "properties": {
      "coil": {
        "type": "object",
        "properties": {
          "coil_id": { "type": "string" },
          "width_mm": { "type": "number" },
          "weight_tons": { "type": "number" },
          "remaining_weight_tons": { "type": "number" }
        }
      },
      "orders": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "order_id": { "type": "string" },
            "width_mm": { "type": "number" },
            "quantity_tons": { "type": "number" },
            "length_mm": { "type": "number" },
            "operation_type": { 
              "type": "string",
              "enum": ["slitting", "cut_to_length", "slitting_ctl", "slitting_slitting"]
            }
          }
        }
      },
      "constraints": {
        "type": "object",
        "properties": {
          "max_strips_per_pass": { "type": "integer", "default": 12 },
          "min_strip_width_mm": { "type": "number", "default": 20 },
          "trim_allowance_per_side_mm": { "type": "number", "default": 5 },
          "max_trim_loss_pct": { "type": "number", "default": 15 },
          "allow_partial_fulfillment": { "type": "boolean", "default": true },
          "knife_width_mm": { "type": "number", "default": 3 }
        }
      }
    }
  }
}
```

### Output Schema

```json
{
  "type": "object",
  "properties": {
    "pattern_id": { "type": "string" },
    "feasible": { "type": "boolean" },
    "passes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "pass_number": { "type": "integer" },
          "operation_type": { "type": "string" },
          "strips": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "order_id": { "type": "string" },
                "width_mm": { "type": "number" },
                "length_mm": { "type": "number" },
                "pieces": { "type": "integer" },
                "weight_tons": { "type": "number" }
              }
            }
          },
          "trim_loss_mm": { "type": "number" },
          "trim_loss_pct": { "type": "number" },
          "knife_loss_mm": { "type": "number" }
        }
      }
    },
    "total_trim_loss_pct": { "type": "number" },
    "total_trim_loss_tons": { "type": "number" },
    "coil_utilization_pct": { "type": "number" },
    "coil_weight_used_tons": { "type": "number" },
    "coil_weight_remaining_tons": { "type": "number" },
    "orders_fulfilled": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string" },
          "fulfilled_tons": { "type": "number" },
          "remaining_tons": { "type": "number" }
        }
      }
    }
  }
}
```

### Algorithm

```python
def solve_cutting_pattern(coil, orders, constraints):
    if all(o.operation_type == "slitting" for o in orders):
        return solve_1d_slitting(coil, orders, constraints)
    elif all(o.operation_type == "cut_to_length" for o in orders):
        return solve_1d_ctl(coil, orders, constraints)
    else:
        return solve_multi_pass(coil, orders, constraints)

def solve_1d_slitting(coil, orders, constraints):
    """
    Classic 1D bin-packing / cutting stock.
    Use OR-Tools CP-SAT or knapsack solver.
    
    Objective: maximize sum of strip widths (= minimize trim)
    Constraint: sum of strips + knife losses + trim allowance <= coil width
    """
    from ortools.sat.python import cp_model
    
    model = cp_model.CpModel()
    W = coil.width_mm - 2 * constraints.trim_allowance_per_side_mm
    
    # Decision variables: how many strips of each order width
    x = {}
    for i, order in enumerate(orders):
        max_strips = min(
            W // order.width_mm,
            constraints.max_strips_per_pass
        )
        x[i] = model.NewIntVar(0, max_strips, f'strips_{order.order_id}')
    
    # Width constraint
    total_width = sum(x[i] * orders[i].width_mm for i in range(len(orders)))
    knife_count = sum(x[i] for i in range(len(orders))) - 1  # knives between strips
    model.Add(total_width + knife_count * constraints.knife_width_mm <= W)
    
    # Weight constraint per order
    for i, order in enumerate(orders):
        weight_per_strip = coil.remaining_weight_tons * (order.width_mm / coil.width_mm)
        model.Add(x[i] * weight_per_strip_int <= order.quantity_tons_int)
    
    # Objective: maximize width utilization
    model.Maximize(total_width)
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.Solve(model)
    
    return build_pattern_result(solver, x, coil, orders, constraints)
```

---

## Tool 3: `optimize_assignment`

### Purpose
Given the feasibility network, find the globally optimal assignment of orders to coils using weighted multi-objective optimization. This is the **core decision** tool.

### Mathematical Formulation

```
Sets:
  I = set of orders
  J = set of coils
  E = set of feasible edges (i,j) from feasibility network

Decision Variables:
  x_ij = tons of order i allocated from coil j  (continuous, >= 0)
  y_ij = 1 if order i is assigned to coil j     (binary)