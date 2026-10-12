const XLSX = require('xlsx');

// Helper
const L = (...a) => a.join('\n');

// Read existing excels and update the generation-prompt sheet
function updateExcel(inputFile, outputFile, genData, drawData) {
  const wb = XLSX.readFile(inputFile);
  
  // Remove old sheets if they exist
  if (wb.SheetNames.includes('generation-prompt(EKX)')) {
    delete wb.Sheets['generation-prompt(EKX)'];
    wb.SheetNames = wb.SheetNames.filter(n => n !== 'generation-prompt(EKX)');
  }
  if (wb.SheetNames.includes('draw-prompt(EKX)')) {
    delete wb.Sheets['draw-prompt(EKX)'];
    wb.SheetNames = wb.SheetNames.filter(n => n !== 'draw-prompt(EKX)');
  }
  
  // Add updated sheets
  const ws4 = XLSX.utils.aoa_to_sheet(genData);
  ws4['!cols'] = [{width:18},{width:140}];
  XLSX.utils.book_append_sheet(wb, ws4, 'generation-prompt(EKX)');
  
  const ws5 = XLSX.utils.aoa_to_sheet(drawData);
  ws5['!cols'] = [{width:22},{width:130}];
  XLSX.utils.book_append_sheet(wb, ws5, 'draw-prompt(EKX)');
  
  XLSX.writeFile(wb, outputFile);
  console.log('Updated: ' + outputFile);
}

// ====== STEEL GENERATION PROMPT ======
const steelGenPrompt = [
  [''],
  [L(
    'Generate a PowerPoint presentation with 5 slides for a SAP Use Case document.',
    'Use white background for content slides (2-5), font BentonSans, SAP colors: #1D80D3 headers, #E89A20 cover labels, #000000 body.'
  )],
  [''],
  ['SLIDE', 'CONTENT'],
  ['SLIDE 1 Cover', L(
    'Full-bleed blue-to-green gradient background.',
    'Label top-left: "Use Case" large white bold.',
    'Title: "Agentic Stock Cutting and Material Assignment for Steel Service Centers" large white bold.',
    'Metadata (orange labels / white values):',
    'Confidentiality: Public',
    'Product Category: Artificial Intelligence, Business Technology Platform, Supply Chain Management',
    'ID: UC_TRIM_001',
    'Publishing: Content Discovery, SAP Discovery Center',
    'Created: 08/06/2025 | Last Updated: 08/06/2025'
  )],
  ['SLIDE 2 Description', L(
    'Title: "Agentic Stock Cutting and Material Assignment for Steel Service Centers"',
    '',
    'LEFT - DESCRIPTION:',
    'Steel Service Centers purchase raw material coils and process them via slitting/CTL.',
    'Challenge: materials procured 4-8 weeks before orders (lead time > order horizon).',
    'Each coil has 13 physical parameters that must match order specs.',
    'Agentic AI with SAP Joule orchestrator, Order/Stock agents, MCP optimization server (OR-Tools)',
    'automates matching and cutting - achieves 2-4% trim vs 8-15% manual - writes to SAP S/4HANA.',
    '',
    'CONTACTS: Use Case Owner: [Name] | Internal Experts: [Names]',
    '',
    'RIGHT - USE CASE CLASSIFICATION:',
    'Authoring: SAP | Maturity: Actionable Use Case | Source: BTP/AI',
    'Process: Design to Operate > Plan to Fulfill',
    'Products: AI, BTP, Supply Chain Management',
    'Industry: Mill Products, Industrial Manufacturing, Metals, Wholesale Distribution',
    'LoB: Supply Chain Planning, Manufacturing',
    'Focus: Artificial Intelligence, Business AI, Digital Transformation'
  )],
  ['SLIDE 3 Challenges/Solution/Benefits', L(
    'TOP-LEFT - CHALLENGES:',
    '- 13-parameter near-custom matching (siparise ozel hammadde)',
    '- Procurement before demand (4-8 week supplier lead times)',
    '- Manual planning: person-dependent, hours, 8-15% trim waste',
    '- Conflicting objectives: trim vs tardy vs idle stock',
    '- Plans break daily: date changes, supply disruptions, wrong forecasts',
    '- SAP PP/MRP gap: no combinatorial cutting optimization',
    '',
    'TOP-RIGHT - SOLUTION:',
    '1. SAP Joule Orchestrator: NL + LLM reasoning + SAP write-back',
    '2. Order Agent: SAP SD, feasibility, fulfillment, urgency',
    '3. Stock Agent: SAP MM, reservations, availability, idle detection',
    '4. MCP Server (Python/OR-Tools): 5 tools - feasibility network, cutting solver, assignment MILP, evaluator, purchase advisor',
    '5. SAP Integration: CDS/OData read, BAPI write (MB21/CO01), Event Mesh react',
    '',
    'BOTTOM-LEFT - BENEFITS:',
    '- Trim: 8-15% to 2-4% (50-75% reduction)',
    '- Planning: hours to <15 seconds',
    '- Fulfillment: >90% with gap identification',
    '- ROI: 500t/mo x EUR800/t x 7% = EUR28,000/month savings',
    '- Eliminates person-dependency, full explainability, event-driven, what-if',
    '',
    'BOTTOM-RIGHT - COMMENTS:',
    '"We buy steel before knowing what customers will order. AI reasoning about 13 params,',
    'explaining WHY, creating SAP transactions - changes everything." - Planning Manager'
  )],
  ['SLIDE 4 Customers/Questions', L(
    'LEFT - TARGET CUSTOMERS:',
    'Segment: Enterprise, Corporate, Midmarket',
    'Type: Active, Net New',
    'Persona: COO, CIO, CPO, VP Manufacturing, Production Planning Manager',
    'Profile: Steel Service Centers using SAP S/4HANA',
    'Deployment: 60-120 days (4 phases)',
    'Differentiation: High (no native SAP solution)',
    '',
    'RIGHT - QUALIFYING QUESTIONS:',
    'Business:',
    '- Manually match coils to orders by multiple parameters?',
    '- Planning dependent on individual expertise?',
    '- >5% trim loss in slitting/CTL?',
    '- Plans disrupted by order changes / supply delays?',
    '- Procure materials before confirmed orders?',
    '- Need to balance trim vs delivery vs utilization?',
    '',
    'Technical:',
    '- Run SAP S/4HANA for inventory/orders?',
    '- Benefit from Joule NL interaction?',
    '- Event-driven re-planning valuable?',
    '- Need audit trails and explainability?'
  )],
  ['SLIDE 5 Architecture', L(
    'LEFT - SOLUTION DIAGRAM:',
    'Top: SAP Fiori + Joule sidebar (Planning Engineer)',
    'Middle: SAP BTP:',
    '  - Joule Orchestrator (AI Core LLM)',
    '  - CAP Agent Services (Order Agent + Stock Agent, OData)',
    '  - Python MCP Server (OR-Tools)',
    'Bottom: SAP S/4HANA:',
    '  - MM (Coil Inventory, Batches, Reservations)',
    '  - SD (Sales Orders, Forecasts)',
    '  - PP (Production Orders)',
    'Connections: OData V4 reads, BAPI/RFC writes, Event Mesh events',
    'Side: SAP HANA Cloud (plan history, feasibility cache)',
    '',
    'RIGHT - ADDITIONAL INFO:',
    'Support: Full Support',
    'Phases: Foundation(4-6w), Integration(4-6w), Orchestration(4-6w), Hardening(2-4w)',
    'Prerequisites: SAP S/4HANA, BTP with AI Core, Event Mesh',
    'Stack: Python(OR-Tools), Node.js(CAP), SAP AI Core(LLM)'
  )],
];

// ====== STEEL DRAW PROMPT ======
const steelDrawPrompt = [
  ['Diagram Type', 'Prompt Text'],
  ['Solution Landscape', 'Draw 1-page AI case landscape: Engineer uses Joule NL in Fiori. Joule calls Order Agent (SAP SD orders/forecasts) and Stock Agent (SAP MM coils, 13 params). MCP Server builds feasibility network (connected components), solves cutting patterns (slitting/CTL, OR-Tools), optimizes assignment (multi-obj MILP). Joule explains results, writes reservations (MB21) and production orders (CO01) to SAP. Event Mesh triggers on new orders/coils.'],
  ['Solution Architecture', 'Draw architecture: Top=Fiori+Joule. Middle=BTP: Joule Orchestrator(AI Core), CAP Agents(Order+Stock, OData), Python MCP(OR-Tools). Bottom=S/4HANA: MM/SD/PP. Side=HANA Cloud. Connections: OData reads, BAPI writes, Event Mesh events.'],
  ['Data Flow', 'Draw flow: Orders(SD) to Order Agent. Coils(MM,13 params) to Stock Agent. MCP produces: Feasibility Network, Assignment Plan, Cutting Patterns, KPIs. Write-back: Reservations + Prod Orders + Purchase Reqs.'],
];

// ====== MILL GENERATION PROMPT ======
const millGenPrompt = [
  [''],
  [L(
    'Generate a PowerPoint presentation with 5 slides for a SAP Use Case document.',
    'Use white background for content slides (2-5), font BentonSans, SAP colors: #1D80D3 headers, #E89A20 cover labels, #000000 body.'
  )],
  [''],
  ['SLIDE', 'CONTENT'],
  ['SLIDE 1 Cover', L(
    'Full-bleed blue-to-green gradient background.',
    'Label top-left: "Use Case" large white bold.',
    'Title: "Agentic Stock Cutting and Material Assignment for Mill Products Industry" large white bold.',
    'Metadata (orange labels / white values):',
    'Confidentiality: Public',
    'Product Category: Artificial Intelligence, Business Technology Platform, Supply Chain Management',
    'ID: UC_TRIM_MILL_001',
    'Publishing: Content Discovery, SAP Discovery Center',
    'Created: 08/06/2025 | Last Updated: 08/06/2025'
  )],
  ['SLIDE 2 Description', L(
    'Title: "Agentic Stock Cutting and Material Assignment for Mill Products"',
    '',
    'LEFT - DESCRIPTION:',
    'Across Mill Products (steel, aluminum, paper, packaging, film, textile, glass, copper)',
    'companies purchase large raw material units and cut to customer specs across 5-15+ parameters.',
    'Materials procured 2-12 weeks before orders confirmed.',
    'Industry-configurable Agentic AI: Joule orchestrator, agents, MCP optimizer.',
    'Automates N-parameter matching, assignment, cutting for ANY mill product type.',
    '',
    'RIGHT - USE CASE CLASSIFICATION:',
    'Authoring: SAP | Maturity: Actionable | Source: BTP/AI',
    'Process: Design to Operate > Plan to Fulfill',
    'Products: AI, BTP, SCM',
    'Industry: Mill Products, Industrial Manufacturing, Metals, Chemicals, Consumer Products, Wholesale',
    'LoB: Supply Chain Planning, Manufacturing',
    'Focus: AI, Business AI, Digital Transformation'
  )],
  ['SLIDE 3 Challenges/Solution/Benefits', L(
    'TOP-LEFT - CHALLENGES:',
    '- Parameter-intensive: 5-15+ params (Steel:13, Paper:8, Aluminum:10)',
    '- Procurement before demand (2-12 week lead times)',
    '- Manual planning: 8-20% waste vs 2-5% achievable',
    '- Conflicting objectives: waste vs delivery vs stock vs throughput',
    '- Dynamic disruptions: rush orders, delays, forecast errors',
    '- SAP gap: no combinatorial cutting optimization in PP/MRP',
    '',
    'TOP-RIGHT - SOLUTION:',
    '1. Joule Orchestrator: NL, LLM reasoning, industry-agnostic',
    '2. Order Agent: SAP SD, configurable N-params per industry',
    '3. Stock Agent: SAP MM, coils/rolls/sheets/reels',
    '4. MCP Server: feasibility, cutting(slit/sheet/cross/die), MILP, evaluator, purchase',
    '5. SAP: CDS/OData read, BAPI write, Event Mesh react',
    '',
    'BOTTOM-LEFT - BENEFITS:',
    '- Trim reduction 50-75%',
    '- Steel: EUR28k/mo | Paper: EUR42k/mo | Aluminum: EUR35k/mo',
    '- Planning hours to <15 sec | Fulfillment >90% | Idle stock -20-40%',
    '- Person-independent, explainable, event-driven, multi-plant scalable',
    '',
    'BOTTOM-RIGHT - COMMENTS:',
    '"Same problem for steel coils, paper rolls, aluminum sheets.',
    'Parameters and constraints change. AI reasoning and SAP integration are universal."'
  )],
  ['SLIDE 4 Customers/Questions', L(
    'LEFT - TARGET CUSTOMERS:',
    'Segment: Enterprise, Corporate, Midmarket',
    'Type: Active, Net New',
    'Persona: COO, CIO, CPO, VP Mfg, Planning Mgr, SC Director, Plant Mgr',
    'Profile: Any mill processor cutting raw materials to order using SAP',
    'Sub-industries: Steel, Aluminum, Paper, Packaging, Film, Textile, Glass',
    'Deployment: 60-120 days | Differentiation: High',
    '',
    'RIGHT - QUALIFYING QUESTIONS:',
    '- Cut/slit/sheet raw materials to fulfill orders?',
    '- Materials must match multiple physical/chemical parameters?',
    '- Procure materials before confirmed orders?',
    '- Planning manual or spreadsheet-based?',
    '- >5% trim/scrap loss?',
    '- Planning in few key individuals?',
    '- Plans disrupted by changes/delays?',
    '- Balance waste vs delivery vs stock?',
    '- Run SAP S/4HANA?',
    '- NL interaction and explainability valuable?'
  )],
  ['SLIDE 5 Architecture', L(
    'LEFT - SOLUTION DIAGRAM:',
    'Top: Fiori + Joule (any mill planner)',
    'Middle: BTP - Joule(AI Core), CAP Agents(configurable params), MCP(OR-Tools)',
    'Bottom: S/4HANA - MM/SD/PP',
    'Side panel: Industry configs (Steel 13p, Paper 8p, Aluminum 10p)',
    'HANA Cloud for state',
    '',
    'RIGHT - ADDITIONAL INFO:',
    'Support: Full | Phases: 4 (Foundation/Integration/Orchestration/Hardening)',
    'Prerequisites: S/4HANA, BTP+AI Core, Event Mesh',