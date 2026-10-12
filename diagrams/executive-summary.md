# Executive Summary — Agentic Stock Cutting & Material Assignment

## One-Page System Overview

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║   AGENTIC STOCK CUTTING & MATERIAL ASSIGNMENT                              ║
║   SAP-Native Design for Steel Service Centers                              ║
║                                                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║   USER (Planning Engineer)                                                 ║
║     │                                                                      ║
║     │  "Plan all open orders"                                              ║
║     │  "Can ORD-042 be fulfilled?"                                         ║
║     │  "What's the best use of COIL-4521?"                                 ║
║     ▼                                                                      ║
║   ┌────────────────────────────────────────────────────────────────────┐   ║
║   │                    SAP JOULE (The Only Agent)                       │   ║
║   │                                                                    │   ║
║   │   LLM Reasoning (ReAct):  Think → Act → Observe → Repeat          │   ║
║   │   • Understands intent    • Decomposes problems                    │   ║
║   │   • Calls tools/services  • Explains trade-offs                    │   ║
║   │   • Handles exceptions    • Confirms SAP write-back                │   ║
║   └──────────────┬─────────────────────────────────┬───────────────────┘   ║
║                  │                                 │                        ║
║        ┌─────────▼─────────────────┐     ┌────────▼─────────┐             ║
║        │  PLANNING DATA SERVICE    │     │                   │             ║
║        │  (Unified SAP Layer)      │     │                   │             ║
║        │                           │     │                   │             ║
║        │ Demand: 57 open orders    │     │                   │             ║
║        │ Supply: 42 avail coils    │     │                   │             ║
║        │ Cross: Feasibility eval   │     │                   │             ║
║        │ Write: Reservations       │     │                   │             ║
║        │                           │     │                   │             ║
║        │ Source: SAP SD + MM + PP  │     │                   │             ║
║        └─────────┬─────────────────┘     │                   │             ║
║                  │                        │                   │             ║
║                  └───────────┬────────────┘                   │             ║
║                              │                                │             ║
║                              ▼                                │             ║
║        ┌─────────────────────────────────────────────────────────┐         ║
║        │              MCP SERVER (Optimization Tools)             │         ║
║        │                                                         │         ║
║        │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │         ║
║        │  │ Feasibility  │  │   Cutting    │  │ Assignment  │  │         ║
║        │  │   Network    │  │   Patterns   │  │  Optimizer  │  │         ║
║        │  │              │  │              │  │             │  │         ║
║        │  │ 13-param     │  │ 1D/2D bin-  │  │ Multi-obj   │  │         ║
║        │  │ matching +   │  │ packing     │  │ MILP with   │  │         ║
║        │  │ connected    │  │ (OR-Tools)  │  │ 5 weighted  │  │         ║
║        │  │ components   │  │             │  │ objectives  │  │         ║
║        │  └──────────────┘  └──────────────┘  └─────────────┘  │         ║
║        │                                                         │         ║
║        │  ┌──────────────┐  ┌──────────────┐                   │         ║
║        │  │    Plan      │  │  Purchase    │                   │         ║
║        │  │  Evaluator   │  │  Recommender │                   │         ║
║        │  │  (KPIs)      │  │  (for gaps)  │                   │         ║
║        │  └──────────────┘  └──────────────┘                   │         ║
║        └─────────────────────────────────────────────────────────┘         ║
║                                                                            ║
║                                  │                                          ║
║                    ┌─────────────▼─────────────┐                           ║
║                    │    SAP S/4HANA BACKEND     │                           ║
║                    │                           │                           ║
║                    │  READ:  OData/CDS Views   │                           ║
║                    │  WRITE: Reservations (MB21)│                           ║
║                    │         Prod Orders (CO01) │                           ║
║                    │         Purch Reqs (ME51N) │                           ║
║                    │  EVENTS: New orders/coils  │                           ║
║                    └───────────────────────────┘                           ║
║                                                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║   KEY OUTCOMES                                                             ║
║                                                                            ║
║   📉 2-4% trim loss (vs 8-15% manual)     ✅ 90%+ orders planned          ║
║   ⏱️  <15 sec planning time (vs hours)     🔄 Event-driven re-planning     ║
║   💬 Natural language interaction          📋 Full SAP transaction trail   ║
║                                                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## The Value Chain

```
PROBLEM                     SOLUTION                    OUTCOME
─────────────              ──────────                  ─────────
Coils purchased            Feasibility network         Right coil matched
before orders exist   →    with 13-parameter      →   to right order
                          exact matching              

Multiple orders            Multi-objective             Minimal trim waste
compete for same      →    MILP optimizer with    →   + maximum orders
coil                       5 weighted objectives      planned

Manual planning            Agentic orchestration      Sub-15-second plans
takes hours,          →    with LLM reasoning     →   with full
is person-dependent        and SAP write-back         explanation

Plans break when           Event-driven reactive      Continuous plan
new orders/coils      →    re-planning via SAP    →   integrity without
arrive                     Event Mesh                  manual intervention
```

## Why Agentic (Not Just Optimization)

```
Traditional:  User → Button → API → Result → Manual SAP entry
                     ↑                              ↑
              Fixed interface              No explanation
              No flexibility              Error-prone

Agentic:      User → Natural Language → Joule reasons → Tools solve
                                          ↓
                                    Explains trade-offs
                                          ↓
                                    Suggests alternatives  
                                          ↓
                                    Writes to SAP (confirmed)
                                          ↓
                                    Reacts to changes (events)
```

## For the SAP Customer

| What They Get | How |
|--------------|-----|
| Plans that actually work in SAP | Direct write-back to MM/PP (reservations + prod orders) |
| No new UI to learn | Joule is embedded in SAP Fiori — planners stay in their tool |
| Explanations, not black boxes | LLM explains why each assignment was made |
| Handles the unexpected | Agent reasons about novel scenarios without new development |
| Scales with business | Multi-tenant BTP deployment; group decomposition for performance |
| Data stays in SAP | BTP AI Core for LLM; no data leaves the SAP ecosystem |