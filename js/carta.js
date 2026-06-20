/* ============================================================
   FinFlow 2.0 — carta.js  v2
   "Punto de Venta" — POS táctil universal para restaurantes,
   tiendas de ropa, comercios, cualquier negocio.

   NOVEDADES v2:
   - Nombre genérico: "Punto de Venta" en lugar de "Carta del día"
   - Sesiones múltiples simultáneas (Mesa 1, Cliente A, etc.)
   - Emojis ampliados (100+ íconos de producto)
   - Factura tipo ticket con diseño tornasol/dorado
   - Logo cargable localmente (base64, opcional)
   - Sello personalizable con efecto holográfico
   - Hora en formato 12h con opción de configuración
   - Sin código de color feo en el comprobante
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
let _cartaDaySales    = [];

/* ── Claves localStorage ── */
const CK_CATALOG  = 'finflow_carta_catalog';
const CK_BUSINESS = 'finflow_carta_business';
const CK_LOGO     = 'finflow_carta_logo';
const CK_SEAL     = 'finflow_carta_seal';
const CK_12H      = 'finflow_carta_12h';
const CK_SALES    = 'finflow_carta_sales_';

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

/* ── Persistencia ── */
function cartaLoad() {
  try { _cartaCatalog      = JSON.parse(localStorage.getItem(CK_CATALOG)  || '[]'); } catch(e) { _cartaCatalog = []; }
  try { _cartaBusinessName = localStorage.getItem(CK_BUSINESS) || ''; } catch(e) {}
  try { _cartaBusinessLogo = localStorage.getItem(CK_LOGO)     || null; } catch(e) {}
  try { _cartaSealText     = localStorage.getItem(CK_SEAL)     || ''; } catch(e) {}
  try { _cartaUse12h       = localStorage.getItem(CK_12H) !== 'false'; } catch(e) {}
  try { _cartaDaySales     = JSON.parse(localStorage.getItem(CK_SALES + getThisMonth().replace('-','')) || '[]'); } catch(e) { _cartaDaySales = []; }
}
function cartaSaveCatalog()  { try { localStorage.setItem(CK_CATALOG, JSON.stringify(_cartaCatalog)); } catch(e) {} }
function cartaSaveBusiness(n){ _cartaBusinessName = n; try { localStorage.setItem(CK_BUSINESS, n); } catch(e) {} }
function cartaSaveSeal(t)    { _cartaSealText = t;     try { localStorage.setItem(CK_SEAL, t); } catch(e) {} }
function cartaSaveLogo(b64)  { _cartaBusinessLogo = b64; try { localStorage.setItem(CK_LOGO, b64||''); } catch(e) {} }
function cartaSave12h(v)     { _cartaUse12h = v; try { localStorage.setItem(CK_12H, v?'true':'false'); } catch(e) {} }
function cartaSaveDaySales() { try { localStorage.setItem(CK_SALES + getThisMonth().replace('-',''), JSON.stringify(_cartaDaySales)); } catch(e) {} }

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
    <button class="btn" onclick="cartaShowProfit()" style="border-color:var(--purple);color:var(--purple)"><i class="ti ti-coin"></i> Ganancias</button>
    <button class="btn" onclick="cartaOpenSettings()" style="border-color:var(--border2);color:var(--text3)"><i class="ti ti-settings"></i></button>
  `;

  const totalDayRevenue = _cartaDaySales.reduce((a, s) => a + s.total, 0);
  const statsRow = _cartaDaySales.length ? `
    <div class="carta-day-stats">
      <div class="carta-stat"><span class="carta-stat-val green">${_cartaDaySales.length}</span><span class="carta-stat-label">ventas hoy</span></div>
      <div class="carta-stat"><span class="carta-stat-val amber">${fmt(totalDayRevenue)}</span><span class="carta-stat-label">total del día</span></div>
      <button class="btn" onclick="cartaShowProfit()" style="border-color:var(--purple);color:var(--purple);font-size:11px;padding:6px 10px;margin-left:auto"><i class="ti ti-chart-line"></i> Ver ganancias</button>
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
        <h3>Agrega tus productos al catálogo</h3>
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
      <div class="section-title">Catálogo <span style="color:var(--text3);font-size:12px;font-weight:400">(${_cartaCatalog.length} productos)</span></div>
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
  document.getElementById('modal-title').textContent = 'Configuración del punto de venta';
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
    <button class="btn" onclick="cartaGoBack()"><i class="ti ti-arrow-left"></i> Catálogo</button>
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

  /* Botones de producto */
  const productBtns = _cartaCatalog.map(p => {
    const qty = cart[p.id] || 0;
    return `
      <button class="carta-sell-btn ${qty > 0 ? 'active' : ''}" onclick="cartaAddToCart('${p.id}')" data-id="${p.id}">
        <div class="carta-sell-badge ${qty > 0 ? 'show' : ''}" id="badge-${p.id}">${qty||''}</div>
        <div class="carta-sell-emoji">${p.emoji||'🏷️'}</div>
        <div class="carta-sell-name">${esc(p.name)}</div>
        <div class="carta-sell-price">${fmt(p.price)}</div>
      </button>`;
  }).join('');

  /* Lista del carrito */
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
          ${count>0 ? `Confirmar (${count} ítem${count!==1?'s':''})` : 'Agrega productos'}
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
      btn.innerHTML = `<i class="ti ti-receipt"></i> Confirmar (${count} ítem${count!==1?'s':''})`;
      btn.onclick = cartaConfirmSale;
    } else {
      btn.classList.add('disabled');
      btn.innerHTML = `<i class="ti ti-receipt"></i> Agrega productos`;
      btn.onclick = null;
    }
  }
}

/* ============================================================
   CONFIRMAR VENTA
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
    <button class="btn" onclick="cartaGoBack()"><i class="ti ti-apps"></i> Catálogo</button>
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
          <div class="carta-inv-powered">Generado con FinFlow 2.0</div>
        </div>

        <!-- Banda holográfica inferior -->
        <div class="carta-inv-holo-band bottom"></div>
      </div>

      <div class="carta-invoice-actions">
        <button class="w-btn primary" onclick="cartaDownloadInvoice()"><i class="ti ti-download"></i> Descargar imagen</button>
        <button class="w-btn secondary" onclick="cartaGoSell()"><i class="ti ti-plus"></i> Nueva venta</button>
        <button class="w-btn secondary" onclick="cartaGoBack()"><i class="ti ti-apps"></i> Catálogo</button>
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
  if (!_cartaDaySales.length) { showToast('Sin ventas registradas aún', 'info'); return; }
  let rev = 0, cost = 0, missing = [];
  const pTotals = {};
  _cartaDaySales.forEach(sale => sale.items.forEach(item => {
    rev += item.price * item.qty;
    if (item.cost > 0) cost += item.cost * item.qty;
    else if (!missing.includes(item.name)) missing.push(item.name);
    if (!pTotals[item.name]) pTotals[item.name] = { emoji:item.emoji, qty:0, rev:0 };
    pTotals[item.name].qty += item.qty;
    pTotals[item.name].rev += item.price * item.qty;
  }));
  const profit = rev - cost;
  const rows = Object.entries(pTotals).sort((a,b)=>b[1].rev-a[1].rev)
    .map(([n,d])=>`<div class="carta-profit-row"><span>${d.emoji} ${esc(n)} × ${d.qty}</span><span style="color:var(--green);font-family:var(--mono)">${fmt(d.rev)}</span></div>`).join('');
  document.getElementById('modal-title').textContent = 'Ganancias del día';
  document.getElementById('modal-body').innerHTML = `
    <div class="carta-profit-stats">
      <div class="carta-profit-stat green"><div class="carta-profit-stat-val">${fmt(rev)}</div><div class="carta-profit-stat-label">Ingresos</div></div>
      <div class="carta-profit-stat red"><div class="carta-profit-stat-val">${fmt(cost)}</div><div class="carta-profit-stat-label">Costos</div></div>
      <div class="carta-profit-stat ${profit>=0?'amber':'red'}"><div class="carta-profit-stat-val">${fmt(profit)}</div><div class="carta-profit-stat-label">Ganancia neta</div></div>
    </div>
    ${missing.length ? `<div class="carta-profit-warning"><i class="ti ti-alert-triangle" style="color:var(--amber)"></i><div><b style="color:var(--amber-text)">Resultado parcial</b><br><span style="font-size:12px;color:var(--text3)">Sin costo registrado: <b style="color:var(--text2)">${missing.join(', ')}</b>. Edítalos en el catálogo.</span></div></div>` : ''}
    <div class="section-title" style="margin:14px 0 8px;font-size:12px">Top productos</div>
    <div class="carta-profit-list">${rows}</div>
    <div class="carta-profit-footer">${_cartaDaySales.length} venta${_cartaDaySales.length!==1?'s':''} registradas hoy</div>
  `;
  document.getElementById('modal-confirm').textContent = 'Cerrar';
  document.getElementById('modal-confirm').onclick = closeModal;
  document.querySelector('.btn-cancel').style.display = 'none';
  document.getElementById('modal-overlay').classList.remove('hidden');
}
