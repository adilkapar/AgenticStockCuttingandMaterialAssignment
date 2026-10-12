# 06 — Orchestration Flows (The System in Action)

## Overview

This document shows how the Joule agent, Planning Data Service, MCP tools, and SAP backend work together in real scenarios. Each flow shows the complete sequence of reasoning, data gathering, computation, and action.

**Architecture reminder**: Only Joule is an agent (with LLM reasoning). The Planning Data Service is a structured tool that Joule calls for SAP data. The MCP Server provides optimization computation.

---

## Flow 1: Full Planning Run

**Trigger**: User says "Plan all open orders against available stock"

This is the primary use case — the daily/weekly planning cycle.

### Sequence Diagram

```
User          Joule        PlanningDataService    MCP Server        SAP
 │              │                │                    │               │
 │─"Plan all"──►│                │                    │               │
 │              │                │                    │               │
 │              │──get_order_pool()──►                 │               │
 │              │◄──[57 orders, 142t demand]───────────│               │
 │              │                │                    │               │
 │              │──get_available_coils()──►            │               │
 │              │◄──[42 coils, 189t supply]────────────│               │
 │              │                │                    │               │
 │              │──build_feasibility_network(57 orders, 42 coils)──────►
 │              │◄──[198 edges, 8 groups, 3 infeasible orders]────────│
 │              │                │                    │               │
 │              │  [LLM Reasoning: "3 infeasible orders detected.     │
 │              │   I'll optimize what's feasible first, then handle   │
 │              │   infeasible orders separately."]                    │
 │              │                │                    │               │
 │              │──optimize_assignment(network, objectives)────────────►
 │              │◄──[38 coil assignments, 2 unplanned orders]─────────│
 │              │                │                    │               │
 │              │──solve_cutting_pattern(COIL-01, [ORD-01,ORD-05])────►
 │              │◄──[pattern: 1000mm+480mm, trim:1.3%]────────────────│
 │              │  ... (repeated for each assigned coil) ...          │
 │              │                │                    │               │
 │              │──evaluate_plan(all_assignments, all_patterns)────────►
 │              │◄──[KPIs: trim=2.4%, planned=91.2%, tardy=2]─────────│
 │              │                │                    │               │
 │              │──suggest_purchase_orders([ORD-31, ORD-44, ORD-19])───►
 │              │◄──[3 purchase recommendations]───────────────────────│
 │              │                │                    │               │
 │◄─"Plan ready: 52/57 orders planned (91.2%), 2.4% trim loss..."────│
 │              │                │                    │               │
 │─"Confirm"───►│                │                    │               │
 │              │──reserve_coil(COIL-01, ORD-01, 5t)──►               │
 │              │                │──────────────MB21───────────────────►│
 │              │──update_fulfillment(ORD-01, 5t)─────►               │
 │              │                │──────────────CO01───────────────────►│
 │              │  ... (repeated for all assignments) ...              │
 │              │                │                    │               │
 │◄─"Done. 38 reservations + 38 production orders created in SAP"────│
 │              │                │                    │               │
```

### Joule's Reasoning Trace (ReAct Pattern)

```
THOUGHT 1: User wants to plan all open orders. I need:
  - Current demand (from Planning Data Service)
  - Current supply (from Planning Data Service)
  Let me gather both first.

ACTION 1: PlanningDataService.get_order_pool(status_filter=["open","partially_planned"])
OBSERVATION 1: 57 orders, 142 tons total demand, 8 urgent (due within 7 days)

ACTION 2: PlanningDataService.get_available_coils(status_filter=["stock","in_transit"])
OBSERVATION 2: 42 coils, 189 tons total supply, 28 in stock, 14 in transit

THOUGHT 2: Supply (189t) exceeds demand (142t) — ratio 1.33. Good overall,
  but this is aggregate. Some specs may have shortages. Let me build the 
  feasibility network to see the real picture.

ACTION 3: MCP.build_feasibility_network(57 orders, 42 coils, rules)
OBSERVATION 3: 
  - 198 feasibility edges
  - 8 independent groups
  - 3 orders have zero feasible coils (infeasible)
  - Group 4 has supply/demand ratio of 0.7 (shortage!)
  - Group 2 has supply/demand ratio of 2.3 (oversupplied)

THOUGHT 3: 3 orders are infeasible — no available coil matches their specs.
  Group 4 has a shortage. I'll optimize what's feasible, then handle 
  infeasible orders separately with purchase recommendations.
  
  For objectives, I'll use balanced weights since user didn't specify priority:
  trim_loss: 0.35, tardy: 0.30, excess: 0.20, unplanned: 0.10, stock_age: 0.05

ACTION 4: MCP.optimize_assignment(network, balanced_objectives)
OBSERVATION 4: 38 coil assignments covering 52 orders. 2 additional orders
  unplanned (in Group 4 due to shortage). Total estimated trim: 2.4%

THOUGHT 4: Good result. 52/57 planned = 91.2%. Now I need cutting patterns
  for each assignment to get exact trim numbers and validate feasibility.

ACTION 5-42: MCP.solve_cutting_pattern(coil_i, orders_i) [38 calls]
OBSERVATION 5-42: All patterns feasible. Actual trim ranges from 0% to 8.2%.

ACTION 43: MCP.evaluate_plan(all assignments, all patterns)
OBSERVATION 43: Final KPIs:
  - Trim loss: 2.4% average (range 0-8.2%)
  - Orders planned: 52/57 (91.2%)
  - Tardy orders: 2 (both in Group 4, shortage-related)
  - Excess material: 12.3 tons across remaining coil weights
  - Avg stock age of used coils: 18 days

THOUGHT 5: 5 orders unplanned (3 infeasible + 2 shortage). Let me get
  purchase recommendations for all 5.

ACTION 44: MCP.suggest_purchase_orders(5 unplanned orders)
OBSERVATION 44: 3 purchase recommendations generated.

THOUGHT 6: Plan is ready. Let me present results clearly to the user
  with the key trade-offs explained.
```

### User-Facing Response

```
📋 Planning Complete — Summary

✅ 52 of 57 orders planned (91.2%)
📉 2.4% average trim loss across 38 coil assignments
⏰ 2 tardy orders (Group 4 — HDG DX51D 0.5mm shortage)
📦 12.3 tons excess material (coil remainders for future use)

⚠️  5 orders could not be planned:
  • ORD-031 (HDG DX51D 0.5mm 1200mm, 8t) — No matching coil in stock
  • ORD-044 (CR DC01 0.8mm 900mm, 5t) — No matching coil in stock  
  • ORD-019 (HDG DX51D 0.5mm 800mm, 3t) — No matching coil in stock
  • ORD-022 (HDG DX51D 0.5mm 600mm, 2t) — Shortage in Group 4
  • ORD-038 (HDG DX51D 0.5mm 750mm, 4t) — Shortage in Group 4

🛒 Purchase Recommendations Created:
  • HDG DX51D 0.5mm 1250mm coil, ~15t — covers ORD-031 + ORD-019
  • CR DC01 0.8mm 1000mm coil, ~8t — covers ORD-044
  • HDG DX51D 0.5mm 1500mm coil, ~10t — covers ORD-022 + ORD-038

Would you like to:
1. Confirm this plan (create SAP reservations + production orders)?
2. Review cutting patterns for specific coils?
3. Try different objective weights (e.g., prioritize zero tardy)?
4. See what happens if we include forecast orders too?
```

---

## Flow 2: Single Order Feasibility Check

**Trigger**: User says "Can order ORD-042 be fulfilled from current stock?"

This is a quick lookup — no optimization needed, just feasibility checking.

### Sequence

```
User: "Can ORD-042 (HDG DX51D 0.5mm 1000mm, 5 tons) be fulfilled from stock?"

Joule Reasoning:
  "Single order check. I need feasible coils for this specific order,
   then cutting patterns to show the options."

Step 1: PlanningDataService.get_feasible_coils_for_order("ORD-042")
  → 3 feasible coils found:
    COIL-4521 (1500mm, 12t) — width excess: 500mm
    COIL-4533 (1250mm, 9t)  — width excess: 250mm
    COIL-4540 (1000mm, 6t)  — width excess: 0mm (perfect!)

Step 2: MCP.solve_cutting_pattern(COIL-4540, [ORD-042])
  → trim: 0%, uses 5t of 6t coil, 1t remaining

Step 3: MCP.solve_cutting_pattern(COIL-4533, [ORD-042])  
  → trim: 20% (250mm wasted), uses 4t of 9t coil

Step 4: MCP.solve_cutting_pattern(COIL-4521, [ORD-042])
  → trim: 33% (500mm wasted) — unless we can pair with another order

Step 5 (Joule reasons): "COIL-4521 has high trim alone. Let me check 
  if there's a ~500mm order that could pair with it."
  
  PlanningDataService.get_order_pool(width_range={min:450, max:510}, 
                            product_group="HDG", quality="DX51D", 
                            thickness=0.5)
  → ORD-051 (500mm, 3t) found!

Step 6: MCP.solve_cutting_pattern(COIL-4521, [ORD-042(1000mm), ORD-051(500mm)])
  → trim: 0%! Perfect combination.
```

### User-Facing Response

```
✅ Yes, ORD-042 can be fulfilled from stock. Three options:

🏆 BEST — COIL-4540 (1000mm, 6t)
   Perfect width match → 0% trim loss
   ├── ORD-042: 1000mm × 5t ✓
   └── 1t remaining on coil
   ⚠️ Note: only 1t left — consider pairing with a small order

✅ GOOD — COIL-4521 (1500mm, 12t) + ORD-051 (500mm, 3t)
   Combined cutting → 0% trim loss  
   ├── ORD-042: 1000mm × 5t ✓
   ├── ORD-051: 500mm × 3t ✓ (bonus: plans another order!)
   └── 4t remaining on coil
   💡 This option plans 2 orders with zero waste

⚠️ ACCEPTABLE — COIL-4533 (1250mm, 9t)
   250mm trim → 20% trim loss
   ├── ORD-042: 1000mm × 4t (partial)
   └── 5t remaining on coil

❌ AVOID — COIL-4521 alone
   500mm trim → 33% trim loss (wasteful)

Recommendation: Option 2 (COIL-4521 + combined cutting) is optimal —
zero trim AND plans an additional order. Shall I reserve it?
```

---

## Flow 3: Coil Utilization Analysis

**Trigger**: User says "What's the best use of COIL-4521?"

This is the reverse problem — given a coil, find the best order combination.

### Sequence

```
User: "I have COIL-4521 (1500mm, 12t, HDG DX51D 0.5mm). Best use?"

Step 1: PlanningDataService.get_feasible_orders_for_coil("COIL-4521")
  → 7 feasible orders:
    ORD-042 (1000mm, 5t), ORD-051 (500mm, 3t), ORD-055 (750mm, 4t),
    ORD-061 (300mm, 2t), ORD-070 (1200mm, 7t), ORD-075 (480mm, 2t),
    ORD-080 (1500mm, 10t)

Step 2: Joule reasons: "7 feasible orders totaling 33t demand for a 12t coil.
  Let me find the combination that maximizes utilization and minimizes trim."

Step 3: MCP.solve_cutting_pattern(COIL-4521, all_7_orders, 
                                   {allow_partial: true, max_strips: 8})
  → Solver finds optimal combination:
    
    Option A: ORD-042(1000mm) + ORD-051(500mm) = 1500mm → 0% trim, 8t
              Then remaining 4t: ORD-055(750mm) + ORD-055(750mm) = 1500mm → 0% trim
              Total: 100% utilization, 3 orders served
    
    Option B: ORD-080(1500mm) = full width → 0% trim, 10t
              Then remaining 2t: ORD-061(300mm) × 5 strips... but 1500/300 = 5, 0 trim
              Total: 100% utilization, 2 orders served
    
    Option C: ORD-070(1200mm) + ORD-061(300mm) = 1500mm → 0% trim, 9t
              Then remaining 3t: ORD-051(500mm) + ORD-042(1000mm) = 1500mm → 0% trim
              Total: 100% utilization, 4 orders served

Step 4: Joule reasons: "Option C serves the most orders (4) with 0% trim.
  Let me check urgency to make the final recommendation."
  
  PlanningDataService.get_urgent_orders(horizon_days=14)
  → ORD-070 is due in 5 days (urgent!)

Step 5: Present recommendation with urgency context.
```

### User-Facing Response

```
🎯 Best use of COIL-4521 (1500mm, 12t, HDG DX51D 0.5mm):

🏆 RECOMMENDED — Option C (serves 4 orders, 0% trim)
   Pass 1: ORD-070 (1200mm) + ORD-061 (300mm) = 1500mm → 9t
   Pass 2: ORD-051 (500mm) + ORD-042 (1000mm) = 1500mm → 3t
   ├── 0% trim loss (perfect utilization!)
   ├── 4 orders served from a single coil
   └── ⚠️ ORD-070 is due in 5 days — this covers the urgent one

   Alternative options available if priorities differ.
   Shall I reserve COIL-4521 for this combination?
```

---

## Flow 4: Reactive Re-Planning (Event-Driven)

**Trigger**: SAP Event Mesh publishes "New coil goods receipt"

### Sequence

```
Event: sap/s4/mm/inventory/GoodsReceipt
  → coil_id: COIL-4560, HDG DX51D 0.5mm 1250mm, 15t

Joule receives event and reasons:
  "A new coil arrived. Let me check if any previously unplanned orders 
   can now be served."

Step 1: PlanningDataService.get_feasible_orders_for_coil("COIL-4560")
  → 2 orders match:
    ORD-031 (1200mm, 8t) — previously unplanned!
    ORD-019 (800mm, 3t)  — previously unplanned!

Step 2: Joule reasons: "Both ORD-031 and ORD-019 were flagged as unplanned 
  in the last run because no coil was available. Now COIL-4560 matches both!"

Step 3: MCP.solve_cutting_pattern(COIL-4560, [ORD-031, ORD-019])
  → trim: 20% (1200mm + 800mm... wait, that's 2000mm > 1250mm)
  → Solver tries: ORD-031 alone: 1200/1250 = 4% trim ✓
  → Or: ORD-019 alone: 800/1250 = 36% trim (bad)
  → Conclusion: Best to use for ORD-031 (near-perfect match)

Step 4: Notify planner proactively.
```

### User-Facing Notification

```
🔔 New Coil Arrival — Planning Opportunity

COIL-4560 (HDG DX51D 0.5mm 1250mm, 15t) just arrived in stock.

This matches ORD-031 which was previously unplanned!
├── ORD-031: 1200mm, 8t — trim loss only 4%
├── This order was flagged as "no matching coil" in yesterday's plan
└── Due in 12 days — still within planning window

Recommended action: Reserve COIL-4560 for ORD-031.
Shall I proceed?
```

---

## Summary: How Flows Map to Components

| Flow | Planning Data Service calls | MCP Server calls | SAP Write-backs |
|------|---------------------------|-----------------|-----------------|
| Full planning run | get_order_pool, get_available_coils, reserve_coil, update_fulfillment | build_feasibility_network, optimize_assignment, solve_cutting_pattern, evaluate_plan, suggest_purchase_orders | MM Reservations, PP Production Orders |
| Single order check | get_feasible_coils_for_order, get_order_pool | solve_cutting_pattern (multiple) | None (unless user confirms) |
| Coil utilization | get_feasible_orders_for_coil, get_urgent_orders | solve_cutting_pattern | None (unless user confirms) |
| Reactive re-plan | get_feasible_orders_for_coil | solve_cutting_pattern | MM Reservation (if confirmed) |
