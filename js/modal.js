/* ============================================================
   FinFlow 2.0 — modal.js
   Funciones genéricas de modal, confirmaciones y notificaciones toast.
   ============================================================ */

/* HTML por defecto del footer del modal (Cancelar / Guardar).
   Los modales simples (presupuestos, metas, inventario, cuentas) usan este footer fijo.
   El wizard de movimientos lo sobreescribe dinámicamente con renderWizardFooter()
   y closeModal() lo restaura para que el próximo modal simple funcione normal. */
const DEFAULT_MODAL_FOOTER=`
  <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
  <button class="btn-primary" id="modal-confirm">Guardar</button>
`;

/* ---------- Modal genérico ---------- */
function closeModal(){
  document.getElementById('modal-overlay').classList.add('hidden');
  closeActionMenu();
  const footer=document.querySelector('.modal-footer');
  if(footer)footer.innerHTML=DEFAULT_MODAL_FOOTER;
}

function showToast(msg,type='success'){
  const el=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  el.className=`toast show ${type}`;
  el.querySelector('i').className=type==='error'?'ti ti-alert-circle':type==='info'?'ti ti-info-circle':'ti ti-circle-check';
  setTimeout(()=>el.classList.remove('show'),2800);
}

/* ---------- Confirmación de eliminar / acciones destructivas ----------
   Reemplaza window.confirm con un modal consistente con el resto de la app,
   más claro y predecible para usuarios sin experiencia técnica. */
function confirmDialog(opts){
  document.getElementById('modal-title').textContent=opts.title||'¿Estás seguro?';
  document.getElementById('modal-body').innerHTML=`<div class="field-hint" style="font-size:13px;color:var(--text2);line-height:1.6">${opts.message||''}</div>`;
  const footer=document.querySelector('.modal-footer');
  footer.innerHTML=`
    <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
    <button class="btn-primary" style="background:var(--red);color:#fff" id="modal-confirm-danger">${opts.confirmLabel||'Confirmar'}</button>
  `;
  document.getElementById('modal-confirm-danger').onclick=()=>{
    closeModal();
    if(opts.onConfirm)opts.onConfirm();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}
