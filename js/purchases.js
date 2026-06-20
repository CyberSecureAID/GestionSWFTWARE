/* ============================================================
   FinFlow 2.0 — purchases.js
   Página Compras (insumos/mercancía).
   ============================================================ */

/* ---------- Compras ---------- */
function renderPurchases(){
  const isRestaurant=state.profile==='restaurant';
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openTxModal('purchases')"><i class="ti ti-plus"></i> Registrar compra</button>`;
  const txs=activeTxs(state.transactions).filter(t=>t.module==='purchases');

  if(txs.length===0){
    document.getElementById('page-body').innerHTML=`
      ${renderAccountBar()}
      ${moduleEmptyState({
        icon:'ti-shopping-cart',
        title:'Registra tu primera compra',
        text:`Aquí verás las compras de ${isRestaurant?'insumos':'insumos o mercancía'}, separadas de los gastos operativos.`,
        btn:'Registrar compra',
        onclick:"openTxModal('purchases')"
      })}
    `;
    return;
  }

  const ym=getThisMonth();
  const tm=filterMonth(txs,ym);
  const total=sum(tm,'expense');
  document.getElementById('page-body').innerHTML=`
    ${renderAccountBar()}
    <div class="metrics">
      <div class="metric-card red"><div class="metric-label">Comprado este mes</div><div class="metric-value red">${fmtShort(total)}</div></div>
      <div class="metric-card blue"><div class="metric-label">Compras registradas</div><div class="metric-value blue">${txs.length}</div></div>
      <div class="metric-card amber"><div class="metric-label">Vinculadas a inventario</div><div class="metric-value amber">${txs.filter(t=>t.linkInv).length}</div><div class="metric-sub">Suman stock automáticamente</div></div>
    </div>
    <div class="tx-list">${[...txs].sort((a,b)=>b.date>a.date?1:-1).map(txRow).join('')}</div>
  `;
}
