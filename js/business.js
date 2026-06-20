/* ============================================================
   FinFlow 2.0 — business.js
   Página Ventas y Gastos (Negocio o Restaurante, según el perfil elegido).
   ============================================================ */

/* ---------- Negocio: Ventas y Gastos ---------- */
function renderBusiness(){
  const prof=currentProfile();
  const isRestaurant=state.profile==='restaurant';
  const btnLabel=isRestaurant?'Registrar venta del día':'Registrar venta o gasto';
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openTxModal('business')"><i class="ti ti-plus"></i> ${btnLabel}</button>`;
  const txs=activeTxs(state.transactions).filter(t=>t.module==='business');

  if(txs.length===0){
    document.getElementById('page-body').innerHTML=`
      ${renderAccountBar()}
      ${moduleEmptyState({
        icon:prof.icon,
        title:isRestaurant?'Registra tu primera venta del día':'Registra tu primera venta o gasto',
        text:`Aquí verás todas las ventas y gastos de tu ${prof.moduleLabel}. Empieza registrando tu primer movimiento.`,
        btn:btnLabel,
        onclick:"openTxModal('business')"
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
      <div class="metric-card green"><div class="metric-label">Ventas del mes</div><div class="metric-value green">${fmtShort(inc)}</div></div>
      <div class="metric-card red"><div class="metric-label">Gastos del mes</div><div class="metric-value red">${fmtShort(exp)}</div></div>
      <div class="metric-card ${inc-exp>=0?'green':'red'}"><div class="metric-label help-row">Utilidad ${helpBtn('concept_utilidad')}</div><div class="metric-value ${inc-exp>=0?'green':'red'}">${inc-exp>=0?'':'-'}${fmtShort(Math.abs(inc-exp))}</div></div>
      <div class="metric-card blue"><div class="metric-label help-row">Operaciones ${helpBtn('concept_operations')}</div><div class="metric-value blue">${txs.length}</div></div>
    </div>
    <div class="tabs">
      <button class="tab active" onclick="filterTx(this,'all','business')">Todos</button>
      <button class="tab" onclick="filterTx(this,'income','business')">Ventas</button>
      <button class="tab" onclick="filterTx(this,'expense','business')">Gastos</button>
    </div>
    <div class="tx-list" id="tx-business">${[...txs].sort((a,b)=>b.date>a.date?1:-1).map(txRow).join('')}</div>
  `;
}
