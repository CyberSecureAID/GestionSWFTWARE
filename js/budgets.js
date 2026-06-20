/* ============================================================
   FinFlow 2.0 — budgets.js
   Página Presupuestos: render, modal de creación y eliminación.
   ============================================================ */

/* Categorías de gasto que todavía no tienen un presupuesto este mes. */
function getAvailableBudgetCats(){
  const ym=getThisMonth();
  const usedCats=state.budgets.filter(b=>b.month===ym).map(b=>b.category);
  return [...CATS_EXPENSE,...CATS_BUSINESS_EXP,...CATS_PURCHASE].filter((c,i,arr)=>arr.indexOf(c)===i&&!usedCats.includes(c));
}

/* ---------- Presupuestos ---------- */
function renderBudgets(){
  const availCats=getAvailableBudgetCats();
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openBudgetModal()" ${availCats.length?'':'disabled title="Ya tienes un presupuesto para cada categoría disponible este mes"'}><i class="ti ti-plus"></i> Nuevo presupuesto</button>`;
  const ym=getThisMonth();
  const expTxs=filterMonth(activeTxs(state.transactions).filter(t=>t.type==='expense'),ym);
  const spentByCat={};
  expTxs.forEach(t=>{const c=t.category||'Sin categoría';spentByCat[c]=(spentByCat[c]||0)+Number(t.amount||0);});
  const budgetsThisMonth=state.budgets.filter(b=>b.month===ym);
  document.getElementById('page-body').innerHTML=`
    <div class="field-hint" style="margin-bottom:18px">Los presupuestos se calculan sobre los gastos del mes actual (${ym}) en todas las cuentas y módulos.</div>
    ${budgetsThisMonth.length?budgetsThisMonth.map(b=>{
      const spent=spentByCat[b.category]||0;
      const pct=Math.min(100,Math.round((spent/Number(b.limit||1))*100));
      const over=spent>Number(b.limit);
      return `<div class="budget-card">
        <div class="budget-head">
          <div class="budget-cat">${esc(b.category)}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="budget-nums">${fmt(spent)} / ${fmt(b.limit)}</div>
            ${actionMenu('budget-'+b.id,[{label:'Eliminar',icon:'ti-trash',onclick:`deleteBudget('${b.id}')`,danger:true}])}
          </div>
        </div>
        <div class="budget-bar-bg"><div class="budget-bar-fill" style="width:${pct}%;background:${over?'var(--red)':pct>80?'var(--amber)':'var(--green)'}"></div></div>
        <div class="budget-foot">
          <span>${over?`⚠ Excedido por ${fmt(spent-b.limit)}`:`${100-pct}% disponible`}</span>
        </div>
      </div>`;
    }).join(''):moduleEmptyState({icon:'ti-chart-pie',title:'Crea tu primer presupuesto',text:'Pon un límite mensual a una categoría de gasto para controlarlo mejor, por ejemplo en Entretenimiento o Transporte.',btn:'Nuevo presupuesto',onclick:'openBudgetModal()'})}
  `;
}

function openBudgetModal(){
  const ym=getThisMonth();
  const availCats=getAvailableBudgetCats();
  document.getElementById('modal-title').textContent='Nuevo presupuesto';
  document.getElementById('modal-body').innerHTML=`
    <div class="field"><label class="help-row">Categoría ${helpBtn('budget_cat')}</label><select id="f-budget-cat">${availCats.length?availCats.map(c=>`<option>${c}</option>`).join(''):'<option value="" disabled selected>Todas las categorías ya tienen presupuesto</option>'}</select></div>
    <div class="field"><label class="help-row">Límite mensual ${helpBtn('budget_limit')}</label><input type="number" id="f-budget-limit" placeholder="0.00" min="0" step="0.01"></div>
    <div class="field-hint">El presupuesto aplica al mes actual (${ym}) y se reinicia automáticamente cada mes.</div>
  `;
  document.getElementById('modal-confirm').onclick=()=>{
    const category=document.getElementById('f-budget-cat').value;
    const limit=parseFloat(document.getElementById('f-budget-limit').value);
    if(!category){showToast('No hay categorías disponibles','error');return;}
    if(!limit||limit<=0){showToast('Ingresa un límite válido','error');return;}
    state.budgets.push({id:uid(),category,limit,month:ym});
    closeModal();showToast('Presupuesto creado');renderPage();scheduleAutosave();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function deleteBudget(id){
  confirmDialog({
    title:'Eliminar presupuesto',
    message:'¿Seguro que quieres eliminar este presupuesto? Esta acción no se puede deshacer.',
    confirmLabel:'Eliminar',
    onConfirm:()=>{
      state.budgets=state.budgets.filter(b=>b.id!==id);
      showToast('Presupuesto eliminado');renderPage();scheduleAutosave();
    }
  });
}
