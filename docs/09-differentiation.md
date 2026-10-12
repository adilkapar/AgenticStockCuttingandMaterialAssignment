# 09 — What Makes This Truly "Agentic" (And How This Design Differs)

## The Core Question

> "Why not just build an optimization API with a chatbot on top?"

This document explains what makes the system genuinely **agentic** versus a traditional optimization service, and articulates the key design differences from other proposed approaches.

---

## What "Agentic" Actually Means Here

An agent is not just an API wrapper with natural language. An agent:

1. **Perceives** its environment (SAP state changes via events)
2. **Reasons** about what to do (LLM-driven multi-step planning)
3. **Acts** on the world (writes back to SAP)
4. **Learns** from feedback (user corrections refine future behavior)
5. **Handles novelty** (scenarios not pre-coded can still be addressed)

### The Litmus Test

Ask yourself: *"If a scenario occurs that the developer never explicitly coded for, does the system still work?"*

| Scenario | Traditional API | This Agentic System |
|----------|----------------|---------------------|
| User asks "What if we relax the passivation constraint?" | 404 — no endpoint for this | Joule reasons: remove passivation check → rebuild network → re-optimize → compare KPIs |
| A coil arrives damaged (weight reduced by 2t) | Manual re-plan needed | Event triggers → Planning Data Service updates → Joule re-evaluates affected orders |
| User says "Prioritize the customer ACME Corp orders" | New feature request | Joule adjusts priority scores on ACME orders → re-runs with higher urgency weight |
| Two orders for same spec but different due dates | Hardcoded priority logic | LLM reasons about trade-off: use older coil for urgent order, newer for later |
| "Show me why ORD-044 can't be planned" | Error code + log | Joule calls evaluate_feasibility → presents parameter-by-parameter comparison in plain language |

---

## Key Differences from the Other LLM's Proposal

### Difference 1: No Fake Agents — Clean Architecture

**Other approach**: Splits data access into "Order Agent" and "Stock Agent" that have no LLM, no autonomous reasoning, and explicitly cannot make decisions — yet are called "agents."

**This design**: 
- **Joule** = the only agent (has LLM, reasons autonomously, makes decisions)
- **Planning Data Service** = a unified CAP service for all SAP data access (demand + supply + cross-domain)
- **MCP Server** = stateless optimization tools
- **Feasibility** is a cross-domain function within the Planning Data Service that naturally accesses both order and coil data

This separation means:
- No architectural confusion (services are called services, agents are called agents)
- Cross-domain operations (like feasibility) are trivial — same service, same data
- Single deployment unit for all SAP integration
- Clear decision authority: only Joule decides

### Difference 2: The LLM Does Orchestration, Not Optimization

**Other approach**: Somewhat ambiguous about where the LLM adds value vs. where the solver does the work.

**This design makes it crystal clear**:

```
LLM's job:                          Solver's job:
─────────────                       ────────────
• Understand user intent            • Solve MILP/CP-SAT problems
• Decide WHICH tool to call         • Find optimal cutting patterns
• Decide WHAT parameters to use     • Find optimal assignments
• Interpret and explain results     • Compute KPIs
• Handle exceptions                 • Build feasibility networks
• Suggest next steps                • Mathematical computation
• Write SAP transactions            
```

The LLM is **terrible at math** but **excellent at reasoning about what math to do**. We never ask the LLM to calculate a cutting pattern. We ask it to decide whether to run the cutting solver with 3 orders or 5 orders, and to explain why the result has 8% trim loss.

### Difference 3: Connected Component Decomposition is First-Class

**Other approach**: Mentions groups but doesn't emphasize the architectural significance.

**This design**: The group decomposition from the TRIM PDF is a **first-class architectural pattern**:

```
Full Problem (57 orders × 42 coils = 2394 potential pairs)
    │
    ▼ build_feasibility_network()
    │
    ├── Group 1: 18 orders × 12 coils  (solved in 2s)
    ├── Group 2: 22 orders × 18 coils  (solved in 5s)  
    ├── Group 3: 5 orders × 4 coils    (solved in 0.3s)
    ├── Group 4: 8 orders × 6 coils    (solved in 1s)
    └── Groups 5-8: small groups       (solved in <0.5s each)
    
    Total: 8 parallel solves, max 5s wall-clock time
    vs. monolithic: potentially minutes for combined problem
```

This matters because:
- **Speed**: Parallel solving means sub-10-second response for typical instances
- **Scalability**: Each group is an independent optimization — can distribute across workers
- **Explainability**: "Group 4 has a shortage" is more actionable than "the solver is infeasible"
- **Incremental re-planning**: When a new order arrives, only its group needs re-solving

### Difference 4: SAP Write-Back is Concrete, Not Hand-Wavy

**Other approach**: Says "writes to SAP" without specifying which APIs, which transactions, which error handling.

**This design**: Provides:
- Actual CDS view definitions for data extraction
- Actual BAPI call sequences for reservation creation
- Actual Production Order API usage
- Event Mesh topic definitions for reactive triggers
- Error handling patterns for SAP-specific failure modes

This is critical for SAP customers because:
- SAP integrations are complex (authorization objects, number ranges, custom fields)
- A design that doesn't address write-back specifics won't be implementable
- The planning result is worthless if it can't be actioned in SAP

### Difference 5: Reactive Re-Planning via Events

**Other approach**: Primarily user-initiated (manual prompt triggers).

**This design**: Includes **event-driven reactive patterns**:

```
SAP Event Mesh                     System Reaction
──────────────                     ───────────────
New coil GR (goods receipt)   →    Check if any unplanned orders now feasible
New sales order created       →    Run feasibility + suggest best coil
Order date changed            →    Re-evaluate if current assignment still valid
Supplier delay notification   →    Flag at-risk orders + suggest alternatives
```

This means the system is **proactive** — it doesn't wait for the planner to ask. When a coil arrives that matches an unplanned order, the system can notify: *"COIL-4560 just arrived and matches ORD-031 which was previously unplanned. Shall I reserve it?"*

### Difference 6: What-If Scenarios are Native

**Other approach**: Mentions what-if but doesn't show the mechanism.

**This design**: What-if is a natural consequence of the agent architecture:

```
User: "What if we include forecast orders in the plan?"

Joule reasoning:
  1. Current plan: 52/57 confirmed orders planned
  2. Let me re-gather with forecasts included
  3. PlanningDataService.get_order_pool(order_types=["confirmed","forecast"])
     → 57 confirmed + 23 forecast = 80 orders
  4. Re-run feasibility network with 80 orders
  5. Re-optimize with same objectives
  6. Compare KPIs: old plan vs new plan
  7. Present delta to user

Result:
  "Including forecasts:
   • 12 additional orders could be planned using idle coils
   • Trim loss drops from 2.4% to 1.8% (forecasts fill gaps!)
   • 3 currently idle coils would get utilized
   • But: 2 confirmed orders would get different (slightly worse) coils
   Trade-off: better overall utilization, minor risk to 2 confirmed orders.
   Want to proceed?"
```

The agent can run any what-if by simply changing the inputs and comparing outputs. No new code needed.

### Difference 7: Explanation is Built-In, Not Bolted On

**Other approach**: LLM generates explanations from results.

**This design**: Explanation is **architectural** — every decision has a traceable reasoning chain:

```
Why was ORD-042 assigned to COIL-4521 instead of COIL-4540?

Reasoning trace:
  1. COIL-4540 (1000mm) is a perfect width match for ORD-042 (1000mm)
  2. But COIL-4540 only has 6t remaining
  3. ORD-042 needs 5t, leaving 1t — too small to serve any other order
  4. COIL-4521 (1500mm) paired with ORD-051 (500mm) gives 0% trim
     AND serves an additional order
  5. Objective weights: trim_loss(0.35) + unplanned_orders(0.10) 
     → saving one additional order was worth the assignment swap
  
  Bottom line: COIL-4521 was chosen because it serves 2 orders with 
  0% trim, versus COIL-4540 which serves 1 order with 0% trim but 
  wastes 1t of coil capacity.
```

This is possible because:
- The optimizer returns objective contributions per assignment
- The LLM can trace the decision logic using the evaluation tool
- The user gets domain-relevant explanations, not solver dumps

---

## The "Agentic Ladder" — Where Each Component Adds Intelligence

```
Level 0: Manual Planning
  └── Human uses spreadsheet, trial-and-error
      Value: baseline (hours of work, suboptimal results)

Level 1: Optimization API
  └── Solver finds optimal plan given fixed inputs
      Value: better plans (+15-30% trim reduction)
      Gap: no context awareness, no explanation, no SAP integration

Level 2: Optimization API + Chatbot
  └── User can ask questions, chatbot calls API
      Value: easier access to optimization
      Gap: chatbot can't reason about multi-step scenarios

Level 3: Agentic System (THIS DESIGN)
  └── Agents reason, delegate, explain, act, react
      Value: 
        • Autonomous planning (event-driven, not just user-triggered)
        • What-if exploration without developer intervention
        • Plain-language explanations of every decision
        • Graceful handling of novel scenarios
        • End-to-end: from SAP read → optimize → SAP write-back
        • Continuous improvement via user feedback
      
      This is where the real SAP customer value lives.
```

---

## Why SAP Joule as Orchestrator (vs. Custom Agent Framework)

| Factor | Custom Framework (LangChain etc.) | SAP Joule |
|--------|----------------------------------|-----------|
| SAP auth integration | Build from scratch | Native XSUAA/IAS integration |
| S/4HANA connectivity | Manual OData/RFC setup | Built-in destination management |
| Enterprise compliance | DIY audit, DPP, retention | SAP standard compliance |
| Multi-tenant | Architecture from scratch | BTP native multi-tenancy |
| LLM hosting | External provider + key mgmt | BTP AI Core (data residency) |
| Agent lifecycle | Custom deployment | SAP Build managed agents |
| User experience | Custom UI | Joule embedded in Fiori |
| Support & maintenance | Team responsibility | SAP support path |

For SAP customers, Joule removes the "last mile" problem: the optimization engine already exists, but getting it into the planner's daily workflow inside SAP Fiori is what Joule uniquely enables.

---

## Summary: The Three Levels of Value

```
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 3: AGENTIC VALUE (This Design)                       │
│  ─────────────────────────────────────                       │
│  • Autonomous event-driven re-planning                      │
│  • What-if scenario exploration                             │
│  • Natural language trade-off explanation                    │
│  • Novel scenario handling without new code                 │
│  • Continuous learning from planner feedback                │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 2: INTEGRATION VALUE                                  │
│  ──────────────────────────                                  │
│  • SAP read (live orders + inventory)                       │
│  • SAP write-back (reservations + production orders)        │
│  • Event-driven triggers (new orders, coil arrivals)        │
│  • Audit trail and authorization                            │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 1: OPTIMIZATION VALUE                                 │
│  ────────────────────────────                                │
│  • Feasibility network construction                         │
│  • Optimal cutting patterns (minimize trim)                 │
│  • Optimal assignment (multi-objective)                     │
│  • Connected component decomposition (speed)                │
│  • KPI evaluation and comparison                            │
└─────────────────────────────────────────────────────────────┘
```

Each level builds on the one below. The optimization provides the mathematical foundation. The SAP integration makes it actionable. The agentic layer makes it intelligent, adaptive, and accessible to planners who think in business terms, not mathematical formulations.