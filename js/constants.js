/* ============================================================
   FinFlow — constants.js  (versión reducida)
   Se eliminaron las categorías y textos de ayuda de los módulos
   financieros (presupuestos, metas, transacciones, etc.) que ya
   no existen en la app. Se conserva:
   - esc(): escape de HTML, usado en todo carta.js
   - actionMenu()/toggleActionMenu()/closeActionMenu(): menú de
     acciones flotante (⋮), reutilizable si carta.js u otra pantalla
     lo necesita en el futuro.
   - helpBtn()/showHelp(): sistema de ayuda contextual (el modal de
     ayuda del index.html sigue presente).
   ============================================================ */

/* ---------- Escape HTML ---------- */
function esc(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- Sistema de ayuda contextual ----------
   Vacío por ahora: ya no quedan campos de formularios financieros
   que requieran un texto de ayuda. Se deja la infraestructura lista
   por si Carta del día necesita agregar entradas aquí más adelante,
   con la forma: clave: { title: '...', body: '...' } */
const HELP_TEXT = {};

function showHelp(key, evt) {
  if (evt) evt.stopPropagation();
  const h = HELP_TEXT[key];
  if (!h) return;
  document.getElementById('help-title').textContent = h.title;
  document.getElementById('help-body').innerHTML = h.body;
  document.getElementById('help-overlay').classList.remove('hidden');
}
function closeHelp() { document.getElementById('help-overlay').classList.add('hidden'); }
function helpBtn(key) { return `<button type="button" class="help-btn" onclick="showHelp('${key}',event)" title="Más información" aria-label="Más información">?</button>`; }

/* ============================================================
   Menú de acciones (⋮) flotante — usa position:fixed calculada en
   tiempo de ejecución para que el menú nunca quede recortado por
   overflow:hidden de ningún contenedor padre.
   ============================================================ */
let _openActionMenu = null;

function actionMenu(id, actions) {
  const items = actions.map(a => `<button onclick="${a.onclick};closeActionMenu()" ${a.danger ? 'class="danger"' : ''}><i class="ti ${a.icon}"></i> ${a.label}</button>`).join('');
  return `<div class="tx-actions" style="position:relative;flex-shrink:0;z-index:20">
    <button class="menu-trigger" onclick="toggleActionMenu(event,'${id}')" aria-label="Más acciones" aria-haspopup="true"><i class="ti ti-dots-vertical"></i></button>
    <div class="action-menu" id="menu-${id}">${items}</div>
  </div>`;
}

function toggleActionMenu(evt, id) {
  evt.stopPropagation();
  const menu = document.getElementById('menu-' + id);
  const trigger = evt.currentTarget;
  const wasOpen = menu.classList.contains('open');

  closeActionMenu();

  if (!wasOpen) {
    const rect = trigger.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.zIndex = '9999';
    menu.classList.add('open');
    trigger.classList.add('open');

    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let top = rect.bottom + 4;
      let left = rect.right - menuRect.width;
      if (top + menuRect.height > vh - 8) top = rect.top - menuRect.height - 4;
      if (left < 8) left = 8;
      if (left + menuRect.width > vw - 8) left = vw - menuRect.width - 8;
      menu.style.top = top + 'px';
      menu.style.left = left + 'px';
    });

    _openActionMenu = { menu, trigger };
  }
}

function closeActionMenu() {
  if (_openActionMenu) {
    _openActionMenu.menu.classList.remove('open');
    _openActionMenu.trigger.classList.remove('open');
    _openActionMenu.menu.style.top = '';
    _openActionMenu.menu.style.left = '';
    _openActionMenu = null;
  }
}

document.addEventListener('click', () => closeActionMenu());
window.addEventListener('scroll', () => closeActionMenu(), true);
window.addEventListener('resize', () => closeActionMenu());
