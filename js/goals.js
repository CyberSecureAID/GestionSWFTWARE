/* ============================================================
   FinFlow 2.0 — goals.js
   Página Metas de ahorro: render, tarjetas, modales de creación/edición/aporte y eliminación.
   ============================================================ */

/* ---------- Metas de ahorro ---------- */
function renderGoals(){
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openGoalModal()"><i class="ti ti-plus"></i> Nueva meta</button>`;
  document.getElementById('page-body').innerHTML=`
    ${state.goals.length?`<div class="goal-grid">${state.goals.map(goalCard).join('')}</div>`:'<div class="empty"><i class="ti ti-target-arrow"></i><p>Sin metas de ahorro. Crea una para empezar a trackear tu progreso.</p></div>'}
  `;
}
function goalCard(g){
  const pct=Math.min(100,Math.round((Number(g.current||0)/Number(g.target||1))*100));
  const done=pct>=100;
  return `<div class="goal-card">
    <div class="goal-head">
      <div><div class="goal-name">${g.name}</div>${g.deadline?`<div class="goal-deadline"><i class="ti ti-calendar" style="font-size:11px"></i> Meta: ${g.deadline}</div>`:''}</div>
      <button class="icon-btn" onclick="deleteGoal('${g.id}')"><i class="ti ti-trash"></i></button>
    </div>
    <div class="goal-amt">${fmt(g.current||0)}</div>
    <div class="goal-target">de ${fmt(g.target)} objetivo · ${pct}%</div>
    <div class="budget-bar-bg" style="margin-top:8px"><div class="budget-bar-fill" style="width:${pct}%;background:${done?'var(--green)':'var(--blue)'}"></div></div>
    <div class="goal-actions">
      <button class="btn" onclick="addToGoal('${g.id}')"><i class="ti ti-plus"></i> Agregar fondos</button>
      <button class="btn" onclick="editGoal('${g.id}')"><i class="ti ti-pencil"></i> Editar</button>
    </div>
  </div>`;
}
function openGoalModal(){
  _editingGoalId=null;
  document.getElementById('modal-title').textContent='Nueva meta de ahorro';
  document.getElementById('modal-body').innerHTML=`
    <div class="field"><label class="help-row">Nombre de la meta ${helpBtn('goal_name')}</label><input type="text" id="f-goal-name" placeholder="Ej: Fondo de emergencia, Vacaciones..."></div>
    <div class="field-row">
      <div class="field"><label class="help-row">Monto objetivo ${helpBtn('goal_target')}</label><input type="number" id="f-goal-target" placeholder="0.00" min="0" step="0.01"></div>
      <div class="field"><label class="help-row">Monto inicial (opcional) ${helpBtn('goal_current')}</label><input type="number" id="f-goal-current" placeholder="0.00" min="0" step="0.01"></div>
    </div>
    <div class="field"><label class="help-row">Fecha límite (opcional) ${helpBtn('goal_deadline')}</label><input type="date" id="f-goal-deadline"></div>
  `;
  document.getElementById('modal-confirm').onclick=()=>{
    const name=document.getElementById('f-goal-name').value.trim();
    const target=parseFloat(document.getElementById('f-goal-target').value);
    if(!name){showToast('Ingresa el nombre de la meta','error');return;}
    if(!target||target<=0){showToast('Ingresa un monto objetivo válido','error');return;}
    state.goals.push({id:uid(),name,target,current:parseFloat(document.getElementById('f-goal-current').value)||0,deadline:document.getElementById('f-goal-deadline').value});
    closeModal();showToast('Meta creada');renderPage();scheduleAutosave();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function editGoal(id){
  const g=state.goals.find(x=>x.id===id);if(!g)return;
  document.getElementById('modal-title').textContent='Editar meta';
  document.getElementById('modal-body').innerHTML=`
    <div class="field"><label class="help-row">Nombre de la meta ${helpBtn('goal_name')}</label><input type="text" id="f-goal-name" value="${g.name}"></div>
    <div class="field-row">
      <div class="field"><label class="help-row">Monto objetivo ${helpBtn('goal_target')}</label><input type="number" id="f-goal-target" value="${g.target}" min="0" step="0.01"></div>
      <div class="field"><label class="help-row">Monto actual ${helpBtn('goal_current')}</label><input type="number" id="f-goal-current" value="${g.current||0}" min="0" step="0.01"></div>
    </div>
    <div class="field"><label class="help-row">Fecha límite (opcional) ${helpBtn('goal_deadline')}</label><input type="date" id="f-goal-deadline" value="${g.deadline||''}"></div>
  `;
  document.getElementById('modal-confirm').onclick=()=>{
    const name=document.getElementById('f-goal-name').value.trim();
    const target=parseFloat(document.getElementById('f-goal-target').value);
    if(!name){showToast('Ingresa el nombre de la meta','error');return;}
    if(!target||target<=0){showToast('Ingresa un monto objetivo válido','error');return;}
    g.name=name;g.target=target;g.current=parseFloat(document.getElementById('f-goal-current').value)||0;g.deadline=document.getElementById('f-goal-deadline').value;
    closeModal();showToast('Meta actualizada');renderPage();scheduleAutosave();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function addToGoal(id){
  const g=state.goals.find(x=>x.id===id);if(!g)return;
  document.getElementById('modal-title').textContent='Agregar fondos a la meta';
  document.getElementById('modal-body').innerHTML=`
    <div class="field-hint" style="margin-bottom:12px">${g.name} — actualmente ${fmt(g.current||0)} de ${fmt(g.target)}</div>
    <div class="field"><label class="help-row">Monto a agregar ${helpBtn('goal_add')}</label><input type="number" id="f-goal-add" placeholder="0.00" min="0" step="0.01"></div>
  `;
  document.getElementById('modal-confirm').onclick=()=>{
    const add=parseFloat(document.getElementById('f-goal-add').value);
    if(!add||add<=0){showToast('Ingresa un monto válido','error');return;}
    g.current=Number(g.current||0)+add;
    closeModal();showToast('Fondos agregados a la meta');renderPage();scheduleAutosave();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function deleteGoal(id){state.goals=state.goals.filter(g=>g.id!==id);showToast('Meta eliminada');renderPage();scheduleAutosave();}
