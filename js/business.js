/* ============================================================
   FinFlow 2.0 — business.js
   Página Ventas y Gastos del Negocio.
   ============================================================ */

/* ---------- Negocio: Ventas y Gastos ---------- */
function renderBusiness(){
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openTxModal('business')"><i class="ti ti-plus"></i> Registrar movimiento</button>`;
  const ym=getThisMonth();
  const txs=activeTxs(state.transactions).filter(t=>t.module==='business');
  const tm=filterMonth(txs,ym);
  const inc=sum(tm,'income'),exp=sum(tm,'expense');
  document.getElementById('page-body').innerHTML=`
    ${renderAccountBar()}
    <div class="metrics">
      <div class="metric-card green"><div class="metric-label">Ventas del mes</div><div class="metric-value green">${fmtShort(inc)}</div></div>
      <div class="metric-card red"><div class="metric-label">Gastos del mes</div><div class="metric-value red">${fmtShort(exp)}</div></div>
      <div class="metric-card ${inc-exp>=0?'green':'red'}"><div class="metric-label">Utilidad</div><div class="metric-value ${inc-exp>=0?'green':'red'}">${inc-exp>=0?'':'-'}${fmtShort(Math.abs(inc-exp))}</div></div>
      <div class="metric-card blue"><div class="metric-label">Operaciones</div><div class="metric-value blue">${txs.length}</div></div>
    </div>
    <div class="tabs">
      <button class="tab active" onclick="filterTx(this,'all','business')">Todos</button>
      <button class="tab" onclick="filterTx(this,'income','business')">Ventas</button>
      <button class="tab" onclick="filterTx(this,'expense','business')">Gastos</button>
    </div>
    <div class="tx-list" id="tx-business">${txs.length?[...txs].sort((a,b)=>b.date>a.date?1:-1).map(txRow).join(''):'<div class="empty"><i class="ti ti-building-store"></i><p>Sin operaciones registradas.</p></div>'}</div>
  `;
}
