# 02 — System Architecture

## Design Philosophy

This architecture follows three principles:

1. **SAP-native**: Every component runs on or integrates with SAP technology (BTP, HANA, S/4HANA)
2. **Agent-first**: Intelligence lives in the orchestrator agent that reasons, not in hardcoded workflows
3. **Optimization-as-a-tool**: The solver is a tool the agent *uses*, not the center of the system

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION LAYER                          │
│                                                                         │
│   SAP Fiori Launchpad  ←→  SAP Joule (Natural Language Interface)      │
│   Planning Cockpit UI       "Plan all orders" / "Check coil usage"     │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER (SAP Joule)                    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Joule Orchestrator Agent                        │  │
│  │                                                                   │  │
│  │  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐    │  │
│  │  │ LLM Engine  │   │ Tool Router  │   │ State Manager      │    │  │
│  │  │ (Reasoning) │   │ (Delegation) │   │ (Session/Context)  │    │  │
│  │  └─────────────┘   └──────────────┘   └────────────────────┘    │  │
│  │                                                                   │  │
│  │  Capabilities:                                                    │  │
│  │  • Intent parsing & decomposition                                │  │
│  │  • Multi-step planning (ReAct pattern)                           │  │
│  │  • Trade-off explanation                                         │  │
│  │  • What-if scenario management                                   │  │
│  │  • SAP write-back authorization                                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────┬───────────────────────┘
                       │                          │
           ┌───────────▼───────────┐   ┌─────────▼──────────────┐
           │  PLANNING DATA SERVICE │   │   MCP SERVER            │
           │  (Unified SAP Layer)   │   │   (Optimization Tools)  │
           │                        │   │                         │
           │  Demand Functions:     │   │  • Feasibility Network  │
           │  • Order pool mgmt     │   │  • Cutting Solver       │
           │  • Urgency scoring     │   │  • Assignment Solver    │
           │  • Fulfillment track   │   │  • Plan Evaluator       │
           │                        │   │  • Purchase Advisor     │
           │  Supply Functions:     │   │                         │
           │  • Coil inventory      │   │  Stateless, Python,     │
           │  • Availability calc   │   │  OR-Tools               │
           │  • Reservation mgmt    │   └─────────────────────────┘
           │  • Idle detection      │
           │                        │
           │  Cross-Domain:         │              │
           │  • Feasibility eval    │              │
           │  • Supply/demand bal   │              │
           │                        │   ┌─────────▼──────────────┐
           │  Source: SAP SD/MM/PP  │   │   SOLVER ENGINE         │
           └────────────┬───────────┘   │   (OR-Tools / CPLEX)    │
                        │               │                         │
                        │               │   MILP + Heuristics     │
                        │               └─────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────────────┐
│                      SAP BACKEND LAYER                                   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ S/4HANA MM   │  │ S/4HANA SD   │  │ S/4HANA PP   │  │ SAP HANA  │  │
│  │              │  │              │  │              │  │           │  │
│  │ • Inventory  │  │ • Sales Ord  │  │ • Prod Ord   │  │ • Opt DB  │  │
│  │ • Batches    │  │ • Forecasts  │  │ • Routing    │  │ • Cache   │  │
│  │ • Purchases  │  │ • Delivery   │  │ • BOM        │  │ • History │  │
│  │ • Reserv.    │  │              │  │              │  │           │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    SAP BTP Platform Services                      │  │
│  │  • AI Core (LLM hosting)       • Event Mesh (order events)       │  │
│  │  • Destination Service          • HANA Cloud (optimization DB)   │  │
│  │  • Cloud Connector (on-prem)    • Cloud Foundry (MCP runtime)    │  │
│  │  • SAP Build (agent config)     • Credential Store               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Joule Orchestrator Agent (The Only True Agent)
The **brain** of the system. It does NOT solve optimization problems itself — it reasons about *what to do*, delegates to tools and services, and synthesizes results. This is the only component with LLM reasoning capability.

| Responsibility | How |
|---------------|-----|
| Understand user intent | LLM parses natural language into structured intent |
| Decompose complex requests | Multi-step ReAct reasoning chain |
| Delegate to Planning Data Service | Calls functions for data & domain logic |
| Invoke optimization tools | Calls MCP Server tools with prepared parameters |
| Synthesize & explain | Combines optimization results with business context |
| Execute decisions | Writes back to SAP (with user confirmation) |
| Handle exceptions | Detects infeasibility, suggests alternatives |

### Planning Data Service (Unified SAP Integration Layer)
A **CAP-based service** that owns everything about reading/writing SAP data. It consolidates both demand-side (orders) and supply-side (coils/inventory) operations into a single, coherent service. It is NOT an agent — it has no LLM, no autonomous reasoning. It simply exposes well-structured functions that the orchestrator can call.

| Module | Responsibility |
|--------|---------------|
| Demand module | Order pool, urgency scoring, fulfillment tracking, production order creation |
| Supply module | Coil inventory, availability timing, reservation management, idle detection |
| Cross-domain module | Feasibility evaluation (needs both order + coil data), supply/demand balance |

### MCP Server (Optimization Toolbox)
A **stateless** computational service that provides optimization tools. It receives prepared data, runs algorithms, and returns results. It has NO opinion about business logic or SAP state — that's the Planning Data Service's job.

### Solver Engine
The mathematical core inside the MCP Server. Uses Mixed-Integer Linear Programming (MILP) and/or heuristics to solve:
- Bin-packing / cutting stock problems
- Assignment optimization (bipartite matching with objectives)

## Why This Separation Matters

```
┌─────────────────────────────────────────────────────────┐
│  WRONG: Monolithic optimization service                 │
│                                                         │
│  User → API → [fetch data + solve + write back]        │
│                                                         │
│  Problems:                                              │
│  • Can't handle "what if" without re-running everything │
│  • Can't explain trade-offs                             │
│  • Can't react to partial failures                      │
│  • Can't adapt to novel requests                        │
│  • Requires pre-coded workflows for every scenario      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  RIGHT: Agent-orchestrated with tools & services        │
│                                                         │
│  User → Joule → [reason about what to do]              │
│                → [call Planning Data Service for data]   │
│                → [call MCP tool to optimize]             │
│                → [evaluate results]                      │
│                → [explain to user]                       │
│                → [write to SAP if confirmed]             │
│                                                         │
│  Benefits:                                              │
│  • Handles novel scenarios via LLM reasoning            │
│  • Explains every decision                              │
│  • Can pause, iterate, ask for input                    │
│  • Graceful degradation on partial failure              │
│  • Composable — add new tools without changing agent    │
└─────────────────────────────────────────────────────────┘
```

## Why NOT Multiple Agents?

A deliberate design decision: **only Joule is a true agent** (with LLM reasoning). The Planning Data Service is a tool/service, not an agent. Here's why:

| Criterion | Order/Stock as Agents | Unified Data Service |
|-----------|----------------------|---------------------|
| Has own LLM? | ❌ No (they just serve data) | N/A — it's a service |
| Makes autonomous decisions? | ❌ No ("never decides assignments") | N/A — orchestrator decides |
| Adds reasoning value? | ❌ No (domain logic is coded, not reasoned) | N/A — logic in code |
| Deployment complexity | Two services to manage | One service |
| Feasibility check spans both | Awkward split | Natural single function |
| SAP project structure | Already same CAP project | One project, one deploy |

**The key insight**: If a component doesn't have its own LLM and doesn't reason autonomously, it's a **service**, not an **agent**. Calling it an "agent" adds architectural confusion without adding value.

## Communication Patterns

### Joule ↔ Planning Data Service Communication
- Joule calls Planning Data Service via **function calling** (structured tool use)
- Service returns structured JSON responses
- Functions are organized by domain (demand, supply, cross-domain)

### Joule ↔ MCP Server Communication
- Uses the **Model Context Protocol (MCP)** standard
- MCP Client (embedded in Joule) connects to MCP Server
- Tools are registered with JSON Schema descriptions
- Joule's LLM sees tool schemas and decides which to call with what parameters

### Planning Data Service ↔ SAP Backend Communication
- **Read path**: OData V4 services / CDS views on S/4HANA
- **Write path**: BAPI calls (wrapped in OData actions) for reservations, production orders
- **Event path**: SAP Event Mesh publishes order/inventory change events

## Deployment Topology

```
┌─────────────────────────────────────────────────────────┐
│                 SAP BTP (Cloud Foundry)                  │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ │
│  │ Joule Agent │  │ MCP Server  │  │ Planning Data  │ │
│  │ (Node.js)   │  │ (Python)    │  │ Service        │ │
│  │             │  │             │  │ (CAP/Node.js)  │ │
│  │ - LLM calls │  │ - OR-Tools  │  │                │ │
│  │ - MCP client│  │ - Solvers   │  │ - Demand funcs │ │
│  │ - Tool calls│  │ - 5 tools   │  │ - Supply funcs │ │
│  │             │  │             │  │ - SAP OData    │ │
│  └──────┬──────┘  └──────┬──────┘  └───────┬────────┘ │
│         │                │                  │          │
│         └────────────────┼──────────────────┘          │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │              SAP HANA Cloud                       │  │
│  │  • Feasibility cache    • Plan history            │  │
│  │  • Session state        • KPI tracking            │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ Cloud Connector / 
                           │ SAP Private Link
                           ▼
┌──────────────────────────────────────────────────────────┐
│              SAP S/4HANA (On-Premise or PCE)             │
│                                                          │
│  MM (Inventory) │ SD (Sales Orders) │ PP (Production)   │
└──────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Single agent (Joule only) | Only Joule reasons with LLM; data services don't need autonomous reasoning |
| Unified Planning Data Service | Order + Stock data access is one CAP service — simplifies deployment, enables cross-domain functions like feasibility |
| MCP Server is stateless | Enables horizontal scaling; state belongs in SAP + HANA |
| Python for MCP Server | Best ecosystem for OR-Tools, numpy, optimization libraries |
| Node.js/CAP for Planning Data Service | SAP CAP framework for OData integration |
| Joule as orchestrator (not custom) | Leverages SAP's investment in agent framework; enterprise-ready |
| Connected component decomposition | Sub-problems are independent → parallel solving → faster results |
| LLM for orchestration, not optimization | LLMs are bad at math but great at reasoning about what math to do |
| Event-driven re-planning | React to SAP changes (new order, coil arrival) without polling |

## Security & Governance

- **Data residency**: All data stays in SAP BTP region (no external LLM data leakage)
- **Authorization**: SAP BTP XSUAA for service-to-service auth; S/4HANA authorization objects for write-back
- **Audit trail**: Every plan generated, every write-back, logged in HANA with user/agent attribution
- **Human-in-the-loop**: Write-back to SAP requires explicit user confirmation (configurable auto-approve for low-risk)