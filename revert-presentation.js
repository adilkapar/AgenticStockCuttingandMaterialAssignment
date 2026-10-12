const fs = require('fs');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Stock Cutting and Material Assignment</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#0f1923;color:#fff;overflow:hidden;height:100vh}.slide{display:none;width:100vw;height:100vh;flex-direction:column;justify-content:center;align-items:center;padding:60px 80px;position:absolute;top:0;left:0}.slide.active{display:flex}.slide:nth-child(even){background:#1a2a3a}.slide:nth-child(odd){background:#0f1923}h1{font-size:3.2em;font-weight:700;margin-bottom:20px;text-align:center}h2{font-size:2.4em;font-weight:600;color:#1D80D3;margin-bottom:30px;text-align:center}h3{font-size:1.4em;color:#E89A20;margin-bottom:15px}p{font-size:1.2em;line-height:1.6;max-width:900px;text-align:center;color:#ccc}.highlight{color:#E89A20;font-weight:700}.blue{color:#1D80D3}.red{color:#ff4444}.green{color:#44cc44}.nav{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);display:flex;gap:15px;z-index:100}.nav button{background:#1D80D3;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:1em;cursor:pointer}.nav button:hover{background:#E89A20}.nav button:disabled{background:#333;color:#666}.slide-counter{position:fixed;bottom:35px;right:40px;color:#666;font-size:0.9em;z-index:100}.progress-bar{position:fixed;top:0;left:0;height:4px;background:#1D80D3;transition:width 0.3s;z-index:100}.flow{display:flex;align-items:center;justify-content:center;gap:20px;margin:40px 0;flex-wrap:wrap}.flow-box{background:#1D80D3;padding:25px 30px;border-radius:12px;text-align:center;min-width:180px}.flow-box.orange{background:#E89A20}.flow-box.dark{background:#2a3a4a;border:2px solid #1D80D3}.flow-box.red{background:#cc3333}.flow-box.green{background:#228B22}.flow-arrow{font-size:2em;color:#666}.objectives{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;max-width:1000px;margin:30px auto}.obj-card{background:#2a3a4a;padding:25px;border-radius:12px;width:180px;text-align:center;border-top:4px solid #1D80D3}.obj-card .num{font-size:2em;font-weight:800;color:#1D80D3}.obj-card .label{font-size:0.9em;color:#aaa;margin-top:8px}.network{display:flex;justify-content:center;gap:80px;align-items:flex-start;margin:40px auto}.network-col{display:flex;flex-direction:column;gap:15px}.network-node{padding:12px 20px;border-radius:8px;font-weight:600;text-align:center}.network-node.order{background:#1D80D3}.network-node.coil{background:#0A7B83}.network-node.orphan{background:#cc3333;opacity:0.7}.coil-visual{max-width:700px;margin:30px auto}.coil-bar{height:60px;border-radius:8px;display:flex;overflow:hidden;margin:15px 0}.strip{display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.9em}.strip.a{background:#1D80D3}.strip.b{background:#0A7B83}.strip.waste{background:#cc3333}.kpi-row{display:flex;gap:30px;justify-content:center;margin:40px auto;flex-wrap:wrap}.kpi{text-align:center}.kpi .value{font-size:3em;font-weight:800;color:#E89A20}.kpi .unit{font-size:1em;color:#888}
</style>
</head>
<body>
<div class="progress-bar" id="progress"></div>
<div class="slide-counter" id="counter"></div>
<div id="slides">

<section class="slide active" style="background:linear-gradient(135deg,#0F3B5F,#162a3e)">
<h1>The <span class="highlight">Material Assignment</span> &amp;<br><span class="blue">Stock Cutting</span> Challenge</h1>
<p style="font-size:1.4em;margin-top:20px">Why you must <span class="highlight">buy before you sell</span> — and why that creates one of the hardest optimization problems in manufacturing.</p>
</section>

<section class="slide">
<h2>What is a Coil?</h2>
<div style="display:flex;align-items:center;justify-content:center;gap:60px;margin:20px 0">
<svg width="320" height="240" viewBox="0 0 320 240"><ellipse cx="100" cy="120" rx="35" ry="80" fill="#666" stroke="#888" stroke-width="2"/><rect x="100" y="40" width="140" height="160" fill="#777"/><ellipse cx="240" cy="120" rx="35" ry="80" fill="#888" stroke="#999" stroke-width="2"/><ellipse cx="240" cy="120" rx="12" ry="28" fill="#0f1923"/><text x="240" y="25" fill="#E89A20" font-size="11" text-anchor="middle">Outer Diameter</text><text x="240" y="230" fill="#1D80D3" font-size="11" text-anchor="middle">Inner Diameter</text><text x="50" y="230" fill="#ccc" font-size="11" text-anchor="middle">Width</text><text x="30" y="175" fill="#44cc44" font-size="10">Thickness</text></svg>
<div style="text-align:left"><p style="text-align:left;font-size:1.1em;color:#ccc">A <span class="highlight">coil</span> (or roll) is the raw material unit:<br><br><span class="blue">Physical:</span> Width, Thickness, Weight, Diameters<br><br><span class="blue">Chemical:</span> Quality grade, Coating, Surface<br><br><span class="blue">Process:</span> Product group, Passivation, Oil<br><br><span class="blue">Origin:</span> Supplier, Batch<br><br><strong style="color:#E89A20">= 13 parameters that define each coil</strong></p></div>
</div>
</section>

<section class="slide">
<h2>The Value Chain</h2>
<div class="flow"><div class="flow-box orange"><strong>SUPPLIER</strong><br><small>Steel / Paper / Aluminum Mill</small><br><br>Large Coils &amp; Rolls<br>1000-2000mm wide</div><div class="flow-arrow">&rarr;</div><div class="flow-box"><strong>PROCESSOR</strong><br><small>Service Center / Converter</small><br><br>Cut to Order<br>Slitting - CTL - Sheeting</div><div class="flow-arrow">&rarr;</div><div class="flow-box dark"><strong>CUSTOMER</strong><br><small>Manufacturer / Construction</small><br><br>Exact Pieces<br>200-1500mm, exact specs</div></div>
<p>The processor <span class="highlight">transforms</span> large raw material into <span class="blue">customer-specific</span> products.</p>
</section>

<section class="slide">
<h2>The Timing Mismatch</h2>
<div style="max-width:900px;margin:40px auto"><div style="height:8px;background:linear-gradient(to right,#E89A20 0%,#E89A20 65%,#1D80D3 65%,#1D80D3 100%);border-radius:4px;margin:30px 0"></div><div style="display:flex;justify-content:space-between"><div style="text-align:center"><strong style="color:#E89A20">Purchase</strong><br><small>FORECASTS</small></div><div style="text-align:center"><strong style="color:#E89A20">4-12 weeks</strong><br><small>Lead time</small></div><div style="text-align:center"><strong style="color:#1D80D3">Arrives</strong><br><small>In stock</small></div><div style="text-align:center"><strong style="color:#1D80D3">1-2 weeks</strong><br><small>Order horizon</small></div><div style="text-align:center"><strong>Orders</strong><br><small>Must deliver!</small></div></div></div>
<p style="font-size:1.5em;margin-top:40px"><span class="red">Warning:</span> You must <span class="highlight">BUY</span> before you know what customers will <span class="blue">ORDER</span></p>
</section>

<section class="slide">
<h2>Multi-Parameter Matching by Industry</h2>
<p>Each order specifies parameters that must match available stock. <span class="highlight">ALL must match simultaneously.</span></p>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;max-width:1100px;margin:20px auto"><div style="background:#1a3050;padding:20px;border-radius:12px;border-top:4px solid #1D80D3"><h3 style="color:#1D80D3;margin-bottom:10px">Steel (13 params)</h3><p style="text-align:left;font-size:0.95em;color:#bbb;line-height:1.7">Product Group<br>Quality Grade<br>Thickness - Width<br>Surface Group<br>Coating Amount<br>Roughness<br>Passivation<br>Protective Oil<br>Outer/Inner Diameter<br>Origin/Supplier<br>Due Date</p></div><div style="background:#1a3a2a;padding:20px;border-radius:12px;border-top:4px solid #44cc44"><h3 style="color:#44cc44;margin-bottom:10px">Paper (8+ params)</h3><p style="text-align:left;font-size:0.95em;color:#bbb;line-height:1.7">Grade<br>Basis Weight (gsm)<br>Caliper (thickness)<br>Brightness<br>Moisture Content<br>Formation<br>Surface Treatment<br>Reel Width<br>Core Diameter<br>Due Date</p></div><div style="background:#2a2a3a;padding:20px;border-radius:12px;border-top:4px solid #E89A20"><h3 style="color:#E89A20;margin-bottom:10px">Aluminum (10+ params)</h3><p style="text-align:left;font-size:0.95em;color:#bbb;line-height:1.7">Alloy (1xxx-7xxx)<br>Temper (O, H, T)<br>Thickness - Width<br>Surface Finish<br>Coating Type<br>Tensile Strength<br>Elongation<br>Flatness Tolerance<br>Origin/Mill<br>Due Date</p></div></div>
<p style="margin-top:15px">Materials are almost <span class="highlight">"order-specific"</span> — very few match each order.</p>
</section>

<section class="slide">
<h2>The Assignment Dilemma</h2>
<div class="network"><div class="network-col"><h3>Orders</h3><div class="network-node order">Order A (1000mm)</div><div class="network-node order">Order B (800mm)</div><div class="network-node order">Order C (750mm)</div><div class="network-node orphan">Order D - No match</div></div><div style="color:#555;font-size:1.2em;padding-top:40px">--<br>--<br>--</div><div class="network-col"><h3>Coils</h3><div class="network-node coil">Coil 1 (1500mm)</div><div class="network-node coil">Coil 2 (1250mm)</div><div class="network-node orphan">Coil 3 - Idle</div></div></div>
<p>Multiple orders compete - Some cannot be fulfilled - Some stock sits idle</p>
</section>

<section class="slide">
<h2>Cutting: Trim Loss</h2>
<div class="coil-visual"><h3 class="green">Good: 0% waste</h3><div class="coil-bar"><div class="strip a" style="width:66.7%">Order A (1000mm)</div><div class="strip b" style="width:33.3%">Order B (500mm)</div></div><h3 class="red" style="margin-top:25px">Bad: 33% waste</h3><div class="coil-bar"><div class="strip a" style="width:66.7%">Order A (1000mm)</div><div class="strip waste" style="width:33.3%">WASTE</div></div></div>
<p style="margin-top:20px">The <span class="highlight">right combination</span> = 0% waste. The <span class="red">wrong assignment</span> = 10-30% thrown away.<br><strong>Assignment and cutting must be solved TOGETHER.</strong></p>
</section>

<section class="slide">
<h2>Five Conflicting Goals</h2>
<div class="objectives"><div class="obj-card"><div class="num">1</div><div class="label">Minimize<br><strong>Trim Loss</strong></div></div><div class="obj-card"><div class="num">2</div><div class="label">Minimize<br><strong>Tardy Orders</strong></div></div><div class="obj-card"><div class="num">3</div><div class="label">Minimize<br><strong>Excess Scrap</strong></div></div><div class="obj-card"><div class="num">4</div><div class="label">Maximize<br><strong>Orders Planned</strong></div></div><div class="obj-card"><div class="num">5</div><div class="label">Minimize<br><strong>Idle Stock</strong></div></div></div>
<p>These goals <span class="red">conflict</span>. Optimizing one hurts another. No human can find the optimal balance.</p>
</section>

<section class="slide">
<h2>Plans Break Every Day</h2>
<div class="flow"><div class="flow-box green"><strong>Plan</strong><br>Optimized</div><div class="flow-arrow">&rarr;</div><div class="flow-box red"><strong>