<z# Interactive Demo — Agentic Stock Cutting & Material Assignment

## How to Run

### Option 1: Build & Open (recommended)
```bash
node demo/build-demo.js
open demo/index.html
```

### Option 2: Direct open (if already built)
```bash
open demo/index.html
```

No server, no external dependencies, no installation needed. Works in any modern browser.

## What This Demo Shows

This is a **self-contained simulation** of the agentic planning system:

1. **Chat Interface** (left panel) — simulates SAP Joule with natural language queries
2. **ReAct Reasoning Trace** — shows the agent's step-by-step thinking process
3. **Planning Data Service** — mock SAP data (25 orders, 35 coils)
4. **Optimization Engine** — real bin-packing/cutting logic in JavaScript
5. **Visual Cutting Patterns** — colored bars showing how coils are slitted into strips
6. **KPI Dashboard** — trim loss %, orders planned, tardy count, coils used

## Supported Queries

| Query | What It Does |
|-------|-------------|
| "Plan all open orders" | Full optimization run with KPIs + cutting visualizations |
| "Can ORD-007 be fulfilled?" | Single order feasibility check with coil options |
| "Best use of COIL-012?" | Reverse analysis — optimal cutting for a specific coil |
| "Show idle coils over 30 days" | Inventory management — stale stock detection |
| "Supply-demand balance for HDG DX51D 0.5mm" | Aggregated S/D ratio by spec group |

## File Structure

```
demo/
├── build-demo.js        # Build script — combines src/ into index.html
├── index.html           # Generated output (open this in browser)
├── README.md            # This file
└── src/
    ├── styles.css       # UI styling (SAP Fiori-inspired)
    ├── data.js          # Mock data: 25 orders + 35 coils
    └── app.js           # Optimizer + chat handler + visualizations
```

## Architecture Simulated

```
User Input (Chat)
    ↓
Joule Agent (simulated ReAct reasoning with thinking trace)
    ↓
Planning Data Service (mock JSON data — demand + supply + cross-domain)
    ↓
MCP Optimizer (JavaScript first-fit-decreasing bin-packing solver)
    ↓
Visual Results (colored cutting patterns + KPI dashboard + order table)
```

## Mock Data

- **25 Orders**: Mix of HDG, CR, HRC, EG steel grades; widths 300–1400mm; confirmed + forecast
- **35 Mother Coils**: Widths 1000–1500mm; 5 material groups; stock + in-transit
- **Feasibility**: 13-parameter matching (product group, quality, thickness, width, coating, surface, etc.)

## Note for Presenters

This is a **demo/mockup** for presentation purposes. The real production system would use:
- SAP Joule with actual LLM (GPT-4o/Claude via BTP AI Core)
- SAP CAP Planning Data Service connected to S/4HANA via OData
- Python MCP Server with Google OR-Tools (MILP/CP-SAT solvers)
- SAP Fiori embedded experience with Joule sidebar
- SAP Event Mesh for reactive re-planning triggers