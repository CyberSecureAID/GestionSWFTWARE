/* ============================================================
   FinFlow 2.0 — modal.js
   Funciones genéricas de modal y notificaciones toast.
   ============================================================ */

/* ---------- Modal genérico ---------- */
function closeModal(){document.getElementById('modal-overlay').classList.add('hidden');}

function showToast(msg,type='success'){
  const el=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  el.className=`toast show ${type}`;
  el.querySelector('i').className=type==='error'?'ti ti-alert-circle':type==='info'?'ti ti-info-circle':'ti ti-circle-check';
  setTimeout(()=>el.classList.remove('show'),2800);
}
