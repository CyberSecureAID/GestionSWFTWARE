/* ============================================================
   FinFlow 2.0 — settings.js
   Página Configuración: vínculo ventas-inventario, cuentas y respaldo local.
   ============================================================ */

/* ---------- Configuración (nuevo) ---------- */
function renderSettings(){
  document.getElementById('page-body').innerHTML=`
    <div class="section-header"><div class="section-title">Vínculo ventas ↔ inventario</div></div>
    <div class="field-toggle" style="margin-bottom:24px">
      <div>
        <div class="field-toggle-label help-row">Descontar stock automáticamente al vender ${helpBtn('cfg_link_inv')}</div>
        <div class="field-toggle-sub">Cuando registres una venta vinculada a un producto, su stock se reduce solo. Puedes desactivarlo si prefieres llevar el inventario por separado.</div>
      </div>
      <label class="switch"><input type="checkbox" id="cfg-link-inv" ${state.settings.linkSalesToInventory?'checked':''} onchange="toggleLinkSetting()"><span class="switch-slider"></span></label>
    </div>

    <div class="section-header"><div class="section-title">Cuentas</div><button class="btn success" onclick="openAccountModal()"><i class="ti ti-plus"></i> Nueva cuenta</button></div>
    <div class="tx-list" style="margin-bottom:24px">
      ${state.accounts.map(a=>`<div class="tx-item">
        <div class="tx-icon income"><i class="ti ti-building-bank"></i></div>
        <div class="tx-info"><div class="tx-desc">${a.name}</div><div class="tx-meta">${a.id===state.activeAccount?'Cuenta activa':'Inactiva'}</div></div>
        ${state.accounts.length>1?`<div class="tx-actions" style="opacity:1"><button class="icon-btn" onclick="deleteAccount('${a.id}')"><i class="ti ti-trash"></i></button></div>`:''}
      </div>`).join('')}
    </div>

    <div class="section-header"><div class="section-title">Respaldo y almacenamiento</div></div>
    <div class="field-hint" style="margin-bottom:10px;line-height:1.6">
      <b style="color:var(--text)">Autoguardado local:</b> cada cambio se guarda automáticamente en este navegador (localStorage) como respaldo. Esto NO sustituye al Excel — si limpias el navegador o cambias de equipo, este respaldo se pierde.<br><br>
      <b style="color:var(--text)">Exportar a Excel:</b> es tu copia portátil y permanente. Tu archivo Excel es siempre la fuente de verdad para mover datos entre equipos.
    </div>
    <button class="btn" onclick="clearAutosaveConfirm()" style="border-color:var(--red);color:var(--red-text)"><i class="ti ti-trash"></i> Borrar respaldo local de este navegador</button>
  `;
}
function toggleLinkSetting(){
  state.settings.linkSalesToInventory=document.getElementById('cfg-link-inv').checked;
  showToast(state.settings.linkSalesToInventory?'Vínculo activado: las ventas descontarán stock':'Vínculo desactivado: ventas e inventario son independientes');
  scheduleAutosave();
}
function clearAutosaveConfirm(){
  if(confirm('¿Borrar el respaldo guardado en este navegador? Tu archivo Excel no se verá afectado.')){
    clearAutosave();
    showToast('Respaldo local borrado');
  }
}
function openAccountModal(){
  document.getElementById('modal-title').textContent='Nueva cuenta';
  document.getElementById('modal-body').innerHTML=`
    <div class="field"><label class="help-row">Nombre de la cuenta ${helpBtn('account_name')}</label><input type="text" id="f-acc-name" placeholder="Ej: Personal, Negocio, Ahorros..."></div>
    <div class="field-hint">Cada cuenta tiene sus propios movimientos. Útil para separar finanzas personales de un negocio, o distintos negocios entre sí.</div>
  `;
  document.getElementById('modal-confirm').onclick=()=>{
    const name=document.getElementById('f-acc-name').value.trim();
    if(!name){showToast('Ingresa un nombre','error');return;}
    state.accounts.push({id:uid(),name});
    closeModal();showToast('Cuenta creada');renderPage();scheduleAutosave();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function deleteAccount(id){
  if(state.accounts.length<=1)return;
  if(!confirm('¿Eliminar esta cuenta? Sus movimientos quedarán sin cuenta asignada (no se borran).'))return;
  state.accounts=state.accounts.filter(a=>a.id!==id);
  if(state.activeAccount===id)state.activeAccount=state.accounts[0].id;
  showToast('Cuenta eliminada');renderPage();scheduleAutosave();
}
