const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'SAP Use Case Team';
pptx.subject = 'Stock Cutting & Material Assignment - Context Setting';

// Colors
const BLUE = '1D80D3';
const ORANGE = 'E89A20';
const DARK = '333333';
const WHITE = 'FFFFFF';
const TEAL = '0A7B83';
const GRAY = '666666';
const LIGHTGRAY = 'F5F5F5';

// SLIDE 1 - Title
let s1 = pptx.addSlide();
s1.background = { color: '0F3B5F' };
s1.addText('The Material Assignment &\nStock Cutting Challenge\nin Mill Products', { x: 0.8, y: 1.0, w: 8, h: 2.5, fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial' });
s1.addText('Why AI-Powered Planning is Needed\nWhen You Must Buy Before You Sell', { x: 0.8, y: 3.8, w: 8, h: 1.2, fontSize: 18, color: ORANGE, fontFace: 'Arial' });
s1.addText('Context Setting for Non-Industry Audience', { x: 0.8, y: 5.5, w: 6, h: 0.5, fontSize: 12, color: 'AAAAAA', fontFace: 'Arial' });

// SLIDE 2 - Value Chain
let s2 = pptx.addSlide();
s2.addText('What Does a Mill Products Processor Do?', { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 24, bold: true, color: BLUE });
s2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.2, w: 12.5, h: 0.02, fill: { color: 'CCCCCC' } });
s2.addText('SUPPLIER\n(Steel Mill, Paper Mill,\nAluminum Smelter)\n\nLarge Raw Material\n• Coils (1000-2000mm)\n• Rolls (5-25 tons)\n• Sheets', { x: 0.5, y: 1.5, w: 3.5, h: 4, fontSize: 12, color: DARK, valign: 'top' });
s2.addText('→', { x: 4.0, y: 3.0, w: 0.5, h: 0.5, fontSize: 28, color: BLUE, align: 'center' });
s2.addText('PROCESSOR\n(Service Center,\nConverter, Slitter)\n\nOperations:\n• Slitting\n• Cut-to-Length\n• Sheeting\n• Die-cutting', { x: 4.5, y: 1.5, w: 3.5, h: 4, fontSize: 12, color: DARK, valign: 'top' });
s2.addText('→', { x: 8.0, y: 3.0, w: 0.5, h: 0.5, fontSize: 28, color: BLUE, align: 'center' });
s2.addText('CUSTOMER\n(Manufacturer,\nConstruction, Packaging)\n\nSmaller Pieces\n• Width: 200-1500mm\n• Weight: 0.5-8 tons\n• Exact specifications', { x: 8.5, y: 1.5, w: 3.5, h: 4, fontSize: 12, color: DARK, valign: 'top' });
s2.addText('The processor transforms large raw material into customer-specific products through cutting operations.', { x: 0.5, y: 5.8, w: 12, h: 0.5, fontSize: 11, italic: true, color: GRAY });

// SLIDE 3 - Lead Time Problem
let s3 = pptx.addSlide();
s3.addText('The Fundamental Timing Mismatch', { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 24, bold: true, color: BLUE });
s3.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.2, w: 12.5, h: 0.02, fill: { color: 'CCCCCC' } });
s3.addText('Supplier Lead Time: 4-12 weeks', { x: 1.0, y: 1.8, w: 5, h: 0.5, fontSize: 14, bold: true, color: ORANGE });
s3.addShape(pptx.ShapeType.rect, { x: 1.0, y: 2.4, w: 7, h: 0.3, fill: { color: ORANGE } });
s3.addText('Purchase\nDecision\n(FORECASTS)', { x: 0.5, y: 2.9, w: 2, h: 1.2, fontSize: 11, align: 'center', color: DARK });
s3.addText('Material\nArrives\n(in stock)', { x: 7.5, y: 2.9, w: 2, h: 1.2, fontSize: 11, align: 'center', color: DARK });
s3.addText('Order Horizon: 1-2 weeks', { x: 7.5, y: 4.3, w: 4, h: 0.5, fontSize: 14, bold: true, color: BLUE });
s3.addShape(pptx.ShapeType.rect, { x: 7.5, y: 4.8, w: 4, h: 0.3, fill: { color: BLUE } });
s3.addText('Customer Orders\nConfirmed', { x: 7.5, y: 5.2, w: 2.5, h: 1, fontSize: 11, align: 'center', color: DARK });
s3.addText('Must\nDeliver', { x: 11.0, y: 5.2, w: 1.5, h: 1, fontSize: 11, align: 'center', color: DARK });
s3.addText('KEY: You must BUY raw materials BEFORE you know what customers will order!', { x: 0.5, y: 6.5, w: 12, h: 0.5, fontSize: 13, bold: true, color: 'CC0000' });

// SLIDE 4 - Forecast-Based MRP
let s4 = pptx.addSlide();
s4.addText('How Procurement Works: Buying Against Forecasts', { x: 0.5, y: 0.3, w: 10, h: 0.7, fontSize: 24, bold: true, color: BLUE });
s4.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.2, w: 12.5, h: 0.02, fill: { color: 'CCCCCC' } });
s4.addText('DEMAND SOURCES', { x: 0.5, y: 1.5, w: 5, h: 0.5, fontSize: 14, bold: true, color: TEAL });
s4.addText('• Confirmed Orders (1-2 week view) — known, firm\n\n• Forecast Orders (4-12 week view) — predicted, uncertain\n\nMRP plans against BOTH', { x: 0.5, y: 2.2, w: 5.5, h: 3, fontSize: 12, color: DARK });
s4.addText('SUPPLY SOURCES', { x: 7, y: 1.5, w: 5, h: 0.5, fontSize: 14, bold: true, color: TEAL });
s4.addText('• Stock — available now in warehouse\n\n• In-Transit — shipped, arriving soon\n\n• Purchase Orders — ordered, at supplier', { x: 7, y: 2.2, w: 5.5, h: 3, fontSize: 12, color: DARK });
s4.addText('Forecasts are never 100% accurate → creates mismatch between what was purchased and what is actually ordered', { x: 0.5, y: 5.8, w: 12, h: 0.7, fontSize: 12, bold: true, color: 'CC0000' });

// SLIDE 5 - Matching Problem
let s5 = pptx.addSlide();
s5.addText('When Orders Arrive: The Matching Challenge', { x: 0.5, y: 0.3, w: 10, h: 0.7, fontSize: 24, bold: true, color: BLUE });
s5.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.2, w: 12.5, h: 0.02, fill: { color: 'CCCCCC' } });
s5.addText('CUSTOMER ORDER', { x: 0.5, y: 1.5, w: 4, h: 0.5, fontSize: 13, bold: true, color: TEAL });
s5.addText('AVAILABLE COIL', { x: 8.5, y: 1.5, w: 4, h: 0.5, fontSize: 13, bold: true, color: TEAL });
const params = ['Product Group: HDG', 'Quality: DX51D', 'Thickness: 0.50mm', 'Width: 1000mm', 'Surface: A', 'Coating: 275 g/m²', 'Roughness: Normal', 'Passivation: Yes'];
const coilParams = ['Product Group: HDG  ✓', 'Quality: DX51D  ✓', 'Thickness: 0.50mm  ✓', 'Width: 1500mm  ✓ (wider)', 'Surface: A  ✓', 'Coating: 275 g/m²  ✓', 'Roughness: Normal  ✓', 'Passivation: Yes  ✓'];
s5.addText(params.join('\n'), { x: 0.5, y: 2.1, w: 4, h: 3.5, fontSize: 11, color: DARK });
s5.addText('═══►\n═══►\n═══►\n═══►\n═══►\n═══►\n═══►\n═══►', { x: 4.8, y: 2.1, w: 1.5, h: 3.5, fontSize: 11, color: ORANGE, align: 'center' });
s5.addText(coilParams.join('\n'), { x: 7, y: 2.1, w: 5, h: 3.5, fontSize: 11, color: DARK });
s5.addText('ALL 5-13+ parameters must match! Raw materials are almost "order-specific"', { x: 0.5, y: 6.0, w: 12, h: 0.5, fontSize: 13, bold: true, color: 'CC0000' });

// SLIDE 6 - Assignment Dilemma
let s6 = pptx.addSlide();
s6.addText('The Assignment Dilemma: Multiple Orders, Limited Materials', { x: 0.5, y: 0.3, w: 11, h: 0.7, fontSize: 24, bold: true, color: BLUE });
s6.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.2, w: 12.5, h: 0.02, fill: { color: 'CCCCCC' } });
s6.addText('ORDERS', { x: 1, y: 1.6, w: 3, h: 0.5, fontSize: 14, bold: true, color: TEAL });
s6.addText('COILS / ROLLS', { x: 8.5, y: 1.6, w: 3, h: 0.5, fontSize: 14, bold: true, color: TEAL });
s6.addText('Order A (1000mm)\n\nOrder B (800mm)\n\nOrder C (600mm)\n  ↑ NO matching coil!\n  (CANNOT FULFILL)', { x: 0.8, y: 2.2, w: 3.5, h: 3.5, fontSize: 12, color: DARK });
s6.addText('Coil 1 (1500mm)\n\nCoil 2 (1250mm)\n\nCoil 3 (900mm)\n  ↑ NO matching orders!\n  (IDLE STOCK)', { x: 8.5, y: 2.2, w: 3.5, h: 3.5, fontSize: 12, color: DARK });
s6.addText('Multiple orders compete for same coil — who gets it?\nSome orders have no match → need to purchase\nSome coils have no match → idle capital', { x: 0.5, y: 5.8, w: 12, h: 1, fontSize: 12, bold: true, color: DARK });

// SLIDE 7 - Trim Loss
let s7 = pptx.addSlide();
s7.addText('Once Assigned: How Do You Cut with Minimum Waste?', { x: 0.5, y: 0.3, w: 11, h: 0.7, fontSize: 24, bold: true, color: BLUE });
s7.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.2, w: 12.5, h: 0.02, fill: { color: 'CCCCCC' } });
s7.addText('GOOD PATTERN (0% trim):', { x: 0.5, y: 1.6, w: 5, h: 0.5, fontSize: 13, bold: true, color: '008800' });
s7.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.2, w: 8, h: 1.2, line: { color: '008800', width: 2 } });
s7.addText('Order A (1000mm)', { x: 0.6, y: 2.3, w: 5.2, h: 1, fontSize: 12, color: DARK });
s7.addText('Order B (500mm)', { x: 5.9, y: 2.3, w: 2.5, h: 1, fontSize: 12, color: DARK });
s7.addText('BAD PATTERN (33% trim):', { x: 0.5, y: 3.8, w: 5, h: 0.5, fontSize: 13, bold: true, color: 'CC0000' });
s7.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.4, w: 8, h: 1.2, line: { color: 'CC0000', width: 2 } });
s7.addText('Order A (1000mm)', { x: 0.6, y: 4.5, w: 5.2, h: 1, fontSize: 12, color: DARK });
s7.addText('WASTE! (500mm)', { x: 5.9, y: 4.5,