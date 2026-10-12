#!/usr/bin/env node
/**
 * Builds the interactive demo into a single index.html file.
 * 
 * Usage:
 *   node demo/build-demo.js
 *   open demo/index.html
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const css = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');
const data = fs.readFileSync(path.join(srcDir, 'data.js'), 'utf8');
const app = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agentic Stock Cutting — Interactive Demo</title>
<style>
${css}
</style>
</head>
<body>
<div class="app">
<header class="hdr">
<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0070f2"/><text x="5" y="17" font-size="13" fill="#fff" font-weight="bold">J</text></svg>
<h1>Agentic Stock Cutting &amp; Material Assignment</h1>
<span class="badge">DEMO</span>
<span class="sub">Joule + Planning Data Service + MCP Optimizer (OR-Tools)</span>
</header>
<div class="chat">
<div class="chat-hd"><span class="dot"></span>Joule — Planning Assistant</div>
<div class="qa">
<button onclick="run('Plan all open orders')">📋 Plan All</button>
<button onclick="run('Show idle coils over 30 days')">📦 Idle Coils</button>
<button onclick="run('Can ORD-007 be fulfilled?')">🔍 ORD-007</button>
<button onclick="run('Best use of COIL-012?')">🎯 COIL-012</button>
<button onclick="run('Supply-demand balance for HDG DX51D 0.5mm')">📊 S/D Balance</button>
</div>
<div class="msgs" id="msgs">
<div class="msg bot">👋 Hello! I'm your <b>Joule planning assistant</b>.<br><br>I can help with:<br>• <b>Plan all open orders</b> — full optimization run<br>• <b>Check specific orders</b> — feasibility analysis<br>• <b>Analyze coils</b> — best utilization<br>• <b>What-if scenarios</b> — compare alternatives<br><br>Try the quick actions above or type a query below!</div>
</div>
<div class="inp-area">
<input id="inp" placeholder="Ask about orders, coils, planning..." onkeypress="if(event.key==='Enter')submit()">
<button onclick="submit()">Send</button>
</div>
</div>
<div class="results" id="res">
<div class="welcome">
<h2>🏭 Steel Service Center — Planning Demo</h2>
<p>This interactive mockup simulates the complete agentic planning system with <b>25 orders</b> and <b>35 mother coils</b>.<br><br>Click a query on the left to see the optimization in action with visual cutting patterns and KPI results.</p>
<p style="margin-top:16px;font-size:11px;color:#aaa">Architecture: Joule (LLM Agent) → Planning Data Service (SAP CAP) → MCP Server (OR-Tools Optimizer)</p>
</div>
</div>
</div>
<script>
${data}
${app}
</script>
</body>
</html>`;

const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html);
console.log(`✅ Demo built successfully!`);
console.log(`   Output: ${outPath}`);
console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);
console.log(`\n   Open in browser: open demo/index.html`);