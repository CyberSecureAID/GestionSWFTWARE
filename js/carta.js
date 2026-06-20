/* ============================================================
   FinFlow 2.0 — carta.js
   "Carta del día" — POS táctil para restaurantes y cualquier negocio.
   
   FLUJO:
   1. Panel "Mis productos" — catálogo persistente (nombre, precio, costo opcional)
   2. Panel "Atender mesa / venta" — carrito táctil con badges de cantidad
   3. Factura descargable como imagen (nombre negocio, fecha, hora)
   4. Resumen "Ver ganancias del día" (requiere costo por producto)
   ============================================================ */

/* ---- Estado local de la carta ---- */
let _cartaCatalog = [];   // [{id, name, price, cost, emoji}]  — persiste en localStorage
let _cartaCart    = {};   // {productId: qty}  — orden actual
let _cartaView    = 'catalog'; // 'catalog' | 'sell' | 'invoice'
let _cartaBusinessName = '';   // nombre del negocio (se edita una vez al día)
let _cartaDaySales = []; // [{items:[{name,price,qty}], total, time}]  — ventas del día

const CARTA_CATALOG_KEY = 'finflow_carta_catalog';
const CARTA_BUSINESS_KEY = 'finflow_carta_business';
const CARTA_SALES_KEY   = 'finflow_carta_sales_';

/* ---- Emojis sugeridos por tipo de producto ---- */
const CARTA_EMOJIS = ['🍺','🍻','🥤','🍹','☕','🧃','🍕','🍔','🌮','🌯','🍣','🍜','🍝','🥗','🍗','🥩','🍖','🍟','🥪','🧆','🍰','🧁','🍩','🍪','🎂','🍮','🛒','📦','👕','👗','🎁','⭐','🏷️','💊','🔑','🛠️','📱','🎮','🧴','🧹','📚'];

/* ---- Persistencia ---- */
function cartaLoadCatalog() {
  try {
    const raw = localStorage.getItem(CARTA_CATALOG_KEY);
    _cartaCatalog = raw ? JSON.parse(raw) : [];
  } catch(e) { _cartaCatalog = []; }
}
function cartaSaveCatalog() {
  try { localStorage.setItem(CARTA_CATALOG_KEY, JSON.stringify(_cartaCatalog)); } catch(e) {}
}
function cartaLoadBusiness() {
  try { _cartaBusinessName = localStorage.getItem(CARTA_BUSINESS_KEY) || ''; } catch(e) {}
}
function cartaSaveBusiness(name) {
  _cartaBusinessName = name;
  try { localStorage.setItem(CARTA_BUSINESS_KEY, name); } catch(e) {}
}
function cartaSalesDayKey() {
  return CARTA_SALES_KEY + getThisMonth().replace('-','');
}
function cartaLoadDaySales() {
  try {
    const raw = localStorage.getItem(cartaSalesDayKey());
    _cartaDaySales = raw ? JSON.parse(raw) : [];
  } catch(e) { _cartaDaySales = []; }
}
function cartaSaveDaySales() {
  try { localStorage.setItem(cartaSalesDayKey(), JSON.stringify(_cartaDaySales)); } catch(e) {}
}

/* ---- Total del carrito actual ---- */
function cartaCartTotal() {
  return Object.entries(_cartaCart).reduce((sum, [id, qty]) => {
    const prod = _cartaCatalog.find(p => p.id === id);
    return sum + (prod ? Number(prod.price) * qty : 0);
  }, 0);
}
function cartaCartCount() {
  return Object.values(_cartaCart).reduce((a, b) => a + b, 0);
}

/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */
function renderCarta() {
  cartaLoadCatalog();
  cartaLoadBusiness();
  cartaLoadDaySales();

  // Toolbar según vista
  const toolbarHtml = _cartaView === 'catalog'
    ? `<button class="btn success" onclick="cartaOpenAddProduct()"><i class="ti ti-plus"></i> Nuevo producto</button>
       <button class="btn" onclick="cartaGoSell()" ${_cartaCatalog.length ? '' : 'disabled'} style="${_cartaCatalog.length ? 'border-color:var(--amber);color:var(--amber)' : ''}"><i class="ti ti-receipt"></i> Iniciar venta</button>
       <button class="btn" onclick="cartaShowProfit()" style="border-color:var(--purple);color:var(--purple)"><i class="ti ti-coin"></i> Ganancias del día</button>`
    : _cartaView === 'sell'
    ? `<button class="btn" onclick="cartaGoBack()"><i class="ti ti-arrow-left"></i> Volver</button>
       <button class="btn" onclick="cartaClearCart()" style="border-color:var(--red);color:var(--red-text)"><i class="ti ti-trash"></i> Limpiar</button>`
    : `<button class="btn" onclick="cartaGoBack()"><i class="ti ti-arrow-left"></i> Volver</button>`;

  document.getElementById('topbar-actions').innerHTML = toolbarHtml;

  if (_cartaView === 'catalog') {
    renderCartaCatalog();
  } else if (_cartaView === 'sell') {
    renderCartaSell();
  }
}

/* ============================================================
   VISTA 1: CATÁLOGO DE PRODUCTOS
   ============================================================ */
function renderCartaCatalog() {
  const body = document.getElementById('page-body');

  // Nombre del negocio (editable)
  const businessRow = `
    <div class="carta-business-row">
      <div class="carta-business-label"><i class="ti ti-building-store"></i> Nombre del negocio</div>
      <div class="carta-business-input-wrap">
        <input
          type="text"
          class="carta-business-input"
          id="carta-biz-name"
          placeholder="Ej: Restaurante El Rincón..."
          value="${esc(_cartaBusinessName)}"
          oninput="cartaSaveBusiness(this.value)"
        >
        <span class="carta-business-hint">Se edita una vez y aparece en todas tus facturas del día</span>
      </div>
    </div>
  `;

  const statsRow = _cartaDaySales.length ? `
    <div class="carta-day-stats">
      <div class="carta-stat"><span class="carta-stat-val green">${_cartaDaySales.length}</span><span class="carta-stat-label">ventas hoy</span></div>
      <div class="carta-stat"><span class="carta-stat-val amber">${fmt(_cartaDaySales.reduce((a,s)=>a+s.total,0))}</span><span class="carta-stat-label">total del día</span></div>
      <button class="btn" onclick="cartaShowProfit()" style="border-color:var(--purple);color:var(--purple);font-size:11px;padding:6px 10px"><i class="ti ti-chart-line"></i> Ver ganancias</button>
    </div>
  ` : '';

  if (_cartaCatalog.length === 0) {
    body.innerHTML = `
      ${businessRow}
      ${statsRow}
      <div class="guide-card" style="margin-top:16px">
        <div class="guide-icon"><i class="ti ti-clipboard-list"></i></div>
        <div class="guide-step-tag">Primer paso</div>
        <h3>Agrega tus productos disponibles hoy</h3>
        <p>Crea la lista de lo que vendes: bebidas, comidas, artículos. Solo tienes que hacerlo una vez — después puedes editarla cuando quieras.</p>
        <button class="w-btn primary" onclick="cartaOpenAddProduct()"><i class="ti ti-plus"></i> Agregar primer producto</button>
      </div>
    `;
    return;
  }

  const grid = _cartaCatalog.map(prod => `
    <div class="carta-prod-card" id="cprod-${prod.id}">
      <div class="carta-prod-emoji">${prod.emoji || '🏷️'}</div>
      <div class="carta-prod-name">${esc(prod.name)}</div>
      <div class="carta-prod-price">${fmt(prod.price)}</div>
      ${prod.cost ? `<div class="carta-prod-cost">Costo: ${fmt(prod.cost)}</div>` : '<div class="carta-prod-cost" style="color:var(--text3)">Sin costo</div>'}
      <div class="carta-prod-actions">
        <button class="carta-prod-btn edit" onclick="cartaEditProduct('${prod.id}')" title="Editar"><i class="ti ti-pencil"></i></button>
        <button class="carta-prod-btn del" onclick="cartaDeleteProduct('${prod.id}')" title="Eliminar"><i class="ti ti-trash"></i></button>
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    ${businessRow}
    ${statsRow}
    <div class="section-header" style="margin-top:${statsRow?'8px':'0'}">
      <div class="section-title">Productos disponibles <span style="color:var(--text3);font-size:12px;font-weight:400">(${_cartaCatalog.length} en catálogo)</span></div>
      <button class="btn success" onclick="cartaGoSell()" style="border-color:var(--amber);color:var(--amber)">
        <i class="ti ti-receipt"></i> Iniciar venta
      </button>
    </div>
    <div class="carta-prod-grid">${grid}</div>
    <div style="margin-top:16px">
      <button class="btn success" onclick="cartaOpenAddProduct()"><i class="ti ti-plus"></i> Agregar producto</button>
    </div>
  `;
}

/* ============================================================
   MODAL: Agregar / Editar producto
   ============================================================ */
function cartaOpenAddProduct(editId) {
  const existing = editId ? _cartaCatalog.find(p => p.id === editId) : null;
  const emojiOpts = CARTA_EMOJIS.map(e =>
    `<button type="button" class="carta-emoji-btn ${(existing?.emoji||'🏷️')===e?'sel':''}" onclick="cartaPickEmoji(this,'${e}')">${e}</button>`
  ).join('');

  document.getElementById('modal-title').textContent = editId ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('modal-body').innerHTML = `
    <input type="hidden" id="carta-edit-id" value="${editId||''}">
    <input type="hidden" id="carta-chosen-emoji" value="${existing?.emoji||'🏷️'}">
    
    <div class="field">
      <label>Nombre del producto</label>
      <input type="text" id="carta-f-name" placeholder="Ej: Cerveza, Pizza Margarita, Camiseta..." value="${esc(existing?.name||'')}" autocomplete="off">
    </div>
    <div class="field-row">
      <div class="field">
        <label>Precio de venta</label>
        <input type="number" id="carta-f-price" placeholder="0.00" min="0" step="0.01" value="${existing?.price||''}">
      </div>
      <div class="field">
        <label>Costo (opcional)</label>
        <input type="number" id="carta-f-cost" placeholder="0.00" min="0" step="0.01" value="${existing?.cost||''}">
        <div class="field-hint">Necesario para calcular ganancias</div>
      </div>
    </div>
    <div class="field">
      <label>Ícono del producto</label>
      <div class="carta-emoji-grid">${emojiOpts}</div>
    </div>
  `;
  document.getElementById('modal-confirm').onclick = cartaSaveProduct;
  document.getElementById('modal-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('carta-f-name').focus(), 100);
}

function cartaPickEmoji(btn, emoji) {
  document.querySelectorAll('.carta-emoji-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  document.getElementById('carta-chosen-emoji').value = emoji;
}

function cartaSaveProduct() {
  const name  = document.getElementById('carta-f-name').value.trim();
  const price = parseFloat(document.getElementById('carta-f-price').value);
  const cost  = parseFloat(document.getElementById('carta-f-cost').value) || 0;
  const emoji = document.getElementById('carta-chosen-emoji').value || '🏷️';
  const editId = document.getElementById('carta-edit-id').value;

  if (!name) { showToast('Escribe el nombre del producto', 'error'); return; }
  if (!price || price <= 0) { showToast('El precio de venta es obligatorio', 'error'); return; }

  if (editId) {
    const prod = _cartaCatalog.find(p => p.id === editId);
    if (prod) Object.assign(prod, { name, price, cost, emoji });
  } else {
    _cartaCatalog.push({ id: uid(), name, price, cost, emoji });
  }
  cartaSaveCatalog();
  closeModal();
  showToast(editId ? 'Producto actualizado' : 'Producto agregado');
  renderCarta();
}

function cartaEditProduct(id) {
  cartaOpenAddProduct(id);
}
function cartaDeleteProduct(id) {
  const prod = _cartaCatalog.find(p => p.id === id);
  confirmDialog({
    title: 'Eliminar producto',
    message: `¿Eliminar "${esc(prod?.name||'')}" del catálogo? No afecta las ventas ya registradas.`,
    confirmLabel: 'Eliminar',
    onConfirm: () => {
      _cartaCatalog = _cartaCatalog.filter(p => p.id !== id);
      delete _cartaCart[id];
      cartaSaveCatalog();
      showToast('Producto eliminado');
      renderCarta();
    }
  });
}

/* ============================================================
   VISTA 2: VENTA TÁCTIL (CARRITO)
   ============================================================ */
function cartaGoSell() {
  _cartaCart = {};
  _cartaView = 'sell';
  renderCarta();
}
function cartaGoBack() {
  _cartaView = 'catalog';
  renderCarta();
}
function cartaClearCart() {
  _cartaCart = {};
  renderCartaSell();
}

function renderCartaSell() {
  const body = document.getElementById('page-body');
  const total = cartaCartTotal();
  const count = cartaCartCount();

  const productBtns = _cartaCatalog.map(prod => {
    const qty = _cartaCart[prod.id] || 0;
    return `
      <button
        class="carta-sell-btn ${qty > 0 ? 'active' : ''}"
        onclick="cartaAddToCart('${prod.id}')"
        data-id="${prod.id}"
      >
        <div class="carta-sell-badge ${qty > 0 ? 'show' : ''}" id="badge-${prod.id}">${qty || ''}</div>
        <div class="carta-sell-emoji">${prod.emoji || '🏷️'}</div>
        <div class="carta-sell-name">${esc(prod.name)}</div>
        <div class="carta-sell-price">${fmt(prod.price)}</div>
      </button>
    `;
  }).join('');

  // Resumen del carrito
  const cartItems = Object.entries(_cartaCart)
    .filter(([,qty]) => qty > 0)
    .map(([id, qty]) => {
      const prod = _cartaCatalog.find(p => p.id === id);
      if (!prod) return '';
      return `
        <div class="carta-cart-item">
          <span class="carta-cart-emoji">${prod.emoji}</span>
          <span class="carta-cart-name">${esc(prod.name)}</span>
          <div class="carta-cart-qty-ctrl">
            <button class="carta-qty-btn minus" onclick="cartaDecrement('${id}')"><i class="ti ti-minus"></i></button>
            <span class="carta-cart-qty">${qty}</span>
            <button class="carta-qty-btn plus" onclick="cartaIncrement('${id}')"><i class="ti ti-plus"></i></button>
          </div>
          <span class="carta-cart-subtotal">${fmt(prod.price * qty)}</span>
        </div>
      `;
    }).join('');

  body.innerHTML = `
    <div class="carta-sell-wrap">

      <!-- Panel izquierdo: botones de productos -->
      <div class="carta-sell-left">
        <div class="carta-sell-header">
          <i class="ti ti-hand-finger" style="color:var(--amber)"></i>
          <span>Toca para agregar</span>
          <span style="font-size:11px;color:var(--text3)">— toca varias veces para más cantidad</span>
        </div>
        <div class="carta-sell-grid">
          ${productBtns}
        </div>
      </div>

      <!-- Panel derecho: resumen del pedido -->
      <div class="carta-sell-right">
        <div class="carta-sell-right-header">
          <i class="ti ti-clipboard-list"></i>
          Pedido actual
        </div>

        <div class="carta-cart-list" id="carta-cart-list">
          ${cartItems || `<div class="carta-cart-empty"><i class="ti ti-hand-finger"></i><p>Toca los productos para agregarlos al pedido</p></div>`}
        </div>

        <div class="carta-cart-total-row">
          <span class="carta-cart-total-label">TOTAL</span>
          <span class="carta-cart-total-val" id="carta-total-val">${fmt(total)}</span>
        </div>

        <button
          class="carta-confirm-btn ${count > 0 ? '' : 'disabled'}"
          onclick="${count > 0 ? 'cartaConfirmSale()' : ''}"
        >
          <i class="ti ti-receipt"></i>
          ${count > 0 ? `Confirmar pedido (${count} ítem${count!==1?'s':''})` : 'Agrega productos al pedido'}
        </button>
      </div>

    </div>
  `;
}

function cartaAddToCart(id) {
  _cartaCart[id] = (_cartaCart[id] || 0) + 1;
  cartaUpdateSellUI(id);
}
function cartaIncrement(id) {
  _cartaCart[id] = (_cartaCart[id] || 0) + 1;
  cartaUpdateSellUI(id);
  cartaRefreshCartPanel();
}
function cartaDecrement(id) {
  if (!_cartaCart[id] || _cartaCart[id] <= 0) return;
  _cartaCart[id]--;
  if (_cartaCart[id] === 0) delete _cartaCart[id];
  cartaUpdateSellUI(id);
  cartaRefreshCartPanel();
}

/* Actualizar solo el badge y estado del botón sin re-renderizar todo */
function cartaUpdateSellUI(id) {
  const qty = _cartaCart[id] || 0;
  const badge = document.getElementById(`badge-${id}`);
  const btn = document.querySelector(`[data-id="${id}"]`);
  if (badge) {
    badge.textContent = qty || '';
    badge.classList.toggle('show', qty > 0);
  }
  if (btn) btn.classList.toggle('active', qty > 0);
  cartaRefreshCartPanel();
}

function cartaRefreshCartPanel() {
  const total = cartaCartTotal();
  const count = cartaCartCount();

  const cartItems = Object.entries(_cartaCart)
    .filter(([,qty]) => qty > 0)
    .map(([id, qty]) => {
      const prod = _cartaCatalog.find(p => p.id === id);
      if (!prod) return '';
      return `
        <div class="carta-cart-item">
          <span class="carta-cart-emoji">${prod.emoji}</span>
          <span class="carta-cart-name">${esc(prod.name)}</span>
          <div class="carta-cart-qty-ctrl">
            <button class="carta-qty-btn minus" onclick="cartaDecrement('${id}')"><i class="ti ti-minus"></i></button>
            <span class="carta-cart-qty">${qty}</span>
            <button class="carta-qty-btn plus" onclick="cartaIncrement('${id}')"><i class="ti ti-plus"></i></button>
          </div>
          <span class="carta-cart-subtotal">${fmt(prod.price * qty)}</span>
        </div>
      `;
    }).join('');

  const listEl = document.getElementById('carta-cart-list');
  if (listEl) {
    listEl.innerHTML = cartItems || `<div class="carta-cart-empty"><i class="ti ti-hand-finger"></i><p>Toca los productos para agregarlos al pedido</p></div>`;
  }
  const totalEl = document.getElementById('carta-total-val');
  if (totalEl) totalEl.textContent = fmt(total);

  const confirmBtn = document.querySelector('.carta-confirm-btn');
  if (confirmBtn) {
    if (count > 0) {
      confirmBtn.classList.remove('disabled');
      confirmBtn.innerHTML = `<i class="ti ti-receipt"></i> Confirmar pedido (${count} ítem${count!==1?'s':''})`;
      confirmBtn.onclick = cartaConfirmSale;
    } else {
      confirmBtn.classList.add('disabled');
      confirmBtn.innerHTML = `<i class="ti ti-receipt"></i> Agrega productos al pedido`;
      confirmBtn.onclick = null;
    }
  }
}

/* ============================================================
   CONFIRMAR VENTA + MOSTRAR FACTURA
   ============================================================ */
function cartaConfirmSale() {
  const items = Object.entries(_cartaCart)
    .filter(([,qty]) => qty > 0)
    .map(([id, qty]) => {
      const prod = _cartaCatalog.find(p => p.id === id);
      return { id, name: prod.name, emoji: prod.emoji, price: prod.price, cost: prod.cost || 0, qty };
    });
  if (!items.length) return;

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const now = new Date();
  const sale = {
    id: uid(),
    items,
    total,
    time: now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    dateISO: now.toISOString()
  };

  _cartaDaySales.push(sale);
  cartaSaveDaySales();

  // También registrar en state.transactions como venta de negocio
  state.transactions.push({
    id: sale.id,
    module: 'business',
    type: 'income',
    amount: total,
    date: now.toISOString().slice(0, 10),
    desc: `Venta — ${items.length} producto${items.length!==1?'s':''}`,
    category: 'Venta de productos',
    notes: '__carta__',
    accountId: state.activeAccount,
    linkInv: false, invId: null, invQty: 0
  });
  scheduleAutosave();

  showCartaInvoice(sale);
}

/* ============================================================
   VISTA 3: FACTURA
   ============================================================ */
function showCartaInvoice(sale) {
  const body = document.getElementById('page-body');
  _cartaView = 'invoice';

  // toolbar
  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn" onclick="cartaNewSale()"><i class="ti ti-plus"></i> Nueva venta</button>
    <button class="btn" onclick="cartaGoToList()"><i class="ti ti-arrow-left"></i> Ir al catálogo</button>
    <button class="btn success" onclick="cartaDownloadInvoice()"><i class="ti ti-download"></i> Descargar factura</button>
  `;

  const itemRows = sale.items.map(item => `
    <tr class="inv-item-row">
      <td class="inv-item-emoji">${item.emoji}</td>
      <td class="inv-item-name">${esc(item.name)}</td>
      <td class="inv-item-qty">× ${item.qty}</td>
      <td class="inv-item-price">${fmt(item.price)}</td>
      <td class="inv-item-sub">${fmt(item.price * item.qty)}</td>
    </tr>
  `).join('');

  body.innerHTML = `
    <div class="carta-invoice-wrap">
      <div id="carta-invoice-card" class="carta-invoice-card">
        <!-- Header de la factura -->
        <div class="carta-inv-header">
          <div class="carta-inv-logo-row">
            <div class="carta-inv-icon"><i class="ti ti-receipt"></i></div>
            <div>
              <div class="carta-inv-biz-name">${esc(_cartaBusinessName || 'Mi Negocio')}</div>
              <div class="carta-inv-sub">Comprobante de venta</div>
            </div>
          </div>
          <div class="carta-inv-meta-row">
            <div class="carta-inv-meta-item"><i class="ti ti-calendar"></i> ${sale.date}</div>
            <div class="carta-inv-meta-item"><i class="ti ti-clock"></i> ${sale.time}</div>
            <div class="carta-inv-meta-item"><i class="ti ti-hash"></i> ${sale.id.slice(-6).toUpperCase()}</div>
          </div>
        </div>

        <!-- Ítems -->
        <div class="carta-inv-body">
          <table class="carta-inv-table">
            <thead>
              <tr>
                <th></th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>

        <!-- Total -->
        <div class="carta-inv-footer">
          <div class="carta-inv-total-row">
            <span class="carta-inv-total-label">TOTAL</span>
            <span class="carta-inv-total-val">${fmt(sale.total)}</span>
          </div>
          <div class="carta-inv-thanks">¡Gracias por su compra!</div>
          <div class="carta-inv-powered">Generado con FinFlow 2.0</div>
        </div>
      </div>

      <div class="carta-invoice-actions">
        <button class="w-btn primary" onclick="cartaDownloadInvoice()">
          <i class="ti ti-download"></i> Descargar como imagen
        </button>
        <button class="w-btn secondary" onclick="cartaNewSale()">
          <i class="ti ti-plus"></i> Nueva venta
        </button>
        <button class="w-btn secondary" onclick="cartaGoToList()">
          <i class="ti ti-apps"></i> Ver catálogo
        </button>
      </div>
    </div>
  `;
}

/* ---- Descargar factura como imagen PNG ---- */
async function cartaDownloadInvoice() {
  const card = document.getElementById('carta-invoice-card');
  if (!card) return;

  // Usar html2canvas si está disponible, fallback a screenshot via canvas manual
  if (typeof html2canvas === 'undefined') {
    // Fallback: usar la API nativa de captura del navegador
    showToast('Preparando descarga...', 'info');
    try {
      await cartaDownloadInvoiceFallback(card);
    } catch(e) {
      showToast('Para descargar la factura, usa la opción "Imprimir" del navegador', 'info');
    }
    return;
  }

  showToast('Generando imagen...', 'info');
  html2canvas(card, {
    backgroundColor: '#1C2128',
    scale: 2,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `factura_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Factura descargada');
  }).catch(() => {
    showToast('Para guardar la factura, usa Ctrl+P e imprime como PDF', 'info');
  });
}

async function cartaDownloadInvoiceFallback(card) {
  // Renderizar la factura en un canvas manualmente
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 2;
  const rect = card.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Fondo
  ctx.fillStyle = '#1C2128';
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Indicación al usuario de usar print
  const link = document.createElement('a');
  link.href = '#';
  link.onclick = (e) => { e.preventDefault(); window.print(); };
  showToast('Usa Ctrl+P → "Guardar como PDF" para descargar la factura', 'info');
}

function cartaNewSale() {
  _cartaCart = {};
  _cartaView = 'sell';
  renderCarta();
}
function cartaGoToList() {
  _cartaCart = {};
  _cartaView = 'catalog';
  renderCarta();
}

/* ============================================================
   MODAL: GANANCIAS DEL DÍA
   ============================================================ */
function cartaShowProfit() {
  cartaLoadDaySales();
  if (!_cartaDaySales.length) {
    showToast('Todavía no hay ventas registradas hoy', 'info');
    return;
  }

  // Calcular ganancias
  let totalRevenue = 0, totalCost = 0, missingCost = [];
  const productTotals = {};

  _cartaDaySales.forEach(sale => {
    sale.items.forEach(item => {
      totalRevenue += item.price * item.qty;
      if (item.cost > 0) {
        totalCost += item.cost * item.qty;
      } else {
        if (!missingCost.includes(item.name)) missingCost.push(item.name);
      }
      const key = item.name;
      if (!productTotals[key]) productTotals[key] = { emoji: item.emoji, qty: 0, revenue: 0, cost: 0, hasCost: item.cost > 0 };
      productTotals[key].qty += item.qty;
      productTotals[key].revenue += item.price * item.qty;
      productTotals[key].cost += item.cost * item.qty;
    });
  });

  const profit = totalRevenue - totalCost;
  const hasMissingCost = missingCost.length > 0;

  const productRows = Object.entries(productTotals)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, data]) => `
      <div class="carta-profit-row">
        <span>${data.emoji} ${esc(name)} × ${data.qty}</span>
        <span style="color:var(--green);font-family:var(--mono)">${fmt(data.revenue)}</span>
      </div>
    `).join('');

  document.getElementById('modal-title').textContent = 'Ganancias del día';
  document.getElementById('modal-body').innerHTML = `
    <div class="carta-profit-stats">
      <div class="carta-profit-stat green">
        <div class="carta-profit-stat-val">${fmt(totalRevenue)}</div>
        <div class="carta-profit-stat-label">Ingresos totales</div>
      </div>
      <div class="carta-profit-stat red">
        <div class="carta-profit-stat-val">${fmt(totalCost)}</div>
        <div class="carta-profit-stat-label">Costo total</div>
      </div>
      <div class="carta-profit-stat ${profit >= 0 ? 'amber' : 'red'}">
        <div class="carta-profit-stat-val">${fmt(profit)}</div>
        <div class="carta-profit-stat-label">Ganancia neta</div>
      </div>
    </div>

    ${hasMissingCost ? `
      <div class="carta-profit-warning">
        <i class="ti ti-alert-triangle" style="color:var(--amber)"></i>
        <div>
          <b style="color:var(--amber-text)">Resultado parcial</b><br>
          <span style="color:var(--text3);font-size:12px">Estos productos no tienen costo registrado, por lo que la ganancia real puede ser menor: <b style="color:var(--text2)">${missingCost.join(', ')}</b>. Edítalos en el catálogo para obtener resultados exactos.</span>
        </div>
      </div>
    ` : ''}

    <div class="section-title" style="margin:16px 0 8px;font-size:12px">Top productos de hoy</div>
    <div class="carta-profit-list">${productRows}</div>

    <div class="carta-profit-footer">
      ${_cartaDaySales.length} venta${_cartaDaySales.length!==1?'s':''} registradas hoy
    </div>
  `;

  document.getElementById('modal-confirm').textContent = 'Cerrar';
  document.getElementById('modal-confirm').onclick = closeModal;
  document.querySelector('.btn-cancel').style.display = 'none';
  document.getElementById('modal-overlay').classList.remove('hidden');
}
