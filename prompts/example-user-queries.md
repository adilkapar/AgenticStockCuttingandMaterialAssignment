# Example User Queries for Agentic Stock Cutting & Material Assignment System

These are 15 realistic queries that a planning engineer would ask the system via SAP Joule. The agentic model (Joule + Order Agent + Stock Agent + MCP Optimizer) can respond to all of these.

---

## Category 1: Full Planning Runs

**Query 1:**
> "Plan all open orders against available stock"

**Query 2:**
> "Run a full material plan for all confirmed orders due in the next 2 weeks"

**Query 3:**
> "Plan all open orders but prioritize zero tardy — I don't care about trim loss today"

---

## Category 2: Single Order Feasibility

**Query 4:**
> "Can ORD-042 (HDG DX51D 0.5mm 1000mm, 5 tons) be fulfilled from stock today?"

**Query 5:**
> "Which coils are available for order ORD-118? It's urgent, due in 3 days."

**Query 6:**
> "Why can't ORD-044 be planned? What's blocking it?"

---

## Category 3: Coil Utilization

**Query 7:**
> "I have COIL-4521 (1500mm, 12t, HDG DX51D 0.5mm). What's the best way to use it?"

**Query 8:**
> "Show me all orders that could be served from COIL-4533"

**Query 9:**
> "COIL-4540 has been in stock for 45 days — is there any order it can match?"

---

## Category 4: What-If Scenarios

**Query 10:**
> "What if we include forecast orders in the plan? Would it reduce trim loss?"

**Query 11:**
> "What happens if we relax the passivation constraint for ORD-031? Are there matching coils then?"

**Query 12:**
> "If I change the trim loss weight from 0.35 to 0.5, how does the plan change?"

---

## Category 5: Supply-Demand Analysis

**Query 13:**
> "Show me the supply-demand balance for HDG DX51D 0.5mm — do we have enough stock?"

**Query 14:**
> "Which orders are at risk of being tardy? What coils would I need to purchase to fix it?"

**Query 15:**
> "List all idle coils older than 30 days and tell me if any of them have feasible orders"

---

## How the System Handles Each Query Type

| Category | Agents Involved | MCP Tools Used | SAP Actions |
|----------|----------------|----------------|-------------|
| Full Planning | Order + Stock + Joule | All 5 tools | Read SD/MM, Write MB21/CO01 |
| Single Feasibility | Order + Stock | feasibility_network, cutting_pattern | Read only |
| Coil Utilization | Stock + Order | cutting_pattern, feasibility_network | Read only |
| What-If | Joule + both agents | All tools (compare mode) | Read only (until confirmed) |
| Supply-Demand | Stock + Order | feasibility_network, evaluate_plan | Read only, may trigger purchase rec |