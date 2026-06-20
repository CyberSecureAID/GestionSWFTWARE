/* ============================================================
   FinFlow 2.0 — inventory.js
   Página Inventario: render, tarjetas de producto y modal de creación/edición/eliminación.
   ============================================================ */

/* ---------- Inventario ---------- */
function renderInventory(){
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="openInvModal()"><i class="ti ti-plus"></i> Agregar producto</button>`;
  const inv=state.inventory;
  document.getElementById('page-body').innerHTML=`
    <div class="metrics">
      <div class="metric-card blue"><div class="metric-label">Productos</div><div class="metric-value blue">${inv.length}</div></div>
      <div class="metric-card amber"><div class="metric-label">Valor total</div><div class="metric-value amber">${fmtShort(inv.reduce((a,i)=>a+Number(i.price||0)*Number(i.stock||0),0))}</div></div>
      <div class="metric-card red"><div class="metric-label">Stock crítico</div><div class="metric-value red">${inv.filter(i=>Number(i.stock)<=Number(i.minStock||0)).length}</div><div class="metric-sub">Bajo mínimo</div></div>
      <div class="metric-card green"><div class="metric-label">Unidades totales</div><div class="metric-value green">${inv.reduce((a,i)=>a+Number(i.stock||0),0)}</div></div>
    </div>
    ${inv.length?`<div class="inv-grid">${inv.map(invCard).join('')}</div>`:'<div class="empty"><i class="ti ti-package"></i><p>Sin productos. Agrega tu primer artículo al inventario.</p></div>'}
  `;
}

function invCard(item){
  const low=Number(item.stock)<=Number(item.minStock||0);
  return `<div class="inv-card">
    <div style="display:flex;align-items:flex-start;justify-content:space-between">
      <div class="inv-name">${item.name}</div>
    </div>
    <div class="inv-stock ${low?'low':'ok'}">${item.stock}<span style="font-size:12px;font-weight:400;color:var(--text3);margin-left:4px">${item.unit||'uds'}</span></div>
    <div class="inv-meta">${low?'⚠ Stock bajo':'Stock OK'} · Mín: ${item.minStock||0}</div>
    <div class="inv-price">${fmt(item.price||0)} / ${item.unit||'ud'}</div>
    <div class="inv-card-actions">
      <button class="icon-btn edit" onclick="editInv('${item.id}')"><i class="ti ti-pencil"></i></button>
      <button class="icon-btn" onclick="deleteInv('${item.id}')"><i class="ti ti-trash"></i></button>
    </div>
  </div>`;
}

/* ---------- Modal: Inventario (crear / editar) ---------- */
function openInvModal(editId){
  _editingInvId=editId||null;
  const existing=editId?state.inventory.find(i=>i.id===editId):null;
  document.getElementById('modal-title').textContent=editId?'Editar producto':'Agregar producto';
  document.getElementById('modal-body').innerHTML=`
    <div class="field"><label class="help-row">Nombre del producto ${helpBtn('inv_name')}</label><input type="text" id="f-name" placeholder="Ej: Camiseta talla M" value="${existing?existing.name.replace(/"/g,'&quot;'):''}"></div>
    <div class="field-row">
      <div class="field"><label class="help-row">Stock actual ${helpBtn('inv_stock')}</label><input type="number" id="f-stock" placeholder="0" min="0" value="${existing?existing.stock:''}"></div>
      <div class="field"><label class="help-row">Stock mínimo ${helpBtn('inv_min')}</label><input type="number" id="f-min" placeholder="0" min="0" value="${existing?existing.minStock:''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label class="help-row">Precio unitario ${helpBtn('inv_price')}</label><input type="number" id="f-price" placeholder="0.00" min="0" step="0.01" value="${existing?existing.price:''}"></div>
      <div class="field"><label class="help-row">Unidad ${helpBtn('inv_unit')}</label><input type="text" id="f-unit" placeholder="uds, kg, lt..." value="${existing?existing.unit:''}"></div>
    </div>
    <div class="field"><label class="help-row">Descripción (opcional) ${helpBtn('inv_desc')}</label><input type="text" id="f-inv-desc" value="${existing?(existing.desc||''):''}" placeholder="Detalle adicional"></div>
  `;
  document.getElementById('modal-confirm').onclick=()=>{
    const name=document.getElementById('f-name').value.trim();
    if(!name){showToast('Ingresa el nombre del producto','error');return;}
    const payload={
      name,
      stock:parseFloat(document.getElementById('f-stock').value)||0,
      minStock:parseFloat(document.getElementById('f-min').value)||0,
      price:parseFloat(document.getElementById('f-price').value)||0,
      unit:document.getElementById('f-unit').value||'uds',
      desc:document.getElementById('f-inv-desc').value
    };
    if(existing){Object.assign(existing,payload);}
    else{state.inventory.push(Object.assign({id:uid()},payload));}
    closeModal();showToast(existing?'Producto actualizado':'Producto agregado');renderPage();scheduleAutosave();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function editInv(id){openInvModal(id);}
function deleteInv(id){
  const linked=state.transactions.some(t=>t.invId===id&&t.linkInv);
  if(linked&&!confirm('Este producto tiene movimientos vinculados. Si lo eliminas, esos movimientos quedarán sin vínculo (no se borran). ¿Continuar?'))return;
  state.inventory=state.inventory.filter(i=>i.id!==id);
  state.transactions.forEach(t=>{if(t.invId===id){t.linkInv=false;t.invId=null;}});
  showToast('Eliminado');renderPage();scheduleAutosave();
}
