// ═══════════════════════════════════════════════════
// OPTIMIZER — Feasibility + Bin-Packing Solver
// ═══════════════════════════════════════════════════
function isFeasible(order, coil) {
  return order.pg === coil.pg && order.q === coil.q && order.t === coil.t &&
    order.coat === coil.coat && order.surf === coil.surf && coil.w >= order.w + 10;
}

function findFeasibleCoils(order) {
  return COILS.filter(c => c.status === 'stock' && isFeasible(order, c));
}

function solveCuttingPattern(coil, orders) {
  // Greedy first-fit-decreasing bin packing for slitting
  const sorted = [...orders].sort((a, b) => b.w - a.w);
  const available = coil.w - 10; // 5mm trim each side
  const strips = [];
  let used = 0;
  for (const o of sorted) {
    if (used + o.w + 3 <= available) { // 3mm knife width
      strips.push({ orderId: o.id, width: o.w, tons: o.tons });
      used += o.w + 3;
    }
  }
  if (strips.length > 0) used -= 3; // no knife after last strip
  const trim = coil.w - used - 10;
  const trimPct = ((trim + 10) / coil.w * 100).toFixed(1);
  return { coilId: coil.id, coilWidth: coil.w, strips, trim: trim + 10, trimPct: parseFloat(trimPct), used };
}

function runFullPlan() {
  const groups = {};
  ORDERS.forEach(o => {
    const key = `${o.pg}_${o.q}_${o.t}_${o.coat}_${o.surf}`;
    if (!groups[key]) groups[key] = { orders: [], coils: [] };
    groups[key].orders.push(o);
  });
  COILS.filter(c => c.status === 'stock').forEach(c => {
    const key = `${c.pg}_${c.q}_${c.t}_${c.coat}_${c.surf}`;
    if (groups[key]) groups[key].coils.push(c);
  });

  const assignments = [];
  const planned = new Set();
  let totalTrim = 0, totalUsed = 0, totalWidth = 0;

  Object.values(groups).forEach(g => {
    // Sort coils by age descending (use oldest first)
    const sortedCoils = [...g.coils].sort((a, b) => b.age - a.age);
    const remainingOrders = [...g.orders];

    for (const coil of sortedCoils) {
      if (remainingOrders.length === 0) break;
      const feasible = remainingOrders.filter(o => coil.w >= o.w + 10);
      if (feasible.length === 0) continue;
      const pattern = solveCuttingPattern(coil, feasible);
      if (pattern.strips.length > 0) {
        assignments.push(pattern);
        totalTrim += pattern.trim;
        totalUsed += pattern.used;
        totalWidth += coil.w;
        pattern.strips.forEach(s => {
          planned.add(s.orderId);
          const idx = remainingOrders.findIndex(o => o.id === s.orderId);
          if (idx >= 0) remainingOrders.splice(idx, 1);
        });
      }
    }
  });

  const avgTrim = totalWidth > 0 ? (totalTrim / totalWidth * 100).toFixed(1) : 0;
  const plannedCount = planned.size;
  const unplanned = ORDERS.filter(o => !planned.has(o.id));
  const tardy = ORDERS.filter(o => planned.has(o.id) && o.due < '2025-02-17').length;

  return { assignments, plannedCount, unplanned, avgTrim, tardy, totalOrders: ORDERS.length };
}

// ═══════════════════════════════════════════════════
// VISUALIZATION HELPERS
// ═══════════════════════════════════════════════════
function renderKPIs(result) {
  const trimClass = result.avgTrim < 4 ? 'g' : result.avgTrim < 8 ? 'w' : 'r';
  const planClass = result.plannedCount / result.totalOrders > 0.85 ? 'g' : 'w';
  const tardyClass = result.tardy === 0 ? 'g' : result.tardy < 3 ? 'w' : 'r';
  return `<div class="kpis">
    <div class="kpi ${trimClass}"><div class="v">${result.avgTrim}%</div><div class="l">Avg Trim Loss</div></div>
    <div class="kpi ${planClass}"><div class="v">${result.plannedCount}/${result.totalOrders}</div><div class="l">Orders Planned</div></div>
    <div class="kpi ${tardyClass}"><div class="v">${result.tardy}</div><div class="l">Tardy Orders</div></div>
    <div class="kpi"><div class="v">${result.assignments.length}</div><div class="l">Coils Used</div></div>
    <div class="kpi"><div class="v">${result.unplanned.length}</div><div class="l">Unplanned</div></div>
  </div>`;
}

function renderPattern(pat, idx) {
  const trimClass = pat.trimPct < 4 ? 'g' : pat.trimPct < 8 ? 'o' : 'r';
  let bars = '';
  pat.strips.forEach((s, i) => {
    const pct = (s.width / pat.coilWidth * 100).toFixed(1);
    bars += `<div class="s" style="width:${pct}%;background:${COLORS[i % COLORS.length]}">${s.orderId}<br>${s.width}mm</div>`;
  });
  const trimPct = (pat.trim / pat.coilWidth * 100).toFixed(1);
  if (pat.trim > 0) {
    bars += `<div class="s trim" style="width:${trimPct}%">trim<br>${pat.trim}mm</div>`;
  }
  return `<div class="cpat">
    <div class="lbl"><span>${pat.coilId} (${pat.coilWidth}mm)</span><span class="tbadge ${trimClass}">${pat.trimPct}% trim</span></div>
    <div class="cbar">${bars}</div>
    <div class="cmeta"><span>Strips: ${pat.strips.length}</span><span>Orders: ${pat.strips.map(s=>s.orderId).join(', ')}</span></div>
  </div>`;
}

function renderOrderTable(result) {
  let rows = '';
  ORDERS.forEach(o => {
    const isPlanned = !result.unplanned.find(u => u.id === o.id);
    const dotClass = isPlanned ? 'p' : 'u';
    const status = isPlanned ? 'Planned' : 'Unplanned';
    rows += `<tr><td><span class="dot-s ${dotClass}"></span>${o.id}</td><td>${o.pg} ${o.q} ${o.t}mm</td><td>${o.w}mm</td><td>${o.tons}t</td><td>${o.due}</td><td>${o.type}</td><td>${status}</td></tr>`;
  });
  return `<table class="tbl"><thead><tr><th>Order</th><th>Spec</th><th>Width</th><th>Tons</th><th>Due</th><th>Type</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// ═══════════════════════════════════════════════════
// CHAT & ORCHESTRATION
// ═══════════════════════════════════════════════════
function addMsg(text, type) {
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.innerHTML = text;
  document.getElementById('msgs').appendChild(div);
  document.getElementById('msgs').scrollTop = 99999;
}

function showResults(html) {
  document.getElementById('res').innerHTML = html;
}

function submit() {
  const inp = document.getElementById('inp');
  if (!inp.value.trim()) return;
  run(inp.value.trim());
  inp.value = '';
}

function run(query) {
  addMsg(query, 'user');

  // Simulate thinking delay
  setTimeout(() => {
    if (query.toLowerCase().includes('plan all')) {
      handlePlanAll();
    } else if (query.toLowerCase().includes('idle coil')) {
      handleIdleCoils();
    } else if (query.toLowerCase().match(/ord-\d+/i)) {
      const match = query.match(/ord-\d+/i);
      handleOrderCheck(match[0].toUpperCase());
    } else if (query.toLowerCase().match(/coil-\d+/i)) {
      const match = query.match(/coil-\d+/i);
      handleCoilUse(match[0].toUpperCase());
    } else if (query.toLowerCase().includes('balance') || query.toLowerCase().includes('supply')) {
      handleBalance();
    } else {
      addMsg(`<span class="think">💭 Analyzing your query...</span>I understand you want to know about: "${query}"<br><br>Try one of these:<br>• "Plan all open orders"<br>• "Can ORD-007 be fulfilled?"<br>• "Best use of COIL-012?"<br>• "Show idle coils over 30 days"<br>• "Supply-demand balance for HDG DX51D 0.5mm"`, 'bot');
    }
  }, 300);
}

function handlePlanAll() {
  addMsg(`<span class="think">💭 THOUGHT: User wants full planning run. Let me gather demand + supply, build feasibility network, then optimize...</span>
<span class="think">⚡ ACTION 1: PlanningDataService.get_order_pool() → ${ORDERS.length} orders</span>
<span class="think">⚡ ACTION 2: PlanningDataService.get_available_coils() → ${COILS.filter(c=>c.status==='stock').length} coils in stock</span>
<span class="think">⚡ ACTION 3: MCP.build_feasibility_network() → building groups...</span>
<span class="think">⚡ ACTION 4: MCP.optimize_assignment() → solving...</span>
<span class="think">⚡ ACTION 5: MCP.solve_cutting_pattern() → generating patterns...</span>`, 'bot');

  setTimeout(() => {
    const result = runFullPlan();
    addMsg(`📋 <b>Planning Complete!</b><br><br>✅ ${result.plannedCount}/${result.totalOrders} orders planned (${(result.plannedCount/result.totalOrders*100).toFixed(0)}%)<br>📉 ${result.avgTrim}% average trim loss<br>⏰ ${result.tardy} tardy orders<br>📦 ${result.assignments.length} coils assigned<br>⚠️ ${result.unplanned.length} unplanned orders<br><br>See detailed results on the right panel →`, 'bot');

    const patternsHtml = result.assignments.slice(0, 8).map((p, i) => renderPattern(p, i)).join('');
    showResults(`
      <div class="card"><div class="card-h">📊 KPI Summary</div><div class="card-b">${renderKPIs(result)}</div></div>
      <div class="card"><div class="card-h">🔪 Cutting Patterns (Top 8 of ${result.assignments.length})<span style="font-size:10px;color:#888">Showing best patterns</span></div><div class="card-b"><div class="cut-viz">${patternsHtml}</div></div></div>
      <div class="card"><div class="card-h">📋 Order Status</div><div class="card-b">${renderOrderTable(result)}</div></div>
    `);
  }, 800);
}

function handleIdleCoils() {
  const idle = COILS.filter(c => c.status === 'stock' && c.age > 30);
  addMsg(`<span class="think">💭 THOUGHT: User wants idle coils > 30 days. Let me check stock ages...</span>
<span class="think">⚡ ACTION: PlanningDataService.get_idle_coils(threshold_days=30)</span>`, 'bot');

  setTimeout(() => {
    let info = idle.map(c => {
      const feasible = ORDERS.filter(o => isFeasible(o, c));
      return `• <b>${c.id}</b> (${c.pg} ${c.q} ${c.t}mm, ${c.w}mm, ${c.tons}t) — ${c.age} days idle — ${feasible.length} feasible orders`;
    }).join('<br>');
    addMsg(`📦 Found <b>${idle.length} idle coils</b> (>30 days in stock):<br><br>${info}<br><br>Total idle weight: <b>${idle.reduce((s,c)=>s+c.tons,0)}t</b>`, 'bot');

    let rows = idle.map(c => {
      const feasible = ORDERS.filter(o => isFeasible(o, c));
      return `<tr><td>${c.id}</td><td>${c.pg} ${c.q} ${c.t}mm</td><td>${c.w}mm</td><td>${c.tons}t</td><td><b>${c.age} days</b></td><td>${feasible.length > 0 ? '✅ ' + feasible.length + ' orders' : '❌ None'}</td></tr>`;
    }).join('');
    showResults(`<div class="card"><div class="card-h">📦 Idle Coils (>${30} days)</div><div class="card-b"><table class="tbl"><thead><tr><th>Coil</th><th>Spec</th><th>Width</th><th>Weight</th><th>Age</th><th>Feasible Orders</th></tr></thead><tbody>${rows}</tbody></table></div></div>`);
  }, 500);
}

function handleOrderCheck(orderId) {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) { addMsg(`❌ Order ${orderId} not found in the system.`, 'bot'); return; }

  addMsg(`<span class="think">💭 THOUGHT: User wants to check feasibility for ${orderId}. Let me find matching coils...</span>
<span class="think">⚡ ACTION: PlanningDataService.get_feasible_coils_for_order("${orderId}")</span>`, 'bot');

  setTimeout(() => {
    const feasible = findFeasibleCoils(order);
    if (feasible.length === 0) {
      addMsg(`❌ <b>${orderId}</b> (${order.pg} ${order.q} ${order.t}mm, ${order.w}mm, ${order.tons}t) cannot be fulfilled.<br><br>No coil in stock matches all 13 parameters. Recommendation: <b>Purchase new coil</b>.`, 'bot');
      showResults(`<div class="card"><div class="card-h">❌ ${orderId} — No Feasible Coil</div><div class="card-b"><p>Order spec: ${order.pg} ${order.q} ${order.t}mm, width ${order.w}mm, coating ${order.coat}g/m², surface ${order.surf}</p><p style="margin-top:10px;color:var(--red)">No available coil matches. Consider purchasing a ${order.pg} ${order.q} ${order.t}mm coil with min width ${order.w + 50}mm.</p></div></div>`);
    } else {
      // Show cutting options
      const patterns = feasible.slice(0, 3).map(c => solveCuttingPattern(c, [order]));
      const best = patterns.sort((a, b) => a.trimPct - b.trimPct)[0];
      let optionsText = feasible.slice(0, 3).map((c, i) => {
        const p = patterns[i];
        return `• <b>${c.id}</b> (${c.w}mm, ${c.tons}t) — trim: ${p.trimPct}%`;
      }).join('<br>');
      addMsg(`✅ <b>${orderId}</b> can be fulfilled! ${feasible.length} coils match.<br><br>Top options:<br>${optionsText}<br><br>🏆 Best: <b>${best.coilId}</b> with ${best.trimPct}% trim loss.`, 'bot');

      const vizHtml = patterns.slice(0, 3).map((p, i) => renderPattern(p, i)).join('');
      showResults(`<div class="card"><div class="card-h">🔍 Feasibility: ${orderId} (${order.pg} ${order.q} ${order.t}mm, ${order.w}mm)</div><div class="card-b"><div class="cut-viz">${vizHtml}</div></div></div>`);
    }
  }, 500);
}

function handleCoilUse(coilId) {
  const coil = COILS.find(c => c.id === coilId);
  if (!coil) { addMsg(`❌ Coil ${coilId} not found.`, 'bot'); return; }

  addMsg(`<span class="think">💭 THOUGHT: User wants best use for ${coilId}. Let me find all feasible orders and optimize cutting...</span>
<span class="think">⚡ ACTION: PlanningDataService.get_feasible_orders_for_coil("${coilId}")</span>`, 'bot');

  setTimeout(() => {
    const feasible = ORDERS.filter(o => isFeasible(o, coil));
    if (feasible.length === 0) {
      addMsg(`⚠️ <b>${coilId}</b> (${coil.pg} ${coil.q} ${coil.t}mm, ${coil.w}mm) has no feasible orders currently.`, 'bot');
      return;
    }
    const pattern = solveCuttingPattern(coil, feasible);
    addMsg(`🎯 <b>Best use of ${coilId}</b> (${coil.w}mm, ${coil.tons}t, ${coil.pg} ${coil.q} ${coil.t}mm):<br><br>${feasible.length} feasible orders found. Optimal cut:<br>• Strips: ${pattern.strips.map(s => s.orderId + ' (' + s.width + 'mm)').join(', ')}<br>• Trim loss: <b>${pattern.trimPct}%</b> (${pattern.trim}mm)<br>• Orders served: <b>${pattern.strips.length}</b>`, 'bot');

    showResults(`<div class="card"><div class="card-h">🎯 Best Use: ${coilId} (${coil.w}mm, ${coil.tons}t)</div><div class="card-b"><div class="cut-viz">${renderPattern(pattern, 0)}</div><p style="margin-top:12px;font-size:11px;color:#666">Feasible orders: ${feasible.map(o => o.id).join(', ')}</p></div></div>`);
  }, 500);
}

function handleBalance() {
  addMsg(`<span class="think">💭 THOUGHT: User wants supply-demand balance. Let me aggregate by spec group...</span>
<span class="think">⚡ ACTION: PlanningDataService.get_supply_demand_balance()</span>`, 'bot');

  setTimeout(() => {
    const specs = {};
    ORDERS.forEach(o => {
      const k = `${o.pg} ${o.q} ${o.t}mm`;
      if (!specs[k]) specs[k] = { demand: 0, supply: 0, orders: 0, coils: 0 };
      specs[k].demand += o.tons;
      specs[k].orders++;
    });
    COILS.filter(c => c.status === 'stock').forEach(c => {
      const k = `${c.pg} ${c.q} ${c.t}mm`;
      if (!specs[k]) specs[k] = { demand: 0, supply: 0, orders: 0, coils: 0 };
      specs[k].supply += c.tons;
      specs[k].coils++;
    });

    let summary = Object.entries(specs).map(([k, v]) => {
      const ratio = v.supply / (v.demand || 1);
      const status = ratio > 1.5 ? '🟢 Oversupplied' : ratio > 0.8 ? '🟡 Balanced' : '🔴 Shortage';
      return `• <b>${k}</b>: Supply ${v.supply.toFixed(0)}t / Demand ${v.demand.toFixed(0)}t — ${status}`;
    }).join('<br>');
    addMsg(`📊 <b>Supply-Demand Balance:</b><br><br>${summary}`, 'bot');

    let rows = Object.entries(specs).map(([k, v]) => {
      const ratio = (v.supply / (v.demand || 1)).toFixed(2);
      const cls = ratio > 1.5 ? 'p' : ratio > 0.8 ? 'w' : 'u';
      return `<tr><td>${k}</td><td>${v.orders}</td><td>${v.demand.toFixed(1)}t</td><td>${v.coils}</td><td>${v.supply.toFixed(1)}t</td><td><span class="dot-s ${cls}"></span>${ratio}x</td></tr>`;
    }).join('');
    showResults(`<div class="card"><div class="card-h">📊 Supply-Demand Balance by Spec</div><div class="card-b"><table class="tbl"><thead><tr><th>Specification</th><th>Orders</th><th>Demand</th><th>Coils</th><th>Supply</th><th>Ratio</th></tr></thead><tbody>${rows}</tbody></table></div></div>`);
  }, 500);
}
