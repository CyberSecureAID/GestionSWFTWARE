/* ============================================================
   FinFlow — state.js  (versión reducida: solo Portada + Configuración + Carta del día)
   Se eliminó todo lo relacionado a: perfiles de onboarding, transacciones
   genéricas, inventario general, presupuestos, metas, cuentas múltiples,
   trading y reportes. "Carta del día" tiene su propio almacenamiento
   independiente en localStorage (ver carta.js) y no depende de este state.
   ============================================================ */

let state = defaultState();
let _saveTimer = null;

function defaultState() {
  return {
    currentPage: 'welcome',
    // carta.js registra cada venta confirmada aquí como un log simple;
    // ningún otro módulo lee este array (ya no hay dashboard/reportes/etc.),
    // pero se mantiene para que cartaConfirmSale() no falle al hacer push.
    transactions: [],
    settings: {
      // Reservado para futuras preferencias globales que no sean
      // específicas de Carta del día (esas viven en carta.js).
    }
  };
}

/* ---------- Utilidades de formato (las sigue usando carta.js) ---------- */
function fmt(n) { return '$' + Math.abs(Number(n) || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtShort(n) { n = Math.abs(Number(n) || 0); if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K'; return fmt(n); }
function getThisMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------- Persistencia: autoguardado en localStorage ----------
   Ya no hay transacciones/inventario que guardar aquí — Carta del día
   gestiona su propia persistencia. Esto solo guarda preferencias menores
   y mantiene el indicador de guardado en la sidebar funcionando. */
const LS_KEY = 'finflow_v2_autosave';

function scheduleAutosave() {
  setSaveDot('pending', 'Guardando…');
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      setSaveDot('saved', 'Guardado en este navegador');
    } catch (e) {
      setSaveDot('unsynced', 'No se pudo guardar localmente');
    }
  }, 500);
}
function setSaveDot(cls, text) {
  const dot = document.getElementById('save-dot');
  const txt = document.getElementById('save-text');
  if (!dot) return;
  dot.className = 'save-dot ' + cls;
  txt.textContent = text;
}
function loadAutosave() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function clearAutosave() {
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
}
