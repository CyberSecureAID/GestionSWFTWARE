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
    ${inv.length?`<div class="inv-grid">${inv.map(invCard).join('')}</div>`:moduleEmptyState({icon:'ti-package',title:'Agrega tu primer producto',text:'Aquí controlarás el stock de lo que vendes. Empieza agregando tu primer artículo al inventario.',btn:'Agregar producto',onclick:'openInvModal()'})}
  `;
}

function invCard(item){
  const low=Number(item.stock)<=Number(item.minStock||0);
  return `<div class="inv-card">
    <div class="inv-card-menu">${actionMenu('inv-'+item.id,[
      {label:'Editar',icon:'ti-pencil',onclick:`editInv('${item.id}')`},
      {label:'Eliminar',icon:'ti-trash',onclick:`deleteInv('${item.id}')`,danger:true}
    ])}</div>
    <div class="inv-name">${esc(item.name)}</div>
    <div class="inv-stock ${low?'low':'ok'}">${item.stock}<span style="font-size:12px;font-weight:400;color:var(--text3);margin-left:4px">${esc(item.unit||'uds')}</span></div>
    <div class="inv-meta">${low?'⚠ Stock bajo':'Stock OK'} · Mín: ${item.minStock||0}</div>
    <div class="inv-price">${fmt(item.price||0)} / ${esc(item.unit||'ud')}</div>
  </div>`;
}

/* ---------- Modal: Inventario (crear / editar) ---------- */
function openInvModal(editId){
  _editingInvId=editId||null;
  const existing=editId?state.inventory.find(i=>i.id===editId):null;
  document.getElementById('modal-title').textContent=editId?'Editar producto':'Agregar producto';
  document.getElementById('modal-body').innerHTML=`
    <div class="field"><label class="help-row">Nombre del producto ${helpBtn('inv_name')}</label><input type="text" id="f-name" placeholder="Ej: Camiseta talla M" value="${esc(existing?existing.name:'')}"></div>
    <div class="field-row">
      <div class="field"><label class="help-row">Stock actual ${helpBtn('inv_stock')}</label><input type="number" id="f-stock" placeholder="0" min="0" value="${existing?existing.stock:''}"></div>
      <div class="field"><label class="help-row">Stock mínimo ${helpBtn('inv_min')}</label><input type="number" id="f-min" placeholder="0" min="0" value="${existing?existing.minStock:''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label class="help-row">Precio unitario ${helpBtn('inv_price')}</label><input type="number" id="f-price" placeholder="0.00" min="0" step="0.01" value="${existing?existing.price:''}"></div>
      <div class="field"><label class="help-row">Unidad ${helpBtn('inv_unit')}</label><input type="text" id="f-unit" placeholder="uds, kg, lt..." value="${esc(existing?existing.unit:'')}"></div>
    </div>
    <div class="field"><label class="help-row">Descripción (opcional) ${helpBtn('inv_desc')}</label><input type="text" id="f-inv-desc" value="${esc(existing?(existing.desc||''):'')}" placeholder="Detalle adicional"></div>
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
  const item=state.inventory.find(i=>i.id===id);
  const linked=state.transactions.some(t=>t.invId===id&&t.linkInv);
  confirmDialog({
    title:'Eliminar producto',
    message:linked
      ?`"${esc(item?item.name:'')}" tiene movimientos vinculados. Si lo eliminas, esos movimientos quedarán sin vínculo (no se borran). ¿Quieres continuar?`
      :`¿Seguro que quieres eliminar "${esc(item?item.name:'')}"? Esta acción no se puede deshacer.`,
    confirmLabel:'Eliminar',
    onConfirm:()=>{
      state.inventory=state.inventory.filter(i=>i.id!==id);
      state.transactions.forEach(t=>{if(t.invId===id){t.linkInv=false;t.invId=null;}});
      showToast('Eliminado');renderPage();scheduleAutosave();
    }
  });
}
