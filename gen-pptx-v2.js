const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';

const B='1D80D3', O='E89A20', D='333333', W='FFFFFF', T='0A7B83';

function title(s, t) { s.addText(t, {x:0.5,y:0.3,w:12,h:0.7,fontSize:24,bold:true,color:B}); s.addShape(pptx.ShapeType.rect,{x:0.5,y:1.1,w:12.5,h:0.02,fill:{color:'CCCCCC'}}); }

// S1 - Cover
let s=pptx.addSlide(); s.background={color:'0F3B5F'};
s.addText('The Material Assignment &\nStock Cutting Challenge\nin Mill Products',{x:0.8,y:1,w:10,h:2.5,fontSize:32,bold:true,color:W});
s.addText('Why AI-Powered Planning is Needed When You Must Buy Before You Sell',{x:0.8,y:3.8,w:10,h:1,fontSize:18,color:O});

// S2 - Value Chain
s=pptx.addSlide(); title(s,'What Does a Mill Products Processor Do?');
s.addText('SUPPLIER\n(Steel/Paper/Aluminum Mill)\n\nLarge Raw Materials:\n• Coils (1000-2000mm wide)\n• Rolls (5-25 tons)\n• Sheets',{x:0.5,y:1.4,w:3.8,h:4.5,fontSize:12,color:D,valign:'top'});
s.addText('→\nCUT\n→',{x:4.3,y:2.5,w:1,h:2,fontSize:20,color:B,align:'center',valign:'middle'});
s.addText('PROCESSOR\n(Service Center / Converter)\n\nOperations:\n• Slitting (width cuts)\n• Cut-to-Length\n• Sheeting\n• Die-cutting',{x:5.3,y:1.4,w:3.5,h:4.5,fontSize:12,color:D,valign:'top'});
s.addText('→\nDELIVER\n→',{x:8.8,y:2.5,w:1,h:2,fontSize:20,color:B,align:'center',valign:'middle'});
s.addText('CUSTOMER\n(Manufacturer / Construction)\n\nSmaller Pieces:\n• Exact width (200-1500mm)\n• Exact weight (0.5-8 tons)\n• Exact specifications',{x:9.8,y:1.4,w:3.2,h:4.5,fontSize:12,color:D,valign:'top'});

// S3 - Lead Time
s=pptx.addSlide(); title(s,'The Fundamental Timing Mismatch');
s.addText('Supplier Lead Time: 4-12 weeks',{x:1,y:1.5,w:6,h:0.6,fontSize:15,bold:true,color:O});
s.addShape(pptx.ShapeType.rect,{x:1,y:2.2,w:7,h:0.4,fill:{color:O}});
s.addText('Purchase Decision\n(based on FORECASTS)',{x:0.5,y:2.8,w:3,h:1,fontSize:12,color:D,align:'center'});
s.addText('Material Arrives',{x:6.5,y:2.8,w:2.5,h:1,fontSize:12,color:D,align:'center'});
s.addText('Order Confirmation Horizon: 1-2 weeks only',{x:7,y:4.0,w:5,h:0.6,fontSize:15,bold:true,color:B});
s.addShape(pptx.ShapeType.rect,{x:7,y:4.7,w:4.5,h:0.4,fill:{color:B}});
s.addText('Orders Confirmed',{x:7,y:5.2,w:2.5,h:0.8,fontSize:12,color:D,align:'center'});
s.addText('Must Deliver',{x:10,y:5.2,w:2,h:0.8,fontSize:12,color:D,align:'center'});
s.addText('You must BUY before you know what customers will ORDER!',{x:0.5,y:6.5,w:12,h:0.5,fontSize:14,bold:true,color:'CC0000'});

// S4 - MRP
s=pptx.addSlide(); title(s,'How Procurement Works: Buying Against Forecasts');
s.addText('DEMAND\n\n• Confirmed Orders (1-2 weeks)\n  Known and firm\n\n• Forecast Orders (4-12 weeks)\n  Predicted, uncertain\n\nMRP plans against BOTH\nto trigger purchases',{x:0.5,y:1.4,w:5.5,h:5,fontSize:13,color:D,valign:'top'});
s.addText('SUPPLY\n\n• Stock (in warehouse now)\n\n• In-Transit (shipped, arriving)\n\n• Purchase Orders (at supplier)\n\nAll purchased based on\nforecast accuracy',{x:7,y:1.4,w:5.5,h:5,fontSize:13,color:D,valign:'top'});
s.addText('Forecasts are never 100% accurate → mismatch between purchased stock and actual orders',{x:0.5,y:6.3,w:12,h:0.5,fontSize:12,bold:true,color:'CC0000'});

// S5 - Matching
s=pptx.addSlide(); title(s,'When Orders Arrive: The Multi-Parameter Matching Challenge');
s.addText('Each order must match a raw material across 5-13+ parameters:\n\n• Product Group      • Quality        • Thickness\n• Width              • Surface Group  • Coating Amount\n• Roughness          • Passivation    • Protective Oil\n• Outer Diameter     • Inner Diameter • Origin/Supplier\n• Due Date vs Arrival Date\n\nALL must match simultaneously!\n\nResult: Raw materials are almost "order-specific"\n(neredeyse siparise ozel hammadde)',{x:0.5,y:1.4,w:7,h:5.5,fontSize:13,color:D,valign:'top'});
s.addText('This is NOT simple\nfirst-come-first-serve\nallocation.\n\nIt requires combinatorial\noptimization across\nmultiple dimensions.',{x:8.5,y:2,w:4,h:3.5,fontSize:14,bold:true,color:B,valign:'top'});

// S6 - Assignment
s=pptx.addSlide(); title(s,'The Assignment Dilemma');
s.addText('Multiple orders may be feasible for the same coil\n— WHO gets it?\n\nSome orders have NO feasible coil in stock\n— CANNOT fulfill (need to purchase)\n\nSome coils have NO feasible orders\n— IDLE STOCK (wasted capital)\n\nThe assignment decision directly impacts:\n• Cutting efficiency (trim loss)\n• Delivery performance (on-time)\n• Working capital (idle stock)\n• Revenue (orders planned)',{x:0.5,y:1.4,w:7,h:5.5,fontSize:13,color:D,valign:'top'});
s.addText('FEASIBILITY\nNETWORK\n\nOrders ←→ Materials\n(bipartite graph)\n\nOnly connected if\nALL parameters match',{x:8.5,y:2,w:4,h:3.5,fontSize:13,bold:true,color:T,valign:'top'});

// S7 - Trim Loss
s=pptx.addSlide(); title(s,'The Cutting Problem: Trim Loss');
s.addText('Coil Width: 1500mm\n\nGOOD: Order A (1000mm) + Order B (500mm) = 0% trim ✓\n\nBAD:  Order A (1000mm) alone = 500mm WASTE (33%) ✗\n\n\nThe RIGHT combination of orders on one coil → 0% waste\nThe WRONG assignment → 10-30% material thrown away\n\nAssignment and cutting must be solved TOGETHER\nbecause who goes on which coil determines the pattern!',{x:0.5,y:1.4,w:12,h:5.5,fontSize:14,color:D,valign:'top'});

// S8 - 5 Objectives
s=pptx.addSlide(); title(s,'Five Goals That Conflict With Each Other');
s.addText('1. Minimize Trim Loss (save material cost)\n\n2. Minimize Tardy Orders (customer satisfaction)\n\n3. Minimize Excess/Scrap Material\n\n4. Maximize Orders Planned (revenue)\n\n5. Minimize Idle Stock Age (working capital)\n\n\nTrade-offs:\n• Oldest coil first (good for #5) → may give worse trim (bad for #1)\n• Plan all orders (good for #4) → may accept higher waste (bad for #1)\n• Wait for perfect coil (good for #1) → order becomes tardy (bad for #2)',{x:0.5,y:1.4,w:12,h:5.8,fontSize:13,color:D,valign:'top'});

// S9 - Plans Break
s=pptx.addSlide(); title(s,'Reality: Plans Break Every Day');
s.addText('Even a perfect plan becomes obsolete within hours:\n\n• New urgent order arrives\n• Customer changes due date\n• Supplier delays shipment\n• Forecast was wrong\n• Machine breaks down\n• Quality issue on a coil\n\nResult: Companies fall back to\n"urgency-based daily planning"\n\nNeed: A system that can RE-PLAN\ninstantly when things change',{x:0.5,y:1.4,w:7,h:5.5,fontSize:13,color:D,valign:'top'});
s.addText('Current State:\n\nManual re-planning\ntakes HOURS\n\nDepends on 1-2\nexpert planners\n\nLeads to 8-15%\ntrim waste',{x:8.5,y:2,w:4,h:3.5,fontSize:14,bold:true,color:'CC0000',valign:'top'});

// S10 - ERP Gap
s=pptx.addSlide(); title(s,'Why Standard ERP/MRP Cannot Solve This');
s.addText('What is NEEDED:                          What SAP MRP/PP does:\n─────────────────                        ──────────────────────\nMulti-parameter matching (13 params)     BOM explosion (material→components)\n\nCombinatorial cutting optimization       Lot sizing (how much to produce)\n(NP-hard bin-packing)                    \n\nMulti-objective assignment               Single-level scheduling\n(5 conflicting goals simultaneously)     (when to produce)\n\nEvent-driven re-planning                 Periodic batch MRP run\n(react in seconds)                       (daily or weekly)\n\nExplainability                           Transaction logs\n("WHY this specific assignment?")        (what happened, not why)',{x:0.5,y:1.4,w:12,h:5,fontSize:12,color:D,valign:'top',fontFace:'Courier New'});
s.addText('This gap requires specialized optimization + AI',{x:0.5,y:6.3,w:12,h:0.5,fontSize:13,bold:true,color:'CC0000'});

// S11 - Solution Preview
s=pptx.addSlide(); title(s,'Our Approach: Agentic AI for Stock Cutting & Material Assignment');
s.addText('Planning Engineer → SAP Joule (AI Orchestrator)\n                         ↓\n         ┌───────────────┼───────────────┐\n         ↓               ↓               ↓\n    Order Agent     Stock Agent     Optimization\n    (SAP SD)       (SAP MM)        Engine (MCP)\n         ↓               ↓               ↓\n         └───────────────┼───────────────┘\n                         ↓\n              SAP S/4HANA (execute plan)\n              • Reservations (MB21)\n              • Production Orders (CO01)',{x:0.5,y:1.4,w:8,h:4,fontSize:12,color:D,fontFace:'Courier New',valign:'top'});
s.addText('Results:\n\n• 2-4% trim loss\n  (vs 8-15% manual)\n\n• <15 second planning\n  (vs hours)\n\n• 90%+ fulfillment\n\n• Instant re-planning\n\n• Full explainability',{x:9,y:1.4,w:4,h:5,fontSize:13,bold:true,color:B,valign:'top'});

// S12 - Transition
s=pptx.addSlide(); s.background={color:'0F3B5F'};
s.addText('Next:\nDeep Dive into the\nAgentic Architecture',{x:0.8,y:1.5,w:10,h:2.5,fontSize:32,bold:true,color:W});
s.addText('• How SAP Joule orchestrates the planning process\n• How Order Agent and Stock Agent collaborate\n• How the Optimization Engine solves cutting + assignment\n• How results write back to SAP S/4HANA\n• Live demo scenarios',{x:0.8,y:4.2,w:10,h:2.5,fontSize:16,color:O});

// Save
pptx.writeFile({fileName:'Context_Setting_Stock_Cutting.pptx'}).then(()=>console.log('Created: Context_Setting_Stock_Cutting.pptx'));