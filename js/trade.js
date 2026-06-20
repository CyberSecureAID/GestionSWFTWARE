/* ============================================================
   FinFlow 2.0 — trade.js
   Página Capital / Trading.
   ============================================================ */

/* ---------- Trade ---------- */
function renderTrade(){
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openTxModal('trade')"><i class="ti ti-plus"></i> Registrar operación</button>`;
  const txs=activeTxs(state.transactions).filter(t=>t.module==='trade');

  if(txs.length===0){
    document.getElementById('page-body').innerHTML=`
      ${renderAccountBar()}
      ${moduleEmptyState({
        icon:'ti-trending-up',
        title:'Registra tu primera operación',
        text:'Aquí verás tus ganancias, pérdidas y capital de trading. Empieza registrando un depósito o tu primera operación.',
        btn:'Registrar operación',
        onclick:"openTxModal('trade')"
      })}
    `;
    return;
  }

  const ym=getThisMonth();
  const tm=filterMonth(txs,ym);
  const gain=sum(tm,'income'),loss=sum(tm,'expense');
  const totalCap=txs.filter(t=>t.category==='Depósito').reduce((a,t)=>a+Number(t.amount||0),0)
               -txs.filter(t=>t.category==='Retiro').reduce((a,t)=>a+Number(t.amount||0),0);
  document.getElementById('page-body').innerHTML=`
    ${renderAccountBar()}
    <div class="metrics">
      <div class="metric-card green"><div class="metric-label">Ganancias del mes</div><div class="metric-value green">${fmtShort(gain)}</div></div>
      <div class="metric-card red"><div class="metric-label">Pérdidas del mes</div><div class="metric-value red">${fmtShort(loss)}</div></div>
      <div class="metric-card ${gain-loss>=0?'green':'red'}"><div class="metric-label help-row">P&amp;L del mes ${helpBtn('concept_pnl')}</div><div class="metric-value ${gain-loss>=0?'green':'red'}">${gain-loss>=0?'+':'-'}${fmtShort(Math.abs(gain-loss))}</div></div>
      <div class="metric-card amber"><div class="metric-label help-row">Capital neto ${helpBtn('concept_capital')}</div><div class="metric-value amber">${fmtShort(totalCap)}</div><div class="metric-sub">Depósitos − Retiros</div></div>
    </div>
    <div class="tx-list">${[...txs].sort((a,b)=>b.date>a.date?1:-1).map(txRow).join('')}</div>
  `;
}
