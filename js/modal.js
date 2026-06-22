/* ============================================================
   FinFlow — modal.js
   Funciones genéricas de modal, confirmaciones y notificaciones toast.
   Sin cambios: es genérico y carta.js depende de él directamente.
   ============================================================ */

const DEFAULT_MODAL_FOOTER=`
  <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
  <button class="btn-primary" id="modal-confirm">Guardar</button>
`;

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
