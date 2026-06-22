/* ============================================================
   FinFlow — settings.js  (con MODO DIOS)
   Configuración reducida + un panel avanzado opcional ("Modo Dios")
   que da control total sobre los datos crudos de Carta del día:
   - Ver/editar cada clave de localStorage como JSON.
   - Borrado total selectivo (catálogo / ventas / config / logo / todo).
   El toggle de Modo Dios se recuerda en localStorage para que no haya
   que reactivarlo cada vez (es una preferencia de la persona, no un
   dato de Carta del día, así que vive en su propia clave aparte).
   ============================================================ */

const GOD_MODE_KEY = 'finflow_god_mode';

function isGodMode() {
  try { return localStorage.getItem(GOD_MODE_KEY) === 'true'; } catch (e) { return false; }
}
function setGodMode(v) {
  try { localStorage.setItem(GOD_MODE_KEY, v ? 'true' : 'false'); } catch (e) {}
}

/* Todas las claves de localStorage que pertenecen a Carta del día.
   Centralizado aquí para que el panel de Modo Dios siempre sepa
   exactamente qué existe, sin tener que adivinar prefijos. */
function cartaAllKeys() {
  const fixed = [CK_CATALOG, CK_BUSINESS, CK_LOGO, CK_SEAL, CK_12H];
  const dynamic = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(CK_SALES_DAY_PREFIX) || k.startsWith(CK_SALES_LEGACY_MONTH_PREFIX))) dynamic.push(k);
    }
  } catch (e) {}
  return [...fixed, ...dynamic].filter(k => {
    try { return localStorage.getItem(k) !== null; } catch (e) { return false; }
  });
}

function renderSettings() {
  const god = isGodMode();
  document.getElementById('page-body').innerHTML = `
    <div class="section-header"><div class="section-title">Carta del día</div></div>
    <div class="field-hint" style="margin-bottom:14px;line-height:1.6">
      El catálogo de productos, el nombre del negocio, el logo y el historial de ventas de
      Carta del día se guardan por separado en este navegador. Desde aquí puedes acceder
      rápido a sus herramientas de exportación, importación y configuración.
    </div>
    <div style="display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap">
      <button class="btn success" onclick="navigate('carta')"><i class="ti ti-receipt"></i> Ir a Carta del día</button>
      <button class="btn" onclick="navigate('carta');setTimeout(cartaOpenDataMenu,50)" style="border-color:var(--blue);color:var(--blue-text)"><i class="ti ti-file-spreadsheet"></i> Exportar / Importar</button>
      <button class="btn" onclick="navigate('carta');setTimeout(cartaOpenSettings,50)" style="border-color:var(--border2);color:var(--text3)"><i class="ti ti-settings"></i> Configurar Carta del día</button>
    </div>

    <div class="section-header"><div class="section-title help-row">Respaldo y almacenamiento</div></div>
    <div class="field-hint" style="margin-bottom:10px;line-height:1.6">
      <b style="color:var(--text)">Autoguardado local:</b> algunas preferencias se guardan automáticamente
      en este navegador (localStorage). Esto NO sustituye un respaldo externo — si limpias el navegador
      o cambias de equipo, este respaldo se pierde.
    </div>
    <button class="btn" onclick="clearAutosaveConfirm()" style="border-color:var(--red);color:var(--red-text);margin-bottom:28px"><i class="ti ti-trash"></i> Borrar respaldo local de este navegador</button>

    <div class="god-toggle-row">
      <div class="god-toggle-label">
        <i class="ti ti-skull"></i>
        <div>
          Modo Dios
          <div class="god-toggle-sub">Acceso crudo a los datos de Carta del día y borrado total. Para uso avanzado.</div>
        </div>
      </div>
      <label class="switch"><input type="checkbox" id="god-mode-toggle" ${god ? 'checked' : ''} onchange="toggleGodMode(this.checked)"><span class="switch-slider"></span></label>
    </div>

    <div id="god-panel-wrap">${god ? renderGodPanel() : ''}</div>
  `;
}

function toggleGodMode(v) {
  setGodMode(v);
  showToast(v ? 'Modo Dios activado' : 'Modo Dios desactivado');
  document.getElementById('god-panel-wrap').innerHTML = v ? renderGodPanel() : '';
}

/* ============================================================
   PANEL DE MODO DIOS
   ============================================================ */
function renderGodPanel() {
  return `
    <div class="god-panel">
      <div class="god-panel-head"><i class="ti ti-skull"></i> Modo Dios — control total de Carta del día</div>
      <div class="god-panel-warning">
        <i class="ti ti-alert-triangle"></i>
        <div>Estas acciones <b>no tienen confirmación adicional más allá del diálogo que aparece</b> y algunas son irreversibles. Edita o borra solo si sabes lo que estás haciendo.</div>
      </div>

      <div class="god-section">
        <div class="god-section-title"><i class="ti ti-bomb"></i> Borrado total</div>
        <div class="god-danger-grid">
          <button class="god-danger-btn" onclick="godClear('catalog')"><i class="ti ti-package"></i> Borrar catálogo</button>
          <button class="god-danger-btn" onclick="godClear('sales')"><i class="ti ti-receipt"></i> Borrar todas las ventas (todas las fechas)</button>
          <button class="god-danger-btn" onclick="godClear('branding')"><i class="ti ti-building-store"></i> Borrar nombre, logo y sello</button>
          <button class="god-danger-btn" onclick="godClear('config')"><i class="ti ti-settings"></i> Borrar config. (hora 12h/24h)</button>
        </div>
        <button class="god-danger-btn nuke" style="width:100%;justify-content:center;margin-top:4px" onclick="godClear('all')">
          <i class="ti ti-trash-x"></i> BORRAR ABSOLUTAMENTE TODO de Carta del día
        </button>
      </div>

      <div class="god-section">
        <div class="god-section-title"><i class="ti ti-database"></i> Claves en localStorage (${cartaAllKeys().length})</div>
        <div class="god-keys-list" id="god-keys-list">${renderGodKeysList()}</div>
      </div>

      <div class="god-section">
        <div class="god-section-title"><i class="ti ti-code"></i> Editor crudo</div>
        <div class="field" style="margin-bottom:8px">
          <label>Elige una clave para ver/editar su JSON</label>
          <select id="god-key-select" onchange="godLoadRaw(this.value)">
            <option value="">— selecciona —</option>
            ${cartaAllKeys().map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}
          </select>
        </div>
        <textarea class="god-raw-textarea" id="god-raw-textarea" placeholder="Selecciona una clave arriba para cargar su contenido..." spellcheck="false"></textarea>
        <div class="god-raw-actions">
          <button class="btn success" onclick="godSaveRaw()"><i class="ti ti-device-floppy"></i> Guardar cambios</button>
          <button class="btn" onclick="godFormatRaw()" style="border-color:var(--blue);color:var(--blue-text)"><i class="ti ti-braces"></i> Formatear JSON</button>
          <button class="btn" onclick="godDeleteRawKey()" style="border-color:var(--red);color:var(--red-text)"><i class="ti ti-trash"></i> Eliminar esta clave</button>
        </div>
        <div class="god-raw-status" id="god-raw-status"></div>
      </div>
    </div>
  `;
}

function renderGodKeysList() {
  const keys = cartaAllKeys();
  if (!keys.length) return `<div class="field-hint">No hay datos guardados de Carta del día todavía.</div>`;
  return keys.map(k => {
    let size = 0;
    try { size = (localStorage.getItem(k) || '').length; } catch (e) {}
    return `<div class="god-key-row">
      <span class="god-key-name">${esc(k)}</span>
      <span class="god-key-size">${size.toLocaleString('es')} bytes</span>
      <button class="god-key-del" onclick="godDeleteKey('${esc(k)}')" title="Eliminar esta clave"><i class="ti ti-x"></i></button>
    </div>`;
  }).join('');
}

function refreshGodKeysUI() {
  const list = document.getElementById('god-keys-list');
  if (list) list.innerHTML = renderGodKeysList();
  const select = document.getElementById('god-key-select');
  if (select) {
    const keys = cartaAllKeys();
    select.innerHTML = `<option value="">— selecciona —</option>${keys.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}`;
  }
  const title = document.querySelector('.god-section-title');
  // Actualiza el contador "(N)" del título de la sección de claves sin reconstruir todo el panel
  document.querySelectorAll('.god-section-title').forEach(el => {
    if (el.textContent.includes('Claves en localStorage')) {
      el.innerHTML = `<i class="ti ti-database"></i> Claves en localStorage (${cartaAllKeys().length})`;
    }
  });
}

/* ---------- Editor crudo ---------- */
function godLoadRaw(key) {
  const ta = document.getElementById('god-raw-textarea');
  const status = document.getElementById('god-raw-status');
  status.textContent = '';
  status.className = 'god-raw-status';
  if (!key) { ta.value = ''; ta.dataset.key = ''; return; }
  let raw = '';
  try { raw = localStorage.getItem(key) || ''; } catch (e) {}
  ta.dataset.key = key;
  // Si es JSON válido, lo mostramos formateado; si no (ej. el logo en base64
  // o el flag de hora que es 'true'/'false'), se muestra tal cual.
  try {
    ta.value = JSON.stringify(JSON.parse(raw), null, 2);
  } catch (e) {
    ta.value = raw;
  }
}
function godFormatRaw() {
  const ta = document.getElementById('god-raw-textarea');
  const status = document.getElementById('god-raw-status');
  try {
    ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
    status.textContent = 'Formateado correctamente';
    status.className = 'god-raw-status ok';
  } catch (e) {
    status.textContent = 'No es JSON válido — se deja el texto tal cual';
    status.className = 'god-raw-status err';
  }
}
function godSaveRaw() {
  const ta = document.getElementById('god-raw-textarea');
  const status = document.getElementById('god-raw-status');
  const key = ta.dataset.key;
  if (!key) { status.textContent = 'Selecciona primero una clave'; status.className = 'god-raw-status err'; return; }
  // Si el contenido parece JSON (empieza con { o [), exigimos que sea válido
  // para no guardar basura corrupta; si no, se guarda como texto plano
  // (ej. el flag de hora 12h o el base64 del logo).
  const trimmed = ta.value.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { JSON.parse(trimmed); } catch (e) {
      status.textContent = 'JSON inválido — no se guardó. Corrige la sintaxis e intenta de nuevo.';
      status.className = 'god-raw-status err';
      return;
    }
  }
  try {
    localStorage.setItem(key, ta.value);
    status.textContent = `Guardado en "${key}"`;
    status.className = 'god-raw-status ok';
    showToast('Clave actualizada');
    refreshGodKeysUI();
    // Si lo que editamos afecta a Carta del día y la persona vuelve ahí,
    // queremos que cargue los datos nuevos, no los que tenía en memoria.
    if (typeof _cartaCatalog !== 'undefined') cartaLoad();
  } catch (e) {
    status.textContent = 'Error al guardar: ' + e.message;
    status.className = 'god-raw-status err';
  }
}
function godDeleteRawKey() {
  const ta = document.getElementById('god-raw-textarea');
  const key = ta.dataset.key;
  if (!key) { showToast('Selecciona primero una clave', 'error'); return; }
  godDeleteKey(key);
}
function godDeleteKey(key) {
  confirmDialog({
    title: 'Eliminar clave',
    message: `¿Eliminar permanentemente <b style="color:var(--text)">${esc(key)}</b> de localStorage? Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    onConfirm: () => {
      try { localStorage.removeItem(key); } catch (e) {}
      showToast('Clave eliminada');
      refreshGodKeysUI();
      const ta = document.getElementById('god-raw-textarea');
      if (ta && ta.dataset.key === key) { ta.value = ''; ta.dataset.key = ''; }
      if (typeof _cartaCatalog !== 'undefined') cartaLoad();
    }
  });
}

/* ---------- Borrado total por categoría ---------- */
const GOD_CLEAR_LABELS = {
  catalog: 'el catálogo completo de productos',
  sales: 'TODAS las ventas registradas (hoy y días anteriores)',
  branding: 'el nombre del negocio, el logo y el sello',
  config: 'la configuración de formato de hora',
  all: 'ABSOLUTAMENTE TODO de Carta del día (catálogo, ventas, nombre, logo, sello y configuración)'
};

function godClear(scope) {
  confirmDialog({
    title: scope === 'all' ? '⚠ Borrar todo' : 'Confirmar borrado',
    message: `Esto eliminará permanentemente ${GOD_CLEAR_LABELS[scope]}. Esta acción <b style="color:var(--red-text)">no se puede deshacer</b>.`,
    confirmLabel: scope === 'all' ? 'Sí, borrar todo' : 'Sí, borrar',
    onConfirm: () => {
      try {
        if (scope === 'catalog' || scope === 'all') {
          localStorage.removeItem(CK_CATALOG);
        }
        if (scope === 'sales' || scope === 'all') {
          cartaAllKeys().forEach(k => {
            if (k.startsWith(CK_SALES_DAY_PREFIX) || k.startsWith(CK_SALES_LEGACY_MONTH_PREFIX)) localStorage.removeItem(k);
          });
        }
        if (scope === 'branding' || scope === 'all') {
          localStorage.removeItem(CK_BUSINESS);
          localStorage.removeItem(CK_LOGO);
          localStorage.removeItem(CK_SEAL);
        }
        if (scope === 'config' || scope === 'all') {
          localStorage.removeItem(CK_12H);
        }
      } catch (e) {}
      showToast(scope === 'all' ? 'Todo borrado' : 'Borrado completado');
      if (typeof _cartaCatalog !== 'undefined') cartaLoad();
      // Re-render completo del panel para que el conteo de claves y la
      // lista reflejen el estado nuevo.
      renderSettings();
    }
  });
}

/* ---------- Respaldo local genérico (sin cambios funcionales) ---------- */
function clearAutosaveConfirm() {
  confirmDialog({
    title: 'Borrar respaldo local',
    message: '¿Borrar el respaldo guardado en este navegador? Esto no afecta el catálogo, ventas ni configuración de Carta del día, que se guardan por separado.',
    confirmLabel: 'Borrar respaldo',
    onConfirm: () => {
      clearAutosave();
      showToast('Respaldo local borrado');
    }
  });
}
