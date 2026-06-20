/* ============================================================
   FinFlow 2.0 — personal.js
   Página Ingresos y Gastos (personal).
   ============================================================ */

/* ---------- Personal ---------- */
function renderPersonal(){
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openTxModal('personal')"><i class="ti ti-plus"></i> Registrar ingreso o gasto</button>`;
  const txs=activeTxs(state.transactions).filter(t=>t.module==='personal');

  if(txs.length===0){
    document.getElementById('page-body').innerHTML=`
      ${renderAccountBar()}
      ${moduleEmptyState({
        icon:'ti-wallet',
        title:'Registra tu primer ingreso o gasto',
        text:'Aquí verás tus ingresos y gastos personales. Empieza anotando algo simple, como tu sueldo o un gasto del día.',
        btn:'Registrar ingreso o gasto',
        onclick:"openTxModal('personal')"
      })}
    `;
    return;
  }

  const ym=getThisMonth();
  const tm=filterMonth(txs,ym);
  const inc=sum(tm,'income'),exp=sum(tm,'expense');
  document.getElementById('page-body').innerHTML=`
    ${renderAccountBar()}
    <div class="metrics">
      <div class="metric-card green"><div class="metric-label">Ingresos del mes</div><div class="metric-value green">${fmtShort(inc)}</div></div>
      <div class="metric-card red"><div class="metric-label">Gastos del mes</div><div class="metric-value red">${fmtShort(exp)}</div></div>
      <div class="metric-card ${inc-exp>=0?'green':'red'}"><div class="metric-label">Balance</div><div class="metric-value ${inc-exp>=0?'green':'red'}">${inc-exp>=0?'':'-'}${fmtShort(Math.abs(inc-exp))}</div></div>
      <div class="metric-card blue"><div class="metric-label">Movimientos</div><div class="metric-value blue">${tm.length}</div><div class="metric-sub">Este mes</div></div>
    </div>
    <div class="tabs">
      <button class="tab active" onclick="filterTx(this,'all','personal')">Todos</button>
      <button class="tab" onclick="filterTx(this,'income','personal')">Ingresos</button>
      <button class="tab" onclick="filterTx(this,'expense','personal')">Gastos</button>
    </div>
    <div class="tx-list" id="tx-personal">${[...txs].sort((a,b)=>b.date>a.date?1:-1).map(txRow).join('')}</div>
  `;
}
