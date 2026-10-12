# Context-Setting Slide Deck: Why Stock Cutting & Material Assignment is Hard

## Purpose
This slide deck prepares a **non-industry audience** to understand:
1. How mill products supply chains work (forecast → procure → receive → match → cut)
2. Why long-term MRP based on forecasts creates the assignment problem
3. What happens when actual orders arrive and don't match available stock
4. How this leads to the stock cutting + material assignment optimization challenge
5. Then transitions to the agentic AI solution approach

---

## SLIDE 1 — Title Slide

**Title**: "The Material Assignment & Stock Cutting Challenge in Mill Products"

**Subtitle**: "Why AI-Powered Planning is Needed When You Must Buy Before You Sell"

**Visual**: A timeline arrow showing: Forecast → Purchase → Material Arrives → Customer Orders → ??? → Cut & Deliver

---

## SLIDE 2 — The Mill Products Value Chain (Simple Overview)

**Title**: "What Does a Mill Products Processor Do?"

**Visual**: Simple flow diagram

**Content**:
```
SUPPLIER                    PROCESSOR                      CUSTOMER
(Steel Mill,                (Service Center,               (Manufacturer,
 Paper Mill,                 Converter,                     Construction,
 Aluminum Smelter)           Slitter)                       Packaging Co.)
                                    
Large Raw Material    →    Cut / Slit / Sheet    →    Smaller Pieces
(Coils, Rolls, Sheets)     to Customer Specs          to Exact Order
                                    
Width: 1000-2000mm         Operations:                Width: 200-1500mm
Weight: 5-25 tons          • Slitting                 Weight: 0.5-8 tons
                           • Cut-to-length            Exact specifications
                           • Sheeting
```

**Key Message**: "The processor is the intermediary that transforms large raw material into customer-specific products through cutting operations."

---

## SLIDE 3 — The Lead Time Problem (Why Forecasts Are Required)

**Title**: "The Fundamental Timing Mismatch"

**Visual**: Timeline diagram (adapted from TRIM PDF page 23)

```
TIME ──────────────────────────────────────────────────────────►

     │◄──── Supplier Lead Time: 4-12 weeks ────►│
     │                                           │
     Purchase                               Material
     Decision                               Arrives
     (based on                              (in stock)
      FORECASTS)                                 │
                                                 │◄── Order Horizon: 1-2 weeks ──►│
                                                 │                                 │
                                            Customer                          Must
                                            Orders                            Deliver
                                            Confirmed                         
```

**Key Message**: 
- "Raw materials must be ordered 4-12 weeks before delivery"
- "Customer orders are only confirmed 1-2 weeks before they're needed"
- "This means: **you must buy BEFORE you know what customers will order**"
- "This is why forecasting and long-term MRP are essential"

---

## SLIDE 4 — Forecast-Based Procurement (Long-Term MRP)

**Title**: "How Procurement Works: Buying Against Forecasts"

**Visual**: Diagram showing demand pool (adapted from TRIM PDF page 24)

```
DEMAND SOURCES                          SUPPLY SOURCES
──────────────                          ──────────────

┌─────────────────┐                     ┌─────────────────┐
│ Confirmed Orders│ (known, firm)       │ Stock           │ (available now)
│ (1-2 week view) │                     │ (in warehouse)  │
└─────────────────┘                     └─────────────────┘
┌─────────────────┐                     ┌─────────────────┐
│ Forecast Orders │ (predicted,         │ In-Transit      │ (arriving soon)
│ (4-12 week view)│  uncertain)         │ (on the way)    │
└─────────────────┘                     └─────────────────┘
                                        ┌─────────────────┐
        MRP runs against                │ Purchase Orders │ (ordered, not
        BOTH confirmed                  │ (at supplier)   │  yet produced)
        + forecast demand               └─────────────────┘
```

**Key Message**: 
- "MRP must plan for BOTH confirmed orders AND forecasted future demand"
- "Purchase decisions are made based on aggregated forecasts"
- "But forecasts are never 100% accurate — creating mismatch risk"

---

## SLIDE 5 — The Matching Problem Emerges

**Title**: "When Orders Arrive: The Matching Challenge"

**Visual**: Two columns with parameter matching (from TRIM PDF page 14)

```
CUSTOMER ORDER                          AVAILABLE COIL/ROLL
(what they need)                        (what we purchased)
──────────────                          ──────────────────
Product Group:  HDG          ══════►    Product Group:  HDG        ✓ Match
Quality:        DX51D        ══════►    Quality:        DX51D      ✓ Match
Thickness:      0.50mm       ══════►    Thickness:      0.50mm     ✓ Match
Width:          1000mm       ══════►    Width:          1500mm     ✓ Coil wider (can cut)
Surface:        A            ══════►    Surface:        A          ✓ Match
Coating:        275 g/m²     ══════►    Coating:        275 g/m²   ✓ Match
Roughness:      Normal       ══════►    Roughness:      Normal     ✓ Match
Passivation:    Yes          ══════►    Passivation:    Yes        ✓ Match
Due Date:       Feb 15       ══════►    Arrival Date:   Jan 20     ✓ Available in time
...             ...                     ...             ...

         ALL parameters must match!
         (5-13+ parameters depending on industry)
```

**Key Message**:
- "Each order must be matched to a raw material that satisfies ALL parameters"
- "With 5-13+ parameters, this matching is extremely specific"
- "Raw materials are almost 'order-specific' — very few coils fit each order"
- "This is NOT a simple first-come-first-serve allocation"

---

## SLIDE 6 — What Makes It Harder: Multiple Orders Compete for Same Material

**Title**: "The Assignment Dilemma: Multiple Orders, Limited Materials"

**Visual**: Bipartite graph (feasibility network from TRIM PDF page 6)

```
ORDERS                              COILS/ROLLS
──────                              ───────────
┌─────────┐                         ┌──────────┐
│ Order A  │─────────────────────────│  Coil 1  │
│ 1000mm   │───────┐                │  1500mm  │
└─────────┘        │                └──────────┘
                   │                ┌──────────┐
┌─────────┐        └────────────────│  Coil 2  │
│ Order B  │────────────────────────│  1250mm  │
│  800mm   │                        └──────────┘
└─────────┘                         ┌──────────┐
                                    │  Coil 3  │ ← No matching orders!
┌─────────┐                         │  900mm   │   (IDLE STOCK)
│ Order C  │  ← No matching coils!  └──────────┘
│  600mm   │    (CANNOT FULFILL)
└─────────┘
```

**Key Messages**:
- "Multiple orders may be eligible for the same coil — who gets it?"
- "Some orders have NO matching material → purchase needed"
- "Some materials have NO matching orders → idle stock (waste of capital)"
- "The assignment decision affects cutting efficiency and delivery performance"

---

## SLIDE 7 — The Cutting Problem: Trim Loss

**Title**: "Once Assigned: How Do You Cut with Minimum Waste?"

**Visual**: Coil cross-section showing cutting patterns

```
GOOD PATTERN (0% trim):                    BAD PATTERN (33% trim):
Coil width: 1500mm                          Coil width: 1500mm

┌──────────────────────────────────┐       ┌──────────────────────────────────┐
│ Order A    │ Order B   │         │       │    Order A (1000mm)    │ WASTE!  │
│ (1000mm)   │ (500mm)   │ 0 trim  │       │                       │ (500mm) │
└──────────────────────────────────┘       └──────────────────────────────────┘
  ↑ Perfect combination!                      ↑ No matching order for remaining 500mm

The ASSIGNMENT decision determines the CUTTING efficiency!
```

**Key Message**:
- "Trim loss = raw material wasted as scrap during cutting"
- "The right COMBINATION of orders on one coil can achieve 0% waste"
- "The wrong assignment leads to 10-30% material thrown away"
- "This is why assignment and cutting must be solved TOGETHER"

---

## SLIDE 8 — The Five Conflicting Objectives

**Title**: "Why It's Not Simple: Five Goals That Fight Each Other"

**Visual**: Pentagon/radar chart with 5 objectives

```
                    ① Minimize Trim Loss
                         (save material)
                              ▲
                             / \
                            /   \
    ⑤ Minimize            /     \           ② Minimize
    Idle Stock           /       \          Tardy Orders
    (working capital)   /         \         (customer satisfaction)
                       /           \
                      /             \
                     /               \
    ④ Maximize      ─────────────────    ③ Minimize
    Orders Planned                       Excess Material
    (revenue)                            (leftover scraps)
    

TRADE-OFF EXAMPLES:
• Using the oldest coil (good for ⑤) may give higher trim (bad for ①)
• Planning all orders (good for ④) may require accepting worse trim (bad for ①)
• Waiting for a perfect coil (good for ①) may make the order tardy (bad for ②)
```

**Key Message**:
- "These 5 objectives CONFLICT with each other"
- "No single plan is best across all dimensions"
- "Human planners implicitly make these trade-offs — but suboptimally"
- "This requires multi-objective optimization — not simple rules"

---

## SLIDE 9 — Why Plans Break Every Day

**Title**: "The Reality: Plans Break Continuously"

**Visual**: Flow showing disruptions (from TRIM PDF page 27)

```
                    MATERIAL PLAN
                    (optimized today)
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │ New urgent   │ │ Supplier │ │ Customer     │
    │ order arrives│ │ delayed  │ │ changes date │
    └──────┬───────┘ └────┬─────┘ └──────┬───────┘
           │              │              │
           └──────────────┼──────────────┘
                          ▼
                   PLAN IS BROKEN
                          │
                          ▼
              Manual re-planning (hours)
              OR
              React with urgency (suboptimal)
```

**Key Message**:
- "Even a perfect plan becomes obsolete within hours/days"
- "New orders, supplier delays, date changes, forecast errors"
- "Result: companies fall back to 'urgency-based' daily planning"
- "Need: a system that can RE-PLAN instantly when things change"

---

## SLIDE 10 — The Gap: What Standard Systems Cannot Do

**Title**: "Why Standard ERP/MRP Cannot Solve This"

**Visual**: Table comparing capabilities

```
What's Needed                          What SAP MRP/PP Does
────────────────                       ────────────────────
Multi-parameter feasibility            Simple BOM explosion
matching (5-13 params)                 (material → components)

Combinatorial cutting pattern          Lot sizing
optimization (NP-hard bin-packing)     (how much to produce)

Multi-objective assignment             Single-level scheduling
(5 conflicting goals)                  (when to produce)

Event-driven re-planning               Periodic MRP run
(react in seconds)                     (batch, daily/weekly)

Explainability                         Transaction log
("WHY this assignment?")               (what happened)
```

**Key Message**:
- "Standard MRP answers: WHAT to produce and WHEN"
- "It does NOT answer: WHICH specific coil serves WHICH order with WHAT cutting pattern"
- "This is the gap that requires specialized optimization + AI"

---

## SLIDE 11 — Transition: Our Approach

**Title**: "The Solution: Agentic AI for Stock Cutting & Material Assignment"

**Visual**: High-level architecture preview

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Planning Engineer                                       │
│  "Plan all open orders against available stock"          │
│                          │                               │
│                          ▼                               │
│              ┌──────────────────────┐                    │
│              │    SAP JOULE         │                    │
│              │    (AI Orchestrator)  │                    │
│              └──────────┬───────────┘                    │
│                         │                                │
│            ┌────────────┼────────────┐                   │
│            ▼            ▼            ▼                   │
│     ┌──────────┐ ┌──────────┐ ┌──────────────┐         │
│     │  Order   │ │  Stock   │ │ Optimization │         │
│     │  Agent   │ │  Agent   │ │   Engine     │         │
│     │ (demand) │ │ (supply) │ │ (cutting +   │         │
│     │          │ │          │ │  assignment) │         │
│     └──────────┘ └──────────┘ └──────────────┘         │
│            │            │            │                   │
│            └────────────┼────────────┘                   │
│                         ▼                                │
│              ┌──────────────────────┐                    │
│              │    SAP S/4HANA       │                    │
│              │  (execute the plan)  │                    │
│              └──────────────────────┘                    │
│                                                          │
│  Result: Optimal plan in <15 seconds                     │
│  • 2-4% trim loss (vs 8-15% manual)                     │
│  • 90%+ orders planned                                   │
│  • Instant re-planning on changes                        │
│  • Full explanation of every decision                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key Message**:
- "An AI system that understands the FULL context"
- "Matches orders to materials optimally (multi-parameter, multi-objective)"
- "Generates cutting patterns that minimize waste"
- "Reacts to changes in real-time"
- "Explains every decision to the planner"
- "Writes results directly to SAP"

---

## SLIDE 12 — What Comes Next (Transition)

**Title**: "Next: Deep Dive into the Agentic Architecture"

**Content** (bullet points):
- How SAP Joule orchestrates the planning process
- How the Order Agent and Stock Agent work
- How the Optimization Engine solves the cutting + assignment problem