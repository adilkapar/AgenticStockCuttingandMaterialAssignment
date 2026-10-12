# Agentic Stock Cutting & Material Assignment System

## SAP-Centric Cookbook Design for Steel Service Centers

This repository contains the complete architectural design, implementation guidance, and reference patterns for building an **Agentic AI system** that solves the **Stock Cutting and Material Assignment** problem using:

- **SAP Joule** as the orchestrator agent
- **Specialized domain agents** (Order Agent, Stock Agent)
- **MCP (Model Context Protocol) Server** for optimization tooling
- **LLM** (via SAP BTP AI Core) for reasoning and natural language interaction

### Target Audience
SAP customers in the flat steel industry (Çelik Servis Merkezleri / Steel Service Centers) who need to optimally assign raw material coils to customer orders and generate cutting patterns that minimize waste.

---

## Quick Summary

```
USER: "Plan all open orders against available stock"
  │
  ▼
JOULE ORCHESTRATOR (LLM reasoning)
  ├── Asks ORDER AGENT for demand (57 orders, 142t)
  ├── Asks STOCK AGENT for supply (42 coils, 189t)
  ├── Calls MCP: build_feasibility_network → 8 independent groups
  ├── Calls MCP: optimize_assignment → 52/57 orders planned
  ├── Calls MCP: solve_cutting_pattern × 38 → 2.4% avg trim
  ├── Calls MCP: evaluate_plan → KPIs computed
  ├── Calls MCP: suggest_purchase_orders → 3 recommendations
  └── Presents results + writes to SAP on confirmation
```

---

## Document Structure

| # | Document | What You'll Learn |
|---|----------|-------------------|
| 1 | [Problem Definition](docs/01-problem-definition.md) | Why this problem matters and what we're solving |
| 2 | [Architecture](docs/02-architecture.md) | System design, component responsibilities, deployment |
| 3 | [Domain Model](docs/03-domain-model.md) | Coil, Order, Feasibility Rules, Cutting Patterns |
| 4 | [Agent Definitions](docs/04-agents.md) | Order Agent, Stock Agent, Joule Orchestrator |
| 5 | [MCP Server Tools](docs/05-mcp-server.md) | 5 optimization tools with schemas and algorithms |
| 6 | [Orchestration Flows](docs/06-orchestration-flows.md) | Complete interaction sequences with examples |
| 7 | [SAP Integration](docs/07-sap-integration.md) | CDS views, BAPIs, Event Mesh, write-back |
| 8 | [Implementation Guide](docs/08-implementation-guide.md) | Tech stack, project structure, deployment |
| 9 | [Differentiation](docs/09-differentiation.md) | What makes this agentic vs. traditional |

**Start here**: [Executive Summary Diagram](diagrams/executive-summary.md)

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Joule as orchestrator** | Native SAP agent framework; embedded in Fiori; enterprise-grade |
| **Separate Order + Stock agents** | Clean domain ownership; independent SAP module access |
| **MCP protocol for tools** | LLM can discover and invoke tools dynamically; standard protocol |
| **Stateless MCP server** | Scales horizontally; state lives in SAP where it belongs |
| **Python for optimization** | OR-Tools, numpy, networkx — best ecosystem for solvers |
| **Connected component decomposition** | Parallel solving; sub-10s response; targeted re-planning |
| **Event-driven reactive planning** | System is proactive, not just reactive to user prompts |

---

## The Problem in One Paragraph

Steel service centers buy large coils of flat steel and cut them into smaller pieces for customers. The coils must be purchased weeks before customer orders are confirmed (supplier lead times > order horizons). When orders arrive, each must be matched to a compatible coil using 13 physical parameters (product group, quality, thickness, width, coating, roughness, etc.). The matching and cutting optimization is NP-hard with multiple conflicting objectives: minimize trim waste, minimize tardy orders, minimize idle stock. This system uses AI agents to solve this automatically, explain the results, and execute them in SAP.

---

## Grounding: TRIM PDF

This design is directly grounded in the TRIM production planning system documentation for steel service centers. Key references:
- **13 coil parameters**: PDF page 12
- **Order characteristics**: PDF page 13-14
- **Feasibility matching rules**: PDF pages 14-15
- **Operation types** (slitting, CTL, combined): PDF pages 15-18
- **5 optimization objectives**: PDF page 31 (Hedef 2.2-2.6, 5.3-5.7)
- **Connected component decomposition**: PDF page 6
- **Material planning flow**: PDF pages 23-27