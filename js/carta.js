/* ============================================================
   FinFlow 2.0 — carta.js  v3
   "Carta del día" — punto de venta táctil universal para
   restaurantes, tiendas, y cualquier negocio.

   CORRECCIONES v3 (auditoría):
   - Nombre consistente: "Carta del día" en toda la sección
     (antes mezclaba "Punto de Venta" internamente).
   - El precio unitario ya NO se muestra en el botón de venta
     táctil (solo nombre + emoji + contador). Se sigue
     almacenando y usando internamente para el total y la factura.
   - "Ventas de hoy" / "Total del día" / "Ganancias del día"
     ahora filtran estrictamente por la fecha de HOY, en vez de
     acumular todo el mes (antes la clave de guardado agrupaba
     por mes completo aunque la UI decía "del día").
   - Historial de ventas ahora se guarda por día (clave con
     fecha completa) y se migra automáticamente el formato viejo
     mensual si existiera, para no perder datos previos.
   - Nuevo: exportar/importar el catálogo de productos y el
     historial de ventas a CSV, de forma independiente del
     export/import general de FinFlow (claramente diferenciado).
   - Permite ingresar el costo de un producto directamente desde
     el modal de "Ganancias del día" cuando falta, sin tener que
     ir al catálogo.
   ============================================================ */

/* ── Estado local ── */
let _cartaCatalog     = [];   // [{id, name, price, cost, emoji}]
let _cartaSessions    = [];   // [{id, label, cart:{prodId:qty}}]  — sesiones activas
let _cartaActiveSessionId = null;
let _cartaView        = 'catalog'; // 'catalog'|'sell'|'invoice'
let _cartaLastSale    = null;      // última venta confirmada (para mostrar factura)
let _cartaBusinessName = '';
let _cartaBusinessLogo = null;     // base64 string o null
let _cartaSealText    = '';        // texto del sello
let _cartaUse12h      = true;      // formato 12h
let _cartaDaySales    = [];        // ventas de HOY únicamente

/* ── Claves localStorage ── */
const CK_CATALOG  = 'finflow_carta_catalog';
const CK_BUSINESS = 'finflow_carta_business';
const CK_LOGO     = 'finflow_carta_logo';
const CK_SEAL     = 'finflow_carta_seal';
const CK_12H      = 'finflow_carta_12h';
const CK_SALES_DAY_PREFIX = 'finflow_carta_sales_day_'; // + YYYY-MM-DD
const CK_SALES_LEGACY_MONTH_PREFIX = 'finflow_carta_sales_'; // formato viejo (YYYYMM) — solo para migración

/* ── Emojis de producto (100+, categorías útiles) ── */
const CARTA_EMOJIS = [
  // Bebidas
  '🍺','🍻','🥤','🍹','🍸','🧉','☕','🫖','🧃','🥛','🍵','🧋','🫗','🍷','🥂','🍾','🫧',
  // Comida rápida & snacks
  '🍕','🍔','🌮','🌯','🥙','🍟','🌭','🥓','🥚','🧆','🥞','🧇','🫔',
  // Mariscos & carnes
  '🍗','🥩','🍖','🦀','🦞','🦐','🐟','🍣','🍱','🍛','🥘','🫕',
  // Pastas & granos
  '🍝','🍜','🍲','🍚','🍙','🍘','🥗','🥣',
  // Postres & panadería
  '🍰','🎂','🧁','🍩','🍪','🍮','🍯','🍫','🍬','🍭','🧇','🥐','🍞','🥖','🥨',
  // Frutas & verduras
  '🍎','🍊','🍋','🍇','🍓','🫐','🍑','🍒','🥭','🍍','🥝','🍆','🥑','🍅','🌽','🫛',
  // Ropa & accesorios
  '👕','👗','👖','👔','🧥','🧣','🧤','🧢','👟','👠','👜','🕶️','⌚','💍','👒',
  // Tecnología & hogar
  '📱','💻','🖥️','⌨️','🖱️','🎮','📷','📺','💡','🔋','🎧','📻',
  // Herramientas & ferretería
  '🔧','🔨','🪛','🔩','🪚','🗜️','🪜','🧰','🔌','💈',
  // Cosméticos & salud
  '💄','🧴','🧼','💊','🩺','🩹','🪥','🧹','🧺','🧻',
  // Papelería & educación
  '📚','📖','📝','✏️','📐','📎','🖊️','📦','🗂️','📋',
  // Varios & genérico
  '🎁','⭐','🏷️','💎','🛒','🪙','💵','🔑','🪄','🛍️','🎀','🎊','🏅','🥇','🛺','🪴'
];

/* ── Fecha de hoy en formato YYYY-MM-DD (clave estable para persistencia diaria) ── */
function cartaTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ── Persistencia ── */
function cartaLoad() {
  try { _cartaCatalog      = JSON.parse(localStorage.getItem(CK_CATALOG)  || '[]'); } catch(e) { _cartaCatalog = []; }
  try { _cartaBusinessName = localStorage.getItem(CK_BUSINESS) || ''; } catch(e) {}
  try { _cartaBusinessLogo = localStorage.getItem(CK_LOGO)     || null; } catch(e) {}
  try { _cartaSealText     = localStorage.getItem(CK_SEAL)     || ''; } catch(e) {}
  try { _cartaUse12h       = localStorage.getItem(CK_12H) !== 'false'; } catch(e) {}
  cartaLoadTodaySales();
}

/* Carga estrictamente las ventas de HOY. Si detecta el formato viejo
   (agregado por mes completo), migra solo las ventas de hoy desde ahí
   y deja el resto intacto bajo su propia clave diaria (no se pierde nada,
   pero las métricas "del día" dejan de mezclar todo el mes). */
function cartaLoadTodaySales() {
  const todayKey = cartaTodayKey();
  let sales = [];
  try {
    sales = JSON.parse(localStorage.getItem(CK_SALES_DAY_PREFIX + todayKey) || '[]');
  } catch(e) { sales = []; }

  // Migración best-effort desde el formato legacy mensual, solo una vez.
  if (sales.length === 0) {
    try {
      const legacyKey = CK_SALES_LEGACY_MONTH_PREFIX + getThisMonth().replace('-','');
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const legacySales = JSON.parse(legacyRaw) || [];
        const todaysFromLegacy = legacySales.filter(s => (s.dateISO || '').slice(0,10) === todayKey);
        if (todaysFromLegacy.length) {
          sales = todaysFromLegacy;
          localStorage.setItem(CK_SALES_DAY_PREFIX + todayKey, JSON.stringify(sales));
        }
      }
    } catch(e) {}
  }
  _cartaDaySales = sales;
}

function cartaSaveCatalog()  { try { localStorage.setItem(CK_CATALOG, JSON.stringify(_cartaCatalog)); } catch(e) {} }
function cartaSaveBusiness(n){ _cartaBusinessName = n; try { localStorage.setItem(CK_BUSINESS, n); } catch(e) {} }
function cartaSaveSeal(t)    { _cartaSealText = t;     try { localStorage.setItem(CK_SEAL, t); } catch(e) {} }
function cartaSaveLogo(b64)  { _cartaBusinessLogo = b64; try { localStorage.setItem(CK_LOGO, b64||''); } catch(e) {} }
function cartaSave12h(v)     { _cartaUse12h = v; try { localStorage.setItem(CK_12H, v?'true':'false'); } catch(e) {} }
function cartaSaveDaySales() { try { localStorage.setItem(CK_SALES_DAY_PREFIX + cartaTodayKey(), JSON.stringify(_cartaDaySales)); } catch(e) {} }

/* ── Helpers de sesión ── */
function cartaActiveSession() { return _cartaSessions.find(s => s.id === _cartaActiveSessionId) || null; }
function cartaCartOf(session) { return session ? session.cart : {}; }
function cartaCartTotal(cart) {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = _cartaCatalog.find(x => x.id === id);
    return sum + (p ? Number(p.price) * qty : 0);
  }, 0);
}
function cartaCartCount(cart) { return Object.values(cart).reduce((a, b) => a + b, 0); }

/* ── Formato de hora ── */
function cartaFmtTime(d) {
  if (_cartaUse12h) {
    let h = d.getHours(), m = d.getMinutes(), ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2,'0')} ${ampm}`;
  }
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/* ── CSV helpers (sin dependencias externas) ── */
function cartaCsvEscape(v) {
  const s = v === undefined || v === null ? '' : String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
  return s;
}
function cartaDownloadTextFile(filename, text) {
  const blob = new Blob(['\uFEFF' + text], { type:'text/csv;charset=utf-8;' }); // BOM para acentos en Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function cartaParseCsv(text) {
  // Parser CSV simple que soporta comillas y comas escapadas — suficiente para
  // los archivos que esta misma app genera.
  const rows = []; let row = []; let field = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignore */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && !(r.length === 1 && r[0] === ''));
}

/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */
function renderCarta() {
  cartaLoad();
  if (_cartaSessions.length === 0) {
    _cartaSessions = [{ id: uid(), label: 'Sesión 1', cart: {} }];
    _cartaActiveSessionId = _cartaSessions[0].id;
  }
  if (!cartaActiveSession()) _cartaActiveSessionId = _cartaSessions[0].id;

  if (_cartaView === 'catalog')     renderCartaCatalog();
  else if (_cartaView === 'sell')   renderCartaSell();
  else if (_cartaView === 'invoice') renderCartaInvoice(_cartaLastSale);
}

/* ============================================================
   VISTA 1: CATÁLOGO / PANEL DE GESTIÓN
   ============================================================ */
function renderCartaCatalog() {
  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn success" onclick="cartaOpenAddProduct()"><i class="ti ti-plus"></i> Nuevo producto</button>
    <button class="btn" onclick="cartaGoSell()" ${_cartaCatalog.length ? '' : 'disabled'} style="${_cartaCatalog.length ? 'border-color:var(--amber);color:var(--amber)' : ''}"><i class="ti ti-receipt"></i> Ir a vender</button>
    <button class="btn" onclick="cartaShowProfit()" style="border-color:var(--purple);color:var(--purple)"><i class="ti ti-coin"></i> Ganancias del día</button>
    <button class="btn" onclick="cartaOpenDataMenu()" style="border-color:var(--blue);color:var(--blue-text)"><i class="ti ti-file-spreadsheet"></i> Exportar/Importar</button>
    <button class="btn" onclick="cartaOpenSettings()" style="border-color:var(--border2);color:var(--text3)"><i class="ti ti-settings"></i></button>
  `;

  const totalDayRevenue = _cartaDaySales.reduce((a, s) => a + s.total, 0);
  const statsRow = _cartaDaySales.length ? `
    <div class="carta-day-stats">
      <div class="carta-stat"><span class="carta-stat-val green">${_cartaDaySales.length}</span><span class="carta-stat-label">ventas hoy</span></div>
      <div class="carta-stat"><span class="carta-stat-val amber">${fmt(totalDayRevenue)}</span><span class="carta-stat-label">total del día</span></div>
      <button class="btn" onclick="cartaShowProfit()" style="border-color:var(--purple);color:var(--purple);font-size:11px;padding:6px 10px;margin-left:auto"><i class="ti ti-chart-line"></i> Ver ganancias del día</button>
    </div>
  ` : '';

  /* Barra de nombre del negocio */
  const bizRow = `
    <div class="carta-business-row">
      <div class="carta-biz-logo-wrap">
        ${_cartaBusinessLogo
          ? `<img src="${_cartaBusinessLogo}" class="carta-biz-logo-preview" alt="Logo">`
          : `<div class="carta-biz-logo-placeholder"><i class="ti ti-building-store"></i></div>`}
        <label class="carta-biz-logo-btn" title="Cargar logo">
          <i class="ti ti-camera"></i>
          <input type="file" accept="image/*" onchange="cartaLoadLogo(event)" style="display:none">
        </label>
      </div>
      <div class="carta-business-input-wrap">
        <input type="text" class="carta-business-input" placeholder="Nombre de tu negocio..." value="${esc(_cartaBusinessName)}" oninput="cartaSaveBusiness(this.value)">
        <div class="carta-business-hint">Aparece en todos los comprobantes · Logo y sello opcionales</div>
      </div>
    </div>
  `;

  if (_cartaCatalog.length === 0) {
    document.getElementById('page-body').innerHTML = `
      ${bizRow}${statsRow}
      <div class="guide-card" style="margin-top:16px">
        <div class="guide-icon"><i class="ti ti-clipboard-list"></i></div>
        <div class="guide-step-tag">Primer paso</div>
        <h3>Agrega tus productos a la carta del día</h3>
        <p>Crea la lista de lo que vendes — bebidas, ropa, comida, artículos. Solo lo haces una vez y lo puedes editar cuando quieras.</p>
        <button class="w-btn primary" onclick="cartaOpenAddProduct()"><i class="ti ti-plus"></i> Agregar primer producto</button>
      </div>
    `;
    return;
  }

  const grid = _cartaCatalog.map(p => `
    <div class="carta-prod-card">
      <div class="carta-prod-emoji">${p.emoji || '🏷️'}</div>
      <div class="carta-prod-name">${esc(p.name)}</div>
      <div class="carta-prod-price">${fmt(p.price)}</div>
      <div class="carta-prod-cost">${p.cost ? `Costo: ${fmt(p.cost)}` : '<span style="color:var(--text3)">Sin costo</span>'}</div>
      <div class="carta-prod-actions">
        <button class="carta-prod-btn edit" onclick="cartaOpenAddProduct('${p.id}')"><i class="ti ti-pencil"></i></button>
        <button class="carta-prod-btn del"  onclick="cartaDeleteProduct('${p.id}')"><i class="ti ti-trash"></i></button>
      </div>
    </div>
  `).join('');

  document.getElementById('page-body').innerHTML = `
    ${bizRow}${statsRow}
    <div class="section-header" style="margin-top:8px">
      <div class="section-title">Carta del día <span style="color:var(--text3);font-size:12px;font-weight:400">(${_cartaCatalog.length} productos)</span></div>
      <button class="btn" onclick="cartaGoSell()" style="border-color:var(--amber);color:var(--amber)"><i class="ti ti-receipt"></i> Ir a vender</button>
    </div>
    <div class="carta-prod-grid">${grid}</div>
    <div style="margin-top:14px"><button class="btn success" onclick="cartaOpenAddProduct()"><i class="ti ti-plus"></i> Agregar producto</button></div>
  `;
}

/* ── Cargar logo local ── */
function cartaLoadLogo(e) {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 500000) { showToast('El logo no debe superar 500 KB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = ev => { cartaSaveLogo(ev.target.result); renderCarta(); showToast('Logo actualizado'); };
  reader.readAsDataURL(file);
}

/* ── Modal configuración ── */
function cartaOpenSettings() {
  document.getElementById('modal-title').textContent = 'Configuración de Carta del día';
  document.getElementById('modal-body').innerHTML = `
    <div class="field">
      <label>Texto del sello (aparece en los comprobantes)</label>
      <input type="text" id="cfg-seal" placeholder="Ej: Autorizado por Juan Pérez · Gracias por su compra" value="${esc(_cartaSealText)}">
      <div class="field-hint">Opcional. Puede ser el nombre del dueño, un mensaje o cualquier texto.</div>
    </div>
    <div class="field-toggle" style="margin-top:4px">
      <div><div class="field-toggle-label">Formato de hora 12h (AM/PM)</div><div class="field-toggle-sub">Desactiva para usar formato 24h</div></div>
      <label class="switch"><input type="checkbox" id="cfg-12h" ${_cartaUse12h?'checked':''} onchange="cartaSave12h(this.checked)"><span class="switch-slider"></span></label>
    </div>
    ${_cartaBusinessLogo ? `<div class="field"><button class="btn" onclick="cartaSaveLogo(null);closeModal();renderCarta();" style="border-color:var(--red);color:var(--red-text)"><i class="ti ti-trash"></i> Eliminar logo</button></div>` : ''}
  `;
  document.getElementById('modal-confirm').onclick = () => {
    cartaSaveSeal(document.getElementById('cfg-seal').value.trim());
    closeModal(); showToast('Configuración guardada');
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}

/* ── Modal Exportar/Importar (catálogo y ventas — diferenciado del export global) ── */
function cartaOpenDataMenu() {
  document.getElementById('modal-title').textContent = 'Exportar / importar — Carta del día';
  document.getElementById('modal-body').innerHTML = `
    <div class="field-hint" style="margin-bottom:16px;line-height:1.6">
      Esto es independiente de la base de datos general de FinFlow. Aquí exportas o
      importas <b style="color:var(--text)">solo</b> el catálogo de productos de Carta
      del día, o el historial de ventas registradas hoy.
    </div>
    <div class="section-title" style="font-size:12px;margin-bottom:8px">Catálogo de productos</div>
    <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">
      <button class="btn success" onclick="cartaExportCatalogCsv()" ${_cartaCatalog.length?'':'disabled'}><i class="ti ti-download"></i> Exportar catálogo (CSV)</button>
      <button class="btn" onclick="document.getElementById('carta-import-catalog-input').click()"><i class="ti ti-upload"></i> Importar catálogo (CSV)</button>
      <input type="file" id="carta-import-catalog-input" accept=".csv" style="display:none" onchange="cartaImportCatalogCsv(event)">
    </div>
    <div class="section-title" style="font-size:12px;margin-bottom:8px">Ventas de hoy</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn success" onclick="cartaExportSalesCsv()" ${_cartaDaySales.length?'':'disabled'}><i class="ti ti-download"></i> Exportar ventas de hoy (CSV)</button>
    </div>
    <div class="field-hint" style="margin-top:14px">El catálogo importado <b style="color:var(--text2)">reemplaza</b> al actual. Las ventas de hoy solo se pueden exportar (son tu registro, no se importan).</div>
  `;
  document.getElementById('modal-confirm').textContent = 'Cerrar';
  document.getElementById('modal-confirm').onclick = closeModal;
  document.querySelector('.btn-cancel').style.display = 'none';
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function cartaExportCatalogCsv() {
  if (!_cartaCatalog.length) { showToast('No hay productos en el catálogo', 'error'); return; }
  const header = ['nombre','precio','costo','emoji'];
  const lines = [header.join(',')].concat(
    _cartaCatalog.map(p => [p.name, p.price, p.cost||0, p.emoji||''].map(cartaCsvEscape).join(','))
  );
  cartaDownloadTextFile(`carta_catalogo_${cartaTodayKey()}.csv`, lines.join('\n'));
  showToast('Catálogo exportado');
}
function cartaExportSalesCsv() {
  if (!_cartaDaySales.length) { showToast('Sin ventas registradas hoy', 'error'); return; }
  const header = ['fecha','hora','sesion','producto','cantidad','precio_unitario','subtotal'];
  const lines = [header.join(',')];
  _cartaDaySales.forEach(sale => {
    sale.items.forEach(item => {
      lines.push([sale.date, sale.time, sale.sessionLabel||'', item.name, item.qty, item.price, (item.price*item.qty).toFixed(2)].map(cartaCsvEscape).join(','));
    });
  });
  cartaDownloadTextFile(`carta_ventas_${cartaTodayKey()}.csv`, lines.join('\n'));
  showToast('Ventas del día exportadas');
}
function cartaImportCatalogCsv(e) {
  const file = e.target.files[0]; if (!file) return;
  e.target.value = '';
  const doImport = () => {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const rows = cartaParseCsv(String(ev.target.result));
        if (!rows.length) { showToast('El archivo está vacío', 'error'); return; }
        const header = rows[0].map(h => h.trim().toLowerCase());
        const iName = header.indexOf('nombre'), iPrice = header.indexOf('precio'), iCost = header.indexOf('costo'), iEmoji = header.indexOf('emoji');
        if (iName === -1 || iPrice === -1) { showToast('CSV inválido: faltan columnas "nombre" y/o "precio"', 'error'); return; }
        const imported = rows.slice(1).filter(r => r[iName] && r[iName].trim()).map(r => ({
          id: uid(),
          name: r[iName].trim(),
          price: parseFloat(r[iPrice]) || 0,
          cost: iCost > -1 ? (parseFloat(r[iCost]) || 0) : 0,
          emoji: iEmoji > -1 ? (r[iEmoji] || '🏷️') : '🏷️'
        }));
        if (!imported.length) { showToast('No se encontraron productos válidos en el archivo', 'error'); return; }
        _cartaCatalog = imported;
        cartaSaveCatalog();
        closeModal();
        showToast(`Catálogo importado: ${imported.length} productos`);
        renderCarta();
      } catch (err) { showToast('No se pudo leer el archivo CSV', 'error'); }
    };
    reader.readAsText(file, 'utf-8');
  };
  if (_cartaCatalog.length) {
    confirmDialog({
      title: 'Reemplazar catálogo',
      message: 'Importar reemplazará todos los productos actuales de Carta del día por los del archivo. ¿Continuar?',
      confirmLabel: 'Sí, reemplazar',
      onConfirm: doImport
    });
  } else { doImport(); }
}

/* ── Modal Agregar/Editar producto ── */
function cartaOpenAddProduct(editId) {
  const ex = editId ? _cartaCatalog.find(p => p.id === editId) : null;
  const emojiOpts = CARTA_EMOJIS.map(e =>
    `<button type="button" class="carta-emoji-btn ${(ex?.emoji||'🏷️')===e?'sel':''}" onclick="cartaPickEmoji(this,'${e}')">${e}</button>`
  ).join('');
  document.getElementById('modal-title').textContent = editId ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('modal-body').innerHTML = `
    <input type="hidden" id="carta-edit-id" value="${editId||''}">
    <input type="hidden" id="carta-chosen-emoji" value="${ex?.emoji||'🏷️'}">
    <div class="field"><label>Nombre del producto</label>
      <input type="text" id="carta-f-name" placeholder="Ej: Cerveza, Camiseta talla M, Pizza..." value="${esc(ex?.name||'')}" autocomplete="off"></div>
    <div class="field-row">
      <div class="field"><label>Precio de venta</label>
        <input type="number" id="carta-f-price" placeholder="0.00" min="0" step="0.01" value="${ex?.price||''}"></div>
      <div class="field"><label>Costo (opcional)</label>
        <input type="number" id="carta-f-cost" placeholder="0.00" min="0" step="0.01" value="${ex?.cost||''}">
        <div class="field-hint">Para calcular ganancias</div></div>
    </div>
    <div class="field"><label>Ícono</label><div class="carta-emoji-grid">${emojiOpts}</div></div>
  `;
  document.getElementById('modal-confirm').onclick = cartaSaveProduct;
  document.getElementById('modal-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('carta-f-name')?.focus(), 80);
}
function cartaPickEmoji(btn, e) {
  document.querySelectorAll('.carta-emoji-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  document.getElementById('carta-chosen-emoji').value = e;
}
function cartaSaveProduct() {
  const name  = document.getElementById('carta-f-name').value.trim();
  const price = parseFloat(document.getElementById('carta-f-price').value);
  const cost  = parseFloat(document.getElementById('carta-f-cost').value) || 0;
  const emoji = document.getElementById('carta-chosen-emoji').value || '🏷️';
  const editId = document.getElementById('carta-edit-id').value;
  if (!name)  { showToast('Escribe el nombre del producto', 'error'); return; }
  if (!price || price <= 0) { showToast('El precio es obligatorio', 'error'); return; }
  if (editId) { const p = _cartaCatalog.find(x => x.id === editId); if (p) Object.assign(p, {name,price,cost,emoji}); }
  else _cartaCatalog.push({ id: uid(), name, price, cost, emoji });
  cartaSaveCatalog(); closeModal(); showToast(editId ? 'Producto actualizado' : 'Producto agregado'); renderCarta();
}
function cartaDeleteProduct(id) {
  const p = _cartaCatalog.find(x => x.id === id);
  confirmDialog({ title:'Eliminar producto', message:`¿Eliminar "${esc(p?.name||'')}"?`, confirmLabel:'Eliminar',
    onConfirm: () => { _cartaCatalog = _cartaCatalog.filter(x => x.id !== id); cartaSaveCatalog(); showToast('Eliminado'); renderCarta(); }
  });
}

/* ============================================================
   VISTA 2: VENTA TÁCTIL CON SESIONES MÚLTIPLES
   ============================================================ */
function cartaGoSell() { _cartaView = 'sell'; renderCarta(); }
function cartaGoBack() { _cartaView = 'catalog'; renderCarta(); }

function renderCartaSell() {
  const session = cartaActiveSession();
  const cart    = cartaCartOf(session);
  const total   = cartaCartTotal(cart);
  const count   = cartaCartCount(cart);

  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn" onclick="cartaGoBack()"><i class="ti ti-arrow-left"></i> Carta del día</button>
    <button class="btn" onclick="cartaNewSession()" style="border-color:var(--green);color:var(--green)"><i class="ti ti-plus"></i> Nueva sesión</button>
    <button class="btn" onclick="cartaClearCart()" style="border-color:var(--red);color:var(--red-text)"><i class="ti ti-trash"></i> Limpiar</button>
  `;

  /* Tabs de sesiones */
  const sessionTabs = _cartaSessions.map(s => `
    <button class="carta-session-tab ${s.id === _cartaActiveSessionId ? 'active' : ''}"
      onclick="cartaSwitchSession('${s.id}')">
      ${esc(s.label)}
      ${_cartaSessions.length > 1 ? `<span class="carta-session-close" onclick="event.stopPropagation();cartaCloseSession('${s.id}')">×</span>` : ''}
    </button>
  `).join('');

  /* Botones de producto — el precio NO se muestra aquí, solo nombre + emoji + contador */
  const productBtns = _cartaCatalog.map(p => {
    const qty = cart[p.id] || 0;
    return `
      <button class="carta-sell-btn ${qty > 0 ? 'active' : ''}" onclick="cartaAddToCart('${p.id}')" data-id="${p.id}">
        <div class="carta-sell-badge ${qty > 0 ? 'show' : ''}" id="badge-${p.id}">${qty||''}</div>
        <div class="carta-sell-emoji">${p.emoji||'🏷️'}</div>
        <div class="carta-sell-name">${esc(p.name)}</div>
      </button>`;
  }).join('');

  /* Lista del carrito — aquí sí se muestra el precio, es el resumen del pedido */
  const cartHtml = Object.entries(cart).filter(([,q])=>q>0).map(([id,qty])=>{
    const p = _cartaCatalog.find(x => x.id === id); if (!p) return '';
    return `<div class="carta-cart-item">
      <span class="carta-cart-emoji">${p.emoji}</span>
      <span class="carta-cart-name">${esc(p.name)}</span>
      <div class="carta-cart-qty-ctrl">
        <button class="carta-qty-btn minus" onclick="cartaDecrement('${id}')"><i class="ti ti-minus"></i></button>
        <span class="carta-cart-qty">${qty}</span>
        <button class="carta-qty-btn plus"  onclick="cartaIncrement('${id}')"><i class="ti ti-plus"></i></button>
      </div>
      <span class="carta-cart-subtotal">${fmt(p.price*qty)}</span>
    </div>`;
  }).join('');

  document.getElementById('page-body').innerHTML = `
    <!-- Tabs de sesión -->
    <div class="carta-sessions-bar">
      <div class="carta-sessions-tabs">${sessionTabs}</div>
      <div class="carta-session-rename-wrap">
        <input type="text" class="carta-session-rename-input" id="session-name-input"
          value="${esc(session?.label||'')}"
          placeholder="Nombre de la sesión..."
          onchange="cartaRenameSession(this.value)">
      </div>
    </div>

    <div class="carta-sell-wrap">
      <!-- Panel izquierdo: productos -->
      <div class="carta-sell-left">
        <div class="carta-sell-header">
          <i class="ti ti-hand-finger" style="color:var(--amber)"></i>
          <span>Toca para agregar al pedido</span>
          <span style="font-size:11px;color:var(--text3)">— varias veces = más cantidad</span>
        </div>
        <div class="carta-sell-grid">${productBtns}</div>
      </div>

      <!-- Panel derecho: carrito -->
      <div class="carta-sell-right">
        <div class="carta-sell-right-header">
          <i class="ti ti-clipboard-list"></i> ${esc(session?.label||'Pedido')}
        </div>
        <div class="carta-cart-list" id="carta-cart-list">
          ${cartHtml || `<div class="carta-cart-empty"><i class="ti ti-hand-finger"></i><p>Toca los productos para agregar</p></div>`}
        </div>
        <div class="carta-cart-total-row">
          <span class="carta-cart-total-label">TOTAL</span>
          <span class="carta-cart-total-val" id="carta-total-val">${fmt(total)}</span>
        </div>
        <button class="carta-confirm-btn ${count>0?'':'disabled'}" id="carta-confirm-btn"
          onclick="${count>0?'cartaConfirmSale()':''}">
          <i class="ti ti-receipt"></i>
          ${count>0 ? `Generar factura (${count} ítem${count!==1?'s':''})` : 'Agrega productos'}
        </button>
      </div>
    </div>
  `;
}

/* ── Gestión de sesiones ── */
function cartaNewSession() {
  const n = _cartaSessions.length + 1;
  const s = { id: uid(), label: `Sesión ${n}`, cart: {} };
  _cartaSessions.push(s);
  _cartaActiveSessionId = s.id;
  renderCartaSell();
  setTimeout(() => document.getElementById('session-name-input')?.select(), 100);
}
function cartaSwitchSession(id) {
  _cartaActiveSessionId = id;
  renderCartaSell();
}
function cartaCloseSession(id) {
  if (_cartaSessions.length <= 1) { showToast('Debe haber al menos una sesión', 'info'); return; }
  const s = _cartaSessions.find(x => x.id === id);
  const hasItems = s && Object.values(s.cart).some(q => q > 0);
  const doClose = () => {
    _cartaSessions = _cartaSessions.filter(x => x.id !== id);
    if (_cartaActiveSessionId === id) _cartaActiveSessionId = _cartaSessions[0].id;
    renderCartaSell();
  };
  if (hasItems) {
    confirmDialog({ title:'Cerrar sesión', message:'Esta sesión tiene productos. ¿Cerrarla sin cobrar?', confirmLabel:'Cerrar', onConfirm: doClose });
  } else { doClose(); }
}
function cartaRenameSession(name) {
  const s = cartaActiveSession(); if (s && name.trim()) s.label = name.trim();
}

/* ── Carrito ── */
function cartaAddToCart(id) {
  const s = cartaActiveSession(); if (!s) return;
  s.cart[id] = (s.cart[id] || 0) + 1;
  cartaUpdateSellUI(id, s.cart);
}
function cartaIncrement(id) { const s = cartaActiveSession(); if (!s) return; s.cart[id] = (s.cart[id]||0)+1; cartaUpdateSellUI(id, s.cart); cartaRefreshCartPanel(); }
function cartaDecrement(id) {
  const s = cartaActiveSession(); if (!s) return;
  if (!s.cart[id]) return;
  s.cart[id]--;
  if (s.cart[id] === 0) delete s.cart[id];
  cartaUpdateSellUI(id, s.cart); cartaRefreshCartPanel();
}
function cartaClearCart() { const s = cartaActiveSession(); if (s) s.cart = {}; renderCartaSell(); }

function cartaUpdateSellUI(id, cart) {
  const qty = cart[id] || 0;
  const badge = document.getElementById(`badge-${id}`);
  const btn   = document.querySelector(`[data-id="${id}"]`);
  if (badge) { badge.textContent = qty||''; badge.classList.toggle('show', qty>0); }
  if (btn)   btn.classList.toggle('active', qty>0);
  cartaRefreshCartPanel();
}

function cartaRefreshCartPanel() {
  const s = cartaActiveSession(); if (!s) return;
  const cart = s.cart, total = cartaCartTotal(cart), count = cartaCartCount(cart);
  const cartHtml = Object.entries(cart).filter(([,q])=>q>0).map(([id,qty])=>{
    const p = _cartaCatalog.find(x=>x.id===id); if (!p) return '';
    return `<div class="carta-cart-item">
      <span class="carta-cart-emoji">${p.emoji}</span>
      <span class="carta-cart-name">${esc(p.name)}</span>
      <div class="carta-cart-qty-ctrl">
        <button class="carta-qty-btn minus" onclick="cartaDecrement('${id}')"><i class="ti ti-minus"></i></button>
        <span class="carta-cart-qty">${qty}</span>
        <button class="carta-qty-btn plus"  onclick="cartaIncrement('${id}')"><i class="ti ti-plus"></i></button>
      </div>
      <span class="carta-cart-subtotal">${fmt(p.price*qty)}</span>
    </div>`;
  }).join('');
  const listEl = document.getElementById('carta-cart-list');
  if (listEl) listEl.innerHTML = cartHtml || `<div class="carta-cart-empty"><i class="ti ti-hand-finger"></i><p>Toca los productos para agregar</p></div>`;
  const tEl = document.getElementById('carta-total-val');
  if (tEl) tEl.textContent = fmt(total);
  const btn = document.getElementById('carta-confirm-btn');
  if (btn) {
    if (count > 0) {
      btn.classList.remove('disabled');
      btn.innerHTML = `<i class="ti ti-receipt"></i> Generar factura (${count} ítem${count!==1?'s':''})`;
      btn.onclick = cartaConfirmSale;
    } else {
      btn.classList.add('disabled');
      btn.innerHTML = `<i class="ti ti-receipt"></i> Agrega productos`;
      btn.onclick = null;
    }
  }
}

/* ============================================================
   CONFIRMAR VENTA / GENERAR FACTURA
   ============================================================ */
function cartaConfirmSale() {
  const s = cartaActiveSession(); if (!s) return;
  const items = Object.entries(s.cart).filter(([,q])=>q>0).map(([id,qty])=>{
    const p = _cartaCatalog.find(x=>x.id===id);
    return { id, name:p.name, emoji:p.emoji, price:p.price, cost:p.cost||0, qty };
  });
  if (!items.length) return;
  const total = items.reduce((a,i)=>a+i.price*i.qty, 0);
  const now   = new Date();
  const sale  = {
    id:uid(), sessionLabel: s.label, items, total,
    time: cartaFmtTime(now),
    date: now.toLocaleDateString('es',{day:'2-digit',month:'2-digit',year:'numeric'}),
    dateISO: now.toISOString()
  };
  _cartaDaySales.push(sale);
  cartaSaveDaySales();
  // Registrar en state
  state.transactions.push({
    id:sale.id, module:'business', type:'income', amount:total,
    date:now.toISOString().slice(0,10),
    desc:`Venta${s.label ? ' — '+s.label : ''} (${items.length} prod.)`,
    category:'Venta de productos', notes:'__carta__',
    accountId:state.activeAccount, linkInv:false, invId:null, invQty:0
  });
  scheduleAutosave();
  // Limpiar carrito de esta sesión
  s.cart = {};
  _cartaLastSale = sale;
  _cartaView = 'invoice';
  renderCarta();
}

/* ============================================================
   VISTA 3: COMPROBANTE / TICKET
   ============================================================ */
function renderCartaInvoice(sale) {
  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn" onclick="cartaGoSell()"><i class="ti ti-arrow-left"></i> Volver a vender</button>
    <button class="btn" onclick="cartaGoBack()"><i class="ti ti-apps"></i> Carta del día</button>
    <button class="btn success" onclick="cartaDownloadInvoice()"><i class="ti ti-download"></i> Descargar</button>
  `;

  const itemRows = sale.items.map(item => `
    <tr class="inv-item-row">
      <td class="inv-item-emoji">${item.emoji}</td>
      <td class="inv-item-name">${esc(item.name)}</td>
      <td class="inv-item-qty">× ${item.qty}</td>
      <td class="inv-item-price">${fmt(item.price)}</td>
      <td class="inv-item-sub">${fmt(item.price*item.qty)}</td>
    </tr>
  `).join('');

  /* Logo */
  const logoHtml = _cartaBusinessLogo
    ? `<img src="${_cartaBusinessLogo}" class="carta-inv-logo-img" alt="Logo">`
    : `<div class="carta-inv-icon-circle"><i class="ti ti-receipt"></i></div>`;

  /* Sello tornasol */
  const sealHtml = _cartaSealText ? `
    <div class="carta-inv-seal">
      <div class="carta-inv-seal-inner">
        <div class="carta-inv-seal-ring"></div>
        <div class="carta-inv-seal-text">${esc(_cartaSealText)}</div>
      </div>
    </div>
  ` : '';

  /* Número de referencia legible: últimos 6 alfanuméricos del id SIN # */
  const refNum = sale.id.replace(/[^a-zA-Z0-9]/g,'').slice(-6).toUpperCase();

  document.getElementById('page-body').innerHTML = `
    <div class="carta-invoice-wrap">
      <div id="carta-invoice-card" class="carta-invoice-card">

        <!-- Banda holográfica superior -->
        <div class="carta-inv-holo-band"></div>

        <!-- Header -->
        <div class="carta-inv-header">
          <div class="carta-inv-logo-row">
            ${logoHtml}
            <div class="carta-inv-biz-info">
              <div class="carta-inv-biz-name">${esc(_cartaBusinessName || 'Mi Negocio')}</div>
              <div class="carta-inv-sub">Comprobante de venta</div>
            </div>
          </div>
          <div class="carta-inv-meta-row">
            <div class="carta-inv-meta-item"><i class="ti ti-calendar"></i> ${sale.date}</div>
            <div class="carta-inv-meta-item"><i class="ti ti-clock"></i> ${sale.time}</div>
            ${sale.sessionLabel ? `<div class="carta-inv-meta-item"><i class="ti ti-armchair"></i> ${esc(sale.sessionLabel)}</div>` : ''}
            <div class="carta-inv-meta-item"><i class="ti ti-hash"></i> REF-${refNum}</div>
          </div>
        </div>

        <!-- Línea decorativa perforada -->
        <div class="carta-inv-perforation"></div>

        <!-- Ítems -->
        <div class="carta-inv-body">
          <table class="carta-inv-table">
            <thead><tr><th></th><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>

        <!-- Línea decorativa perforada -->
        <div class="carta-inv-perforation"></div>

        <!-- Total -->
        <div class="carta-inv-footer">
          <div class="carta-inv-total-row">
            <span class="carta-inv-total-label">TOTAL</span>
            <span class="carta-inv-total-val">${fmt(sale.total)}</span>
          </div>
          <div class="carta-inv-divider-gold"></div>
          <div class="carta-inv-thanks">¡Gracias por su preferencia!</div>
          ${sealHtml}
          <div class="carta-inv-powered">Generado con FinFlow 2.0 — Carta del día</div>
        </div>

        <!-- Banda holográfica inferior -->
        <div class="carta-inv-holo-band bottom"></div>
      </div>

      <div class="carta-invoice-actions">
        <button class="w-btn primary" onclick="cartaDownloadInvoice()"><i class="ti ti-download"></i> Descargar imagen</button>
        <button class="w-btn secondary" onclick="cartaGoSell()"><i class="ti ti-plus"></i> Nueva venta</button>
        <button class="w-btn secondary" onclick="cartaGoBack()"><i class="ti ti-apps"></i> Carta del día</button>
      </div>
    </div>
  `;
}

/* ── Descarga de factura ── */
async function cartaDownloadInvoice() {
  const card = document.getElementById('carta-invoice-card'); if (!card) return;
  if (typeof html2canvas === 'undefined') {
    showToast('Usa Ctrl+P → Guardar como PDF para exportar', 'info'); return;
  }
  showToast('Generando imagen...', 'info');
  try {
    const canvas = await html2canvas(card, { backgroundColor:'#13111A', scale:2.5, useCORS:true, logging:false });
    const link = document.createElement('a');
    link.download = `comprobante_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Comprobante descargado');
  } catch(e) { showToast('Usa Ctrl+P para guardar como PDF', 'info'); }
}

/* ============================================================
   MODAL: GANANCIAS DEL DÍA
   ============================================================ */
function cartaShowProfit() {
  if (!_cartaDaySales.length) { showToast('Sin ventas registradas hoy', 'info'); return; }
  let rev = 0, cost = 0, missing = [];
  const pTotals = {};
  _cartaDaySales.forEach(sale => sale.items.forEach(item => {
    rev += item.price * item.qty;
    if (item.cost > 0) cost += item.cost * item.qty;
    else if (!missing.some(m => m.id === item.id)) missing.push({ id:item.id, name:item.name, emoji:item.emoji });
    if (!pTotals[item.name]) pTotals[item.name] = { emoji:item.emoji, qty:0, rev:0 };
    pTotals[item.name].qty += item.qty;
    pTotals[item.name].rev += item.price * item.qty;
  }));
  const profit = rev - cost;
  const rows = Object.entries(pTotals).sort((a,b)=>b[1].rev-a[1].rev)
    .map(([n,d])=>`<div class="carta-profit-row"><span>${d.emoji} ${esc(n)} × ${d.qty}</span><span style="color:var(--green);font-family:var(--mono)">${fmt(d.rev)}</span></div>`).join('');

  const missingHtml = missing.length ? `
    <div class="carta-profit-warning">
      <i class="ti ti-alert-triangle" style="color:var(--amber)"></i>
      <div style="flex:1">
        <b style="color:var(--amber-text)">Resultado parcial</b><br>
        <span style="font-size:12px;color:var(--text3)">Faltan costos para calcular la ganancia exacta de estos productos. Ingrésalos aquí mismo:</span>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
          ${missing.map(m => `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="flex:1;font-size:12px">${m.emoji} ${esc(m.name)}</span>
              <input type="number" min="0" step="0.01" placeholder="Costo unitario" id="carta-missing-cost-${m.id}" style="width:120px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;color:var(--text);font-family:var(--font);font-size:12px">
            </div>
          `).join('')}
        </div>
        <button class="btn success" style="margin-top:10px;font-size:11px;padding:7px 12px" onclick="cartaSaveMissingCosts(${JSON.stringify(missing.map(m=>m.id)).replace(/"/g,'&quot;')})"><i class="ti ti-check"></i> Guardar costos y recalcular</button>
      </div>
    </div>
  ` : '';

  document.getElementById('modal-title').textContent = 'Ganancias del día';
  document.getElementById('modal-body').innerHTML = `
    <div class="carta-profit-stats">
      <div class="carta-profit-stat green"><div class="carta-profit-stat-val">${fmt(rev)}</div><div class="carta-profit-stat-label">Ingresos</div></div>
      <div class="carta-profit-stat red"><div class="carta-profit-stat-val">${fmt(cost)}</div><div class="carta-profit-stat-label">Costos</div></div>
      <div class="carta-profit-stat ${profit>=0?'amber':'red'}"><div class="carta-profit-stat-val">${fmt(profit)}</div><div class="carta-profit-stat-label">Ganancia neta</div></div>
    </div>
    ${missingHtml}
    <div class="section-title" style="margin:14px 0 8px;font-size:12px">Top productos de hoy</div>
    <div class="carta-profit-list">${rows}</div>
    <div class="carta-profit-footer">${_cartaDaySales.length} venta${_cartaDaySales.length!==1?'s':''} registradas hoy</div>
  `;
  document.getElementById('modal-confirm').textContent = 'Cerrar';
  document.getElementById('modal-confirm').onclick = closeModal;
  document.querySelector('.btn-cancel').style.display = 'none';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

/* Guarda los costos ingresados en el modal de ganancias directamente en el
   catálogo (sin tener que ir a editar el producto manualmente) y refresca. */
function cartaSaveMissingCosts(ids) {
  let updated = 0;
  ids.forEach(id => {
    const input = document.getElementById(`carta-missing-cost-${id}`);
    if (!input) return;
    const val = parseFloat(input.value);
    if (!val || val <= 0) return;
    const p = _cartaCatalog.find(x => x.id === id);
    if (p) { p.cost = val; updated++; }
  });
  if (updated === 0) { showToast('Ingresa al menos un costo válido', 'error'); return; }
  cartaSaveCatalog();
  document.querySelector('.btn-cancel').style.display = '';
  closeModal();
  showToast(`${updated} costo${updated!==1?'s':''} actualizado${updated!==1?'s':''}`);
  cartaShowProfit();
}
