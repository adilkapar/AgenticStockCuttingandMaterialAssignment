# 01 — Problem Definition

## The Business Problem

Steel Service Centers (Çelik Servis Merkezleri) purchase large raw material coils from producers and process them into smaller products for end customers through operations like:

- **Slitting (Dilme)**: Cutting a wide coil into narrower strips
- **Cut-to-Length (Boy Kesme)**: Cutting strips into sheets of specific lengths
- **Combined operations**: Slitting + CTL, Slitting + Slitting

The fundamental challenge: **raw material must be procured before customer orders exist**, because supplier lead times exceed order confirmation horizons. This creates a structurally hard assignment problem.

```
Timeline:
─────────────────────────────────────────────────────────►
     │                          │                    │
     Purchase                   Coils                Orders
     Decision                   Arrive               Confirmed
     (forecast-based)           (stock)              (actual demand)
```

## What This System Solves (Reduced Scope)

From the full TRIM problem set, we focus on **two tightly coupled sub-problems**:

### Sub-Problem 1: Material Assignment
> Given a pool of orders (confirmed + forecast) and available coils (stock / in-transit / purchase-order), find the **optimal assignment** of coils to orders respecting all feasibility constraints.

### Sub-Problem 2: Stock Cutting (Pattern Generation)
> For each coil-to-orders assignment, determine the **optimal cutting pattern** (how to slit/cut the coil) that minimizes trim loss while fulfilling the assigned orders.

### What We Explicitly Exclude
- Line balancing (hat dengeleme)
- Scheduling/Sequencing (çizelgeleme)
- MRP/Procurement execution
- Demand forecasting algorithm

These are upstream/downstream concerns. Our system may **trigger** procurement recommendations but does not execute the MRP run itself.

## The Five Optimization Objectives

From the TRIM PDF, the objectives relevant to our scope:

| # | Objective | Turkish | Metric |
|---|-----------|---------|--------|
| 1 | Minimize tardy orders | Termin sapmaları minimizasyonu | Count of orders where planned date > due date |
| 2 | Minimize trim loss | Fire minimizasyonu | % of raw material wasted as scrap |
| 3 | Minimize excess raw material | Yan parça minimizasyonu | Tons of coil remainder with no planned use |
| 4 | Minimize unplanned orders | Planlanmamış sipariş minimizasyonu | Count of orders with no feasible assignment |
| 5 | Minimize stock waiting time | Stokta bekleme süresinin minimizasyonu | Average days coils sit idle |

These objectives **conflict** with each other. For example:
- Minimizing trim loss may require waiting for a "perfect width" coil (conflicts with Obj 5)
- Planning all orders may require accepting higher trim loss (Obj 4 vs Obj 2)
- Using oldest coils first (Obj 5) may not produce the best cutting patterns (Obj 2)

This multi-objective trade-off is where the **agentic reasoning** adds value — the LLM can explain trade-offs and help users choose.

## Why Standard SAP Cannot Solve This

| SAP Capability | Gap |
|---------------|-----|
| SAP PP/MRP | Plans material needs but doesn't solve combinatorial cutting optimization |
| SAP APO/IBP | Demand planning and S&OP, not cutting-pattern-level optimization |
| SAP MM | Manages inventory but doesn't reason about optimal assignment |
| Manual planning | Works for small scale but doesn't scale; depends on individual expertise |

The TRIM PDF explicitly states: *"Neredeyse siparişe özel hammadde tedarik etme gereksinimi var"* — raw materials are almost order-specific, creating a nearly 1:1 matching requirement with 13+ parameters to satisfy.

## Why An Agentic Approach (vs. Just an Optimization API)

A pure optimization API would solve the math. But the real-world problem requires:

1. **Context retrieval**: Pulling live data from SAP (orders change, coils arrive, reservations shift)
2. **Reasoning about constraints**: Deciding when to relax constraints vs. reject orders
3. **Iterative refinement**: Re-planning when new orders arrive or coils are delayed
4. **Explanation**: Telling the planner *why* a coil was assigned and what the trade-offs are
5. **Action execution**: Writing results back to SAP (reservations, production orders)
6. **Exception handling**: Flagging infeasible situations and suggesting remediation

An **agent** can do all of this autonomously, while a pure API requires orchestration code for every scenario.

## Problem Scale (Typical Instance)

| Dimension | Typical Range |
|-----------|--------------|
| Active orders | 50–500 |
| Available coils (stock + transit) | 30–300 |
| Feasibility parameters per match | 13 |
| Possible assignment combinations | Combinatorial explosion (NP-hard) |
| Connected components (groups) | 5–30 independent sub-problems |
| Planning horizon | 2–6 weeks |
| Re-planning frequency | Daily or event-driven |

The **connected component decomposition** (from TRIM PDF page 6) is critical: the feasibility network naturally breaks into independent groups that can be solved in parallel.