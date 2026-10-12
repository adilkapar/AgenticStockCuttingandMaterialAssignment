const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();

// Sheet 1: Case(Descriptions)
const ws1 = XLSX.utils.aoa_to_sheet([
  ['', 'EN'],
  ['Description', [
    'The stock cutting and material assignment process in Steel Service Centers (Celik Servis Merkezleri) is a complex optimization problem.',
    'It requires matching raw material coils to customer orders based on 13 physical parameters while minimizing trim loss and maximizing order fulfillment.',
    '',
    'The fundamental challenge: raw materials must be procured before customer orders exist (supplier lead times 4-8 weeks exceed order horizons of 1-2 weeks).',
    'When confirmed orders arrive, they must be matched to already-purchased coils with near-custom specifications.',
    '',
    'Using an agentic AI architecture with SAP Joule as orchestrator, specialized domain agents (Order Agent, Stock Agent), and an MCP-based optimization server,',
    'the system automates feasibility matching, optimal assignment, and cutting pattern generation - then writes results directly back to SAP S/4HANA.'
  ].join('\n')],
  ['CHALLENGES AND BUSINESS DRIVERS', [
    '1. NEAR-CUSTOM RAW MATERIAL: Each coil has 13 parameters making matching almost order-specific.',
    '2. PROCUREMENT BEFORE DEMAND: Coils purchased against forecasts weeks before orders are confirmed.',
    '3. MANUAL PLANNING DEPENDENCY: Planning relies on individual expertise - person-dependent and non-scalable.',
    '4. MULTIPLE CONFLICTING OBJECTIVES: Trim loss vs tardy orders vs idle stock - requires multi-objective optimization.',
    '5. CONTINUOUSLY BREAKING PLANS: Date changes, supply disruptions, wrong forecasts cause daily revisions.',
    '6. NO NATIVE SAP SOLUTION: SAP PP/MRP does not solve combinatorial cutting pattern + assignment optimization.'
  ].join('\n')],
  ['SOLUTION', [
    'An Agentic AI system built on SAP BTP:',
    '',
    '1. SAP JOULE ORCHESTRATOR: NL interface in Fiori. LLM reasoning (ReAct) to decompose, delegate, optimize, explain, write-back.',
    '2. ORDER AGENT: Reads SAP SD sales orders/forecasts. Manages feasibility, fulfillment, urgency.',
    '3. STOCK AGENT: Reads SAP MM coil inventory (stock/transit/PO). Manages reservations, availability, idle detection.',
    '4. MCP OPTIMIZATION SERVER (Python/OR-Tools):',
    '   - build_feasibility_network: 13-param matching + connected components',
    '   - solve_cutting_pattern: 1D/2D bin-packing (slitting, CTL, combined)',
    '   - optimize_assignment: Multi-objective MILP (5 objectives)',
    '   - evaluate_plan: KPI computation',
    '   - suggest_purchase_orders: Procurement recommendations',
    '5. SAP INTEGRATION: Read via CDS/OData, Write via BAPI (MB21, CO01), React via Event Mesh.'
  ].join('\n')],
  ['BENEFITS', [
    'QUANTITATIVE:',
    '- Trim loss: 8-15% (manual) to 2-4% (optimized)',
    '- Planning time: hours to <15 seconds',
    '- Order fulfillment: 90%+ with gap identification',
    '- Idle stock reduction via proactive matching',
    '',
    'QUALITATIVE:',
    '- Eliminates person-dependency in planning',
    '- Full explainability - traceable reasoning chain',
    '- Event-driven re-planning (proactive)',
    '- What-if scenarios without new development',
    '- Plans are immediately SAP shop orders',
    '- Standardized process across planners/shifts'
  ].join('\n')],
  ['COMMENTS', [
    '"The system solves the fundamental contradiction: we buy steel before knowing what customers will order.',
    'An AI agent reasoning about 13 parameters across hundreds of coils/orders, explaining WHY, then creating SAP transactions',
    '- that changes everything." - Production Planning Manager',
    '',
    '"Every material plan is a real candidate for shop order. The optimization creates actionable SAP production orders." - Operations Director'
  ].join('\n')],
  ['Business Questions', [
    '- Do you manually match coils to orders based on multiple physical parameters?',
    '- Is planning dependent on specific individuals expertise?',
    '- Do you experience >5% trim loss in slitting/CTL operations?',
    '- Are plans frequently disrupted by new orders or supply delays?',
    '- Do you procure raw materials before confirmed orders exist?',
    '- Would automatic identification of unfulfillable orders help?',
    '- Is reducing idle stock a priority?',
    '- Do you need to balance conflicting objectives (trim vs delivery vs utilization)?',
    '- Would natural language planning interaction be valuable?',
    '- Do you need audit trails and explainability for decisions?'
  ].join('\n')]
]);
ws1['!cols'] = [{ width: 30 }, { width: 100 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Case(Descriptions)');

// Sheet 2: Experiance Agent(lookups)
const ws2 = XLSX.utils.aoa_to_sheet([
  ['Level of Maturity', 'Industry', 'Industry Cluster', 'Industry Segments', 'Product Category L1', 'Product Category L2', 'Customer Segment', 'Focus Topic', 'Buyer Persona'],
  ['Actionable Use Case', 'Mill Products', 'Discrete Industries', 'Building Materials', 'Artificial Intelligence', 'Supply Chain Planning', 'Enterprise Segment', 'Artificial Intelligence', 'COO'],
  ['Preperation', 'Industrial Manufacturing', 'Cross Industry Cluster', 'Transportation and Logistics', 'Business Technology Platform', 'Supply Chain Logistics', 'Corporate Segment', 'Digital Transformation', 'CIO'],
  ['On Going', 'Wholesale Distribution', 'Consumer Industries', '', 'Supply Chain Management', 'Application Development and Automation', 'Midmarket', 'Data to Insight', 'CPO'],
  ['Declined', 'Automotive', 'Energy and Natural Resources', '', 'Enterprise Resource Planning', 'Analytics and Planning', 'Key Accounts', 'User Experience', 'CTO'],
  ['', 'Chemicals', 'Service Industries', '', 'CRM and Customer Experience', 'Integration', 'Partner Led', 'Business AI', 'CFO'],
  ['', 'Engineering, Construction, and Operations', '', '', 'Human Capital Management', 'Procurement', 'Strategic Customer Program', '', ''],
  ['', 'Mining', '', '', 'Spend Management', 'Enterprise Asset Management', '', '', ''],
  ['', 'Metals', '', '', 'Financial Management', 'Manufacturing', '', '', ''],
]);
ws2['!cols'] = [{ width: 20 }, { width: 35 }, { width: 25 }, { width: 25 }, { width: 28 }, { width: 32 }, { width: 25 }, { width: 22 }, { width: 15 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Experiance Agent(lookups)');

// Sheet 3: Buyer Persona
const ws3 = XLSX.utils.aoa_to_sheet([
  ['COO: Chief Operating Officer - Production planning, line balancing owner in Steel Service Centers'],
  ['CIO: Chief Information Officer - SAP S/4HANA and BTP platform management, digital transformation'],
  ['CPO: Chief Procurement Officer - Raw material (coil) procurement, supplier management'],
  ['VP Manufacturing: Production line efficiency, trim rates, capacity utilization'],
  ['Production Planning Manager: Daily cutting plans, material assignments, production schedules'],
  ['Supply Chain Director: End-to-end supply chain from raw material to customer delivery'],
  [''],
  ['Persona', 'Priorities', 'Decision Factors', 'Communication Approach'],
  ['COO', 'Operational efficiency, trim minimization, on-time delivery, balanced line utilization', 'Trim rate (2-4% target), order fulfillment (>90%), planning time (<15s), idle stock', 'Production efficiency metrics, ROI, operational risk reduction'],
  ['CIO', 'SAP integration, data security, scalability, BTP platform strategy', 'SAP-native solution, data residency, multi-tenant architecture, API compatibility', 'Technical architecture, security, SAP roadmap alignment'],
  ['CPO', 'Raw material cost optimization, supplier risk management, stock turnover', 'Idle stock reduction, proactive purchase recommendations, lead time visibility', 'Cost savings projections, supply chain visibility'],
  ['Production Planning Manager', 'Daily plan quality, trim minimization, SAP executability, exception handling', 'Ease of use, natural language, explainability, what-if scenarios', 'Operational demo, daily workflow integration, time savings'],
  ['Supply Chain Director', 'End-to-end SC optimization, forecast accuracy, order-to-delivery time', 'Supply-demand balance visibility, event-based re-planning, integrated decision support', 'Strategic value, competitive advantage, customer satisfaction'],
]);
ws3['!cols'] = [{ width: 35 }, { width: 55 }, { width: 55 }, { width: 45 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Buyer Persona');

// Sheet 4: generation-prompt(EKX)
const ws4 = XLSX.utils.aoa_to_sheet([
  ['Prompt Type', 'Prompt Text'],
  ['Use Case Summary', 'Generate a 1-page executive summary for an Agentic AI solution solving Stock Cutting and Material Assignment for Steel Service Centers. SAP Joule orchestrator + Order/Stock agents + MCP optimization server (OR-Tools). Reads SAP S/4HANA MM/SD, writes reservations and production orders. Reduces trim from 8-15% to 2-4%, plans in <15 seconds.'],
  ['Technical Architecture', 'Generate technical architecture for agentic stock cutting on SAP BTP: Joule orchestrator (BTP AI Core LLM), Order Agent (SAP SD OData), Stock Agent (SAP MM OData), Python MCP Server (5 tools: feasibility network, cutting solver, assignment MILP, plan evaluator, purchase recommender), SAP write-back (BAPI/OData), Event Mesh for reactive re-planning.'],
  ['Business Value', 'Generate business value proposition for steel executives: procurement before demand (4-8 week lead times), 13-parameter near-custom matching, manual planning hours reduced to seconds, 60-75% trim reduction, event-driven replanning, NL interaction, full SAP transaction creation.'],
  ['Demo Script', 'Generate 3-scenario demo: (1) Full Planning - 57 orders, 42 coils, 8 groups, 2.4% trim, 91% fulfillment, SAP write-back. (2) Single Order Check - feasibility for 1 order, 3 coil options ranked. (3) Coil Utilization - best order combination for 1 coil with 0% trim pattern.'],
  ['ROI Calculation', 'Generate ROI model: Input assumptions (500 tons/month throughput, 10% current trim, EUR 800/ton material cost). Savings from trim reduction (10% to 3% = 7% x 500t x EUR 800 = EUR 28,000/month). Planning labor savings (2 FTE x 30% time = 0.6 FTE). Faster order fulfillment impact on revenue.'],
]);
ws4['!cols'] = [{ width: 22 }, { width: 120 }];
XLSX.utils.book_append_sheet(wb, ws4, 'generation-prompt(EKX)');

// Sheet 5: draw-prompt(EKX)
const ws5 = XLSX.utils.aoa_to_sheet([
  ['Diagram Type', 'Prompt Text'],
  ['Solution Landscape', 'Draw a 1-page customer specific AI case landscape: Process starts with SAP Joule receiving natural language request from planning engineer. Joule calls Order Agent which reads open sales orders and forecasts from SAP S/4HANA SD. Joule calls Stock Agent which reads coil inventory (stock, in-transit, purchase orders) from SAP S/4HANA MM with 13 parameters. Both feed into MCP Optimization Server which builds feasibility network, solves cutting patterns (slitting/CTL), runs multi-objective assignment optimization. Results flow back through Joule which explains trade-offs and on confirmation writes reservations (MB21) and production orders (CO01) back to SAP S/4HANA. SAP Event Mesh provides reactive triggers for new orders and coil arrivals.'],
  ['Solution Architecture', 'Draw a 1-page solution architecture diagram: Top layer - SAP Fiori with Joule sidebar (user interaction). Middle layer - SAP BTP with three components: (1) Joule Orchestrator Agent with LLM via AI Core, (2) CAP Agent Services (Order Agent + Stock Agent) with OData connections, (3) Python MCP Server with OR-Tools solver engine. Bottom layer - SAP S/4HANA with MM (Inventory, Batches, Reservations), SD (Sales Orders, Forecasts), PP (Production Orders). Connections: OData V4 for reads, BAPI/RFC for writes, Event Mesh for events. Side: SAP HANA Cloud for plan history and feasibility cache.'],
  ['Data Flow', 'Draw data flow diagram: Orders (confirmed + forecast) from SAP SD flow to Order Agent. Coils (stock + transit + PO) from SAP MM flow to Stock Agent. Both provide data to MCP Server which produces: Feasibility Network (bipartite graph with connected components), Assignment Plan (coil-to-order mapping), Cutting Patterns (strip layouts per coil), KPIs (trim%, fulfillment%, tardy count). Confirmed plans write back: MM Reservations + PP Production Orders + Purchase Requisitions for gaps.'],
]);
ws5['!cols'] = [{ width: 22 }, { width: 130 }];
XLSX.utils.book_append_sheet(wb, ws5, 'draw-prompt(EKX)');

// Write the file
XLSX.writeFile(wb, 'Stock_Cutting_AI_UseCase_Template.xlsx');
console.log('Excel file generated: Stock_Cutting_AI_UseCase_Template.xlsx');