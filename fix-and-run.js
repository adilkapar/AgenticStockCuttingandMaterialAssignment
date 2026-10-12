const XLSX = require('xlsx');
const L = (...a) => a.join('\n');

function updateSheet(file, genData, drawData) {
  const wb = XLSX.readFile(file);
  const remove = ['generation-prompt(EKX)', 'draw-prompt(EKX)'];
  remove.forEach(name => {
    if (wb.SheetNames.includes(name)) {
      delete wb.Sheets[name];
      wb.SheetNames = wb.SheetNames.filter(n => n !== name);
    }
  });
  const ws4 = XLSX.utils.aoa_to_sheet(genData);
  ws4['!cols'] = [{width:18},{width:140}];
  XLSX.utils.book_append_sheet(wb, ws4, 'generation-prompt(EKX)');
  const ws5 = XLSX.utils.aoa_to_sheet(drawData);
  ws5['!cols'] = [{width:22},{width:130}];
  XLSX.utils.book_append_sheet(wb, ws5, 'draw-prompt(EKX)');
  XLSX.writeFile(wb, file);
  console.log('Updated: ' + file);
}

// STEEL
const sg = [
[''],
['Generate a PowerPoint with 5 slides for SAP Use Case. White bg slides 2-5, BentonSans, SAP colors #1D80D3/#E89A20/#000000.'],
[''],
['SLIDE','CONTENT'],
['SLIDE 1 Cover', L('Blue-green gradient bg.','Title: "Agentic Stock Cutting and Material Assignment for Steel Service Centers"','Metadata: Public | AI, BTP, SCM | UC_TRIM_001 | 08/06/2025')],
['SLIDE 2 Description', L('LEFT DESCRIPTION: Steel Service Centers cut coils via slitting/CTL. Materials procured 4-8w before orders. 13 physical params must match. Agentic AI (Joule+Agents+MCP/OR-Tools) automates matching/cutting, 2-4% trim vs 8-15% manual, writes to SAP.','','RIGHT CLASSIFICATION: SAP | Actionable | BTP/AI | Plan to Fulfill | AI+BTP+SCM | Mill Products, Metals | SC Planning | AI, Business AI')],
['SLIDE 3 Quad', L('CHALLENGES: 13-param matching, procurement before demand, manual 8-15% waste, conflicting objectives, daily disruptions, SAP gap.','','SOLUTION: Joule orchestrator + Order Agent(SD) + Stock Agent(MM) + MCP Server(feasibility/cutting/MILP/evaluator/purchase) + SAP integration(CDS/BAPI/Events).','','BENEFITS: Trim 2-4%, <15s planning, >90% fulfillment, EUR28k/mo savings(500t). No person-dependency, explainable, event-driven.','','COMMENTS: "AI reasoning about 13 params, explaining WHY, creating SAP transactions - changes everything." - Planning Manager')],
['SLIDE 4 Customers', L('CUSTOMERS: Enterprise/Corporate/Midmarket | Active/New | COO/CIO/CPO/VP Mfg/Planning Mgr | Steel SCs on SAP | 60-120 days | High differentiation','','QUESTIONS Business: Match coils by params? Person-dependent? >5% trim? Disruptions? Procure before orders? Balance objectives?','Technical: SAP S/4HANA? Joule NL? Event-driven? Audit trails?')],
['SLIDE 5 Architecture', L('DIAGRAM: Fiori+Joule > BTP(Joule/AI Core, CAP Agents/OData, MCP/OR-Tools) > S/4HANA(MM/SD/PP) + HANA Cloud','','INFO: Full Support | 4 phases(4-6w each) | Prerequisites: S/4HANA, BTP+AI Core, Event Mesh | Stack: Python, Node.js/CAP, AI Core')],
];
const sd = [
['Diagram Type','Prompt'],
['Solution Landscape','Draw: Joule > Order Agent(SD) + Stock Agent(MM,13p) > MCP(feasibility+cutting+MILP) > SAP write-back(MB21/CO01). Event Mesh triggers.'],
['Architecture','Draw: Top=Fiori+Joule. Mid=BTP(Joule/AI Core, CAP Agents, MCP/OR-Tools). Bot=S/4HANA(MM/SD/PP). Side=HANA Cloud.'],
['Data Flow','Draw: Orders(SD)>OrderAgent. Coils(MM)>StockAgent. MCP>Network+Patterns+Plan+KPIs. Write>Reservations+ProdOrders+PurchReqs.'],
];

// MILL
const mg = [
[''],
['Generate a PowerPoint with 5 slides for SAP Use Case. White bg slides 2-5, BentonSans, SAP colors #1D80D3/#E89A20/#000000.'],
[''],
['SLIDE','CONTENT'],
['SLIDE 1 Cover', L('Blue-green gradient bg.','Title: "Agentic Stock Cutting and Material Assignment for Mill Products Industry"','Metadata: Public | AI, BTP, SCM | UC_TRIM_MILL_001 | 08/06/2025')],
['SLIDE 2 Description', L('LEFT: Mill Products (steel/aluminum/paper/packaging/film/textile/glass) cut raw material to order across 5-15+ params. Materials procured 2-12w before orders. Industry-configurable Agentic AI automates for ANY mill type.','','RIGHT: SAP | Actionable | BTP/AI | Plan to Fulfill | AI+BTP+SCM | Mill Products, Metals, Chemicals, Consumer | SC Planning | AI, Business AI')],
['SLIDE 3 Quad', L('CHALLENGES: 5-15+ params(Steel:13,Paper:8,Aluminum:10), procurement before demand, manual 8-20% waste, conflicting objectives, disruptions, SAP gap.','','SOLUTION: Configurable Joule + Order Agent(N-params) + Stock Agent(coils/rolls/sheets) + MCP(feasibility/cutting/MILP) + SAP(CDS/BAPI/Events). Same engine, different config.','','BENEFITS: 50-75% trim reduction. Steel EUR28k/mo, Paper EUR42k/mo, Aluminum EUR35k/mo. <15s, >90%, multi-plant scalable.','','COMMENTS: "Same problem for steel coils, paper rolls, aluminum sheets. Params change, AI+SAP universal." - Architect')],
['SLIDE 4 Customers', L('CUSTOMERS: Enterprise/Corporate/Midmarket | Active/New | COO/CIO/CPO/VP/PlanMgr/SCDir/PlantMgr | Any mill processor on SAP | Steel/Aluminum/Paper/Packaging/Film/Textile/Glass | 60-120 days | High','','QUESTIONS: Cut/slit/sheet materials? Match N params? Procure before orders? Manual planning? >5% scrap? Key-person risk? Disruptions? SAP S/4HANA? NL valuable?')],
['SLIDE 5 Architecture', L('DIAGRAM: Fiori+Joule > BTP(Joule/AI Core, CAP Agents configurable, MCP/OR-Tools) > S/4HANA(MM/SD/PP). Side=Industry configs(Steel 13p, Paper 8p, Aluminum 10p). HANA Cloud.','','INFO: Full Support | 4 phases | Prerequisites: S/4HANA, BTP+AI Core, Event Mesh | Configurable per industry')],
];
const md = [
['Diagram Type','Prompt'],
['Solution Landscape','Draw: Joule > Order Agent(SD,N-params) + Stock Agent(MM,coils/rolls/sheets) > MCP(feasibility+cutting+MILP) > SAP(MB21/CO01). Events. Show steel/paper/aluminum applicability.'],
['Architecture','Draw: Top=Fiori+Joule. Mid=BTP(Joule, Agents configurable, MCP). Bot=S/4HANA. Side=Industry configs(Steel/Paper/Aluminum). HANA Cloud.'],
