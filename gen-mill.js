const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();

// Helper to join lines
const L = (...lines) => lines.join('\n');

// SHEET 1
const s1 = XLSX.utils.aoa_to_sheet([
['', 'EN'],
['Description', L(
'Stock cutting and material assignment across Mill Products industries (steel, aluminum, paper, packaging, plastics, textiles, glass) is a universal optimization challenge.',
'Processors purchase large master rolls/coils/sheets and cut them to customer order specs while minimizing waste and maximizing utilization.',
'',
'Core challenge: raw materials procured before orders exist (lead times 2-12 weeks exceed order horizons).',
'Each material unit has 5-15+ physical/chemical parameters that must match order requirements. Optimization is NP-hard.',
'',
'Agentic AI with SAP Joule orchestrator, Order/Stock agents, and MCP optimization server automates this across any mill product type.',
'',
'SUB-INDUSTRIES: Steel Service Centers | Aluminum Processing | Paper and Packaging | Film and Plastics | Textile | Glass | Copper/Brass')],
['CHALLENGES AND BUSINESS DRIVERS', L(
'1. PARAMETER-INTENSIVE MATCHING: 5-15+ params per material (Steel:13, Paper:8, Aluminum:10)',
'2. PROCUREMENT BEFORE DEMAND: Materials ordered weeks before customer orders confirmed',
'3. MANUAL PLANNING: Person-dependent, non-scalable, 8-20% trim waste vs 2-5% achievable',
'4. CONFLICTING OBJECTIVES: Trim waste vs tardy orders vs idle stock vs throughput',
'5. DYNAMIC DISRUPTIONS: Rush orders, supplier delays, machine issues, forecast errors',
'6. SAP GAP: PP/MRP cannot solve combinatorial cutting + multi-param assignment')],
['SOLUTION', L(
'Agentic AI on SAP BTP - industry-configurable:',
'1. SAP JOULE ORCHESTRATOR: NL interface, LLM reasoning, decompose/delegate/explain/write-back',
'2. ORDER AGENT: SAP SD orders/forecasts, configurable params per industry, feasibility/fulfillment',
'3. STOCK AGENT: SAP MM inventory (coils/rolls/sheets), reservations, availability, idle detection',
'4. MCP SERVER (Python/OR-Tools): feasibility network, 1D/2D cutting solver, assignment MILP, evaluator, purchase advisor',
'5. SAP INTEGRATION: Read CDS/OData, Write BAPI (MB21/CO01/ME51N), React Event Mesh')],
['BENEFITS', L(
'QUANTITATIVE: Trim reduction 50-75% | Planning hours to <15 sec | Fulfillment >90% | Idle stock -20-40%',
'IMPACT: Steel 500t/mo EUR28k/mo | Paper 1000t/mo EUR42k/mo | Aluminum 200t/mo EUR35k/mo savings',
'QUALITATIVE: No person-dependency | Full explainability | Event-driven | What-if | SAP-actionable | Multi-plant scalable')],
['COMMENTS', L(
'"The cutting problem is the same for steel coils, paper rolls, or aluminum sheets.',
'What changes is parameters and machine constraints. AI reasoning and SAP integration are universal." - Solution Architect',
'',
'"Having AI that matches supply to demand across complex specs and creates SAP orders automatically',
'is transformational for any mill processor." - VP Operations')],
['Business Questions', L(
'- Do you cut/slit/sheet raw materials to fulfill customer orders?',
'- Must materials match orders across multiple physical/chemical parameters?',
'- Do you procure materials before confirmed orders exist?',
'- Is cutting planning done manually or with spreadsheets?',
'- Do you experience >5% trim/scrap loss?',
'- Is planning expertise in a few key individuals?',
'- Are plans disrupted by order changes or supply delays?',
'- Do you need to balance waste vs delivery vs stock objectives?',
'- Would NL planning interaction be valuable?',
'- Do you run SAP S/4HANA?')]
]);
s1['!cols'] = [{width:28},{width:105}];
XLSX.utils.book_append_sheet(wb, s1, 'Case(Descriptions)');

// SHEET 2
const s2 = XLSX.utils.aoa_to_sheet([
['Level of Maturity','Industry','Industry Cluster','Industry Segments','Product Category L1','Product Category L2','Customer Segment','Focus Topic','Buyer Persona'],
['Actionable Use Case','Mill Products','Discrete Industries','Building Materials','Artificial Intelligence','Supply Chain Planning','Enterprise Segment','Artificial Intelligence','COO'],
['Preperation','Industrial Manufacturing','Cross Industry Cluster','Transportation and Logistics','Business Technology Platform','Supply Chain Logistics','Corporate Segment','Digital Transformation','CIO'],
['On Going','Wholesale Distribution','Consumer Industries','Fashion (Consumer Products)','Supply Chain Management','Application Development and Automation','Midmarket','Data to Insight','CPO'],
['Declined','Automotive','Energy and Natural Resources','OEM (High Tech)','Enterprise Resource Planning','Analytics and Planning','Key Accounts','User Experience','CTO'],
['','Chemicals','Service Industries','','CRM and Customer Experience','Integration','Partner Led','Business AI','CFO'],
['','Engineering, Construction, and Operations','','','Human Capital Management','Procurement','Strategic Customer Program','',''],
['','Mining','','','Spend Management','Enterprise Asset Management','','',''],
['','Metals','','','Financial Management','Manufacturing','','',''],
['','Consumer Products','','','','Commerce','','',''],
]);
s2['!cols']=[{width:20},{width:35},{width:22},{width:26},{width:26},{width:30},{width:24},{width:20},{width:14}];
XLSX.utils.book_append_sheet(wb, s2, 'Experiance Agent(lookups)');

// SHEET 3
const s3 = XLSX.utils.aoa_to_sheet([
['COO: Chief Operating Officer - Production operations, capacity utilization, operational KPIs across mill facilities'],
['CIO: Chief Information Officer - SAP S/4HANA and BTP platform, digital transformation of manufacturing'],
['CPO: Chief Procurement Officer - Raw material sourcing (coils/rolls/sheets), supplier mgmt, inventory optimization'],
['VP Manufacturing: Line efficiency, scrap/trim rates, capacity utilization, quality management'],
['Production Planning Manager: Daily cutting plans, material assignments, scheduling, exception handling'],
['Supply Chain Director: E2E from raw material procurement through processing to customer delivery'],
['Plant Manager: Site operations, cross-functional coordination, cost center management'],
[''],
['Persona','Priorities','Decision Factors','Communication Approach'],
['COO','Waste minimization, OTD, line utilization, multi-plant efficiency','Trim <5%, fulfillment >90%, planning automation, cost/ton','KPI dashboards, ROI, risk reduction, scalability'],
['CIO','SAP integration, security, scalability, BTP strategy','SAP-native, data residency, multi-tenant, API standards','Architecture, security, SAP roadmap'],
['CPO','Material cost optimization, stock aging, supplier risk','Purchase recommendations, idle stock visibility, lead times','Working capital impact, procurement efficiency'],
['VP Manufacturing','Throughput, trim minimization, quality, machine utilization','Trim improvement, pattern efficiency, constraint handling','Before/after, waste metrics, throughput gains'],
['Planning Manager','Plan quality, speed, SAP executability, disruption handling','NL ease, explainability, what-if, re-planning speed','Demo, workflow fit, time savings'],
['SC Director','E2E optimization, forecast accuracy, customer satisfaction','Demand-supply visibility, event replanning, integrated KPIs','Strategic value, competitive advantage'],
['Plant Manager','Site efficiency, shift consistency, labor productivity','Deployment ease, training, standardization, support','Timeline, change mgmt, quick wins'],
]);
s3['!cols']=[{width:30},{width:55},{width:55},{width:45}];
XLSX.utils.book_append_sheet(wb, s3, 'Buyer Persona');

// SHEET 4
const s4 = XLSX.utils.aoa_to_sheet([
['Prompt Type','Prompt Text'],
['Use Case Summary','Generate executive summary: Agentic AI for Stock Cutting across Mill Products (steel/paper/aluminum/packaging). SAP Joule + agents + MCP optimizer. Industry-configurable. 50-75% trim reduction, <15s planning, NL interaction, SAP write-back.'],
['Technical Architecture','Generate architecture: SAP BTP with Joule (AI Core LLM), Order Agent (SD OData, configurable N-params), Stock Agent (MM OData, coils/rolls/sheets), Python MCP Server (feasibility network, cutting solver, assignment MILP, evaluator, purchase advisor), BAPI write-back, Event Mesh. Configurable per industry.'],
['Business Value','Generate value prop: Universal cutting optimization for mill processors. Procurement-before-demand, N-parameter matching, manual to automated, 50-75% trim reduction. ROI: Steel EUR28k/mo, Paper EUR42k/mo, Aluminum EUR35k/mo.'],
['Demo Script','Generate 3-scenario demo: (1) Full Planning 50+ orders/40+ materials, independent groups, 2-4% trim, SAP write-back. (2) Single item feasibility check with ranked options. (3) What-if comparison with/without forecasts.'],
['ROI Model','Generate ROI: savings = (current_trim - optimized_trim) x throughput x cost/ton. Steel: 7% x 500t x EUR800 = EUR28k/mo. Paper: 7% x 1000t x EUR600 = EUR42k/mo. Aluminum: 7% x 200t x EUR2500 = EUR35k/mo. Plus labor and working capital.'],
['Industry Config','Explain configurability: Parameter sets (Steel:13, Paper:8, Aluminum:10), Operation types (slit/sheet/cross-cut/die-cut), Machine constraints, Objective weights, SAP material master mapping. Same engine, different config.'],
]);
s4['!cols']=[{width:22},{width:115}];
XLSX.utils.book_append_sheet(wb, s4, 'generation-prompt(EKX)');

// SHEET 5
const s5 = XLSX.utils.aoa_to_sheet([
['Diagram Type','Prompt Text'],
['Solution Landscape','Draw AI case landscape for Mill Products: Engineer uses Joule NL. Joule calls Order Agent (SAP SD) and Stock Agent (SAP MM with N-param materials). MCP Server builds feasibility network, solves cutting patterns, optimizes assignment. Results explained, confirmed to SAP (reservations+prod orders). Event Mesh for reactive triggers. Show applicability to steel coils, paper rolls, aluminum sheets.'],
['Solution Architecture','Draw architecture: Top-SAP Fiori+Joule. Middle-BTP: Joule Orchestrator (AI Core), CAP Agents (configurable params), Python MCP (OR-Tools). Bottom-S/4HANA: MM/SD/PP. Side panel: industry configs (Steel 13 params, Paper 8, Aluminum 10). HANA Cloud for state.'],
['Data Flow','Draw flow: Orders (SAP SD, industry params) to Order Agent. Materials (SAP MM, batch chars) to Stock Agent. MCP produces: Feasibility Network, Assignment Plan, Cutting Patterns, KPIs. Write-back: Reservations + Prod Orders + Purchase Reqs. Events trigger re-planning.'],
['Industry Comparison','Draw comparison: Center=common components (Joule/Agents/MCP/SAP). Surrounding=5 industry variants with specific params: Steel (quality/thickness/width/coating-slitting/CTL), Paper (grade/weight/caliper-slitting/sheeting), Aluminum (alloy/temper/thickness-slitting/blanking), Film (gauge/clarity-slitting), Packaging (board/gsm-sheeting/die-cut).'],
]);
s5['!cols']=[{width:22},{width:120}];
XLSX.utils.book_append_sheet(wb, s5, 'draw-prompt(EKX)');

XLSX.writeFile(wb, 'Mill_Products_Stock_Cutting_AI_UseCase.xlsx');
console.log('Generated: Mill_Products_Stock_Cutting_AI_UseCase.xlsx');