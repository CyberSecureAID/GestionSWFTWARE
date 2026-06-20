/* ============================================================
   FinFlow 2.0 — transactions.js
   Renderizado de filas de transacción, filtro de tabs y modal de transacciones (crear/editar/eliminar).
   ============================================================ */

function txRow(t){
  const isPos=t.type==='income';
  const iconMap={personal:{income:'ti-arrow-down-left',expense:'ti-arrow-up-right'},business:{income:'ti-building-store',expense:'ti-shopping-cart'},purchases:{expense:'ti-truck-delivery'},trade:{income:'ti-trending-up',expense:'ti-trending-down'}};
  const icon=(iconMap[t.module]||{})[t.type]||'ti-circle';
  const modTag={personal:'tag-personal personal',business:'tag-negocio negocio',purchases:'tag-negocio negocio',trade:'tag-trade trade'}[t.module]||'';
  const modLabel={personal:'personal',business:'negocio',purchases:'compras',trade:'trading'}[t.module]||t.module;
  const invTag=t.linkInv?` · <i class="ti ti-link" style="font-size:10px"></i> stock vinculado`:'';
  return `<div class="tx-item">
    <div class="tx-icon ${t.module==='trade'?'trade':isPos?'income':'expense'}"><i class="ti ${icon}"></i></div>
    <div class="tx-info">
      <div class="tx-desc">${t.desc||'Sin descripción'}</div>
      <div class="tx-meta"><span class="tx-tag ${modTag}">${modLabel}</span>${t.category||''}${invTag}</div>
    </div>
    <div>
      <div class="tx-amount ${isPos?'pos':'neg'}">${isPos?'+':'-'}${fmt(t.amount)}</div>
      <div class="tx-date">${t.date||''}</div>
    </div>
    <div class="tx-actions">
      <button class="icon-btn edit" onclick="editTx('${t.id}')"><i class="ti ti-pencil"></i></button>
      <button class="icon-btn" onclick="deleteTx('${t.id}')"><i class="ti ti-trash"></i></button>
    </div>
  </div>`;
}

function filterTx(btn,type,module){
  btn.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const list=document.getElementById(`tx-${module}`);
  const txs=activeTxs(state.transactions).filter(t=>t.module===module&&(type==='all'||t.type===type));
  list.innerHTML=txs.length?[...txs].sort((a,b)=>b.date>a.date?1:-1).map(txRow).join(''):`<div class="empty"><i class="ti ti-inbox"></i><p>Sin resultados</p></div>`;
}

/* ---------- Modal: Transacciones (crear / editar) ---------- */
function openTxModal(module,editId){
  _editingTxId=editId||null;
  const existing=editId?state.transactions.find(t=>t.id===editId):null;
  const isTrade=module==='trade';
  const isBusiness=module==='business';
  const isPurchase=module==='purchases';
  let cats;
  if(isTrade)cats=CATS_TRADE;
  else if(module==='personal')cats=[...CATS_INCOME,...CATS_EXPENSE];
  else if(isBusiness)cats=[...CATS_BUSINESS_SALE,...CATS_BUSINESS_EXP];
  else if(isPurchase)cats=CATS_PURCHASE;
  const today=new Date().toISOString().slice(0,10);
  const showInvLink=(isBusiness||isPurchase)&&state.inventory.length>0;
  const invOptions=state.inventory.map(i=>`<option value="${i.id}">${i.name} (stock: ${i.stock} ${i.unit||'uds'})</option>`).join('');

  document.getElementById('modal-title').textContent=editId?'Editar movimiento':'Registrar movimiento';
  document.getElementById('modal-body').innerHTML=`
    <div class="field"><label class="help-row">Tipo ${helpBtn('tx_type')}</label>
      <select id="f-type">${isTrade?`<option value="income">Ganancia / Ingreso</option><option value="expense">Pérdida / Egreso</option>`:isPurchase?`<option value="expense">Compra (gasto)</option>`:`<option value="income">${isBusiness?'Venta':'Ingreso'}</option><option value="expense">Gasto</option>`}</select>
    </div>
    <div class="field-row">
      <div class="field"><label class="help-row">Monto ${helpBtn('tx_amount')}</label><input type="number" id="f-amount" placeholder="0.00" min="0" step="0.01" value="${existing?existing.amount:''}"></div>
      <div class="field"><label class="help-row">Fecha ${helpBtn('tx_date')}</label><input type="date" id="f-date" value="${existing?existing.date:today}"></div>
    </div>
    <div class="field"><label class="help-row">Descripción ${helpBtn('tx_desc')}</label><input type="text" id="f-desc" placeholder="Ej: Pago de nómina, Compra supermercado..." value="${existing?(existing.desc||'').replace(/"/g,'&quot;'):''}"></div>
    <div class="field"><label class="help-row">Categoría ${helpBtn('tx_category')}</label><select id="f-cat">${cats.map(c=>`<option ${existing&&existing.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
    ${state.accounts.length>1?`<div class="field"><label class="help-row">Cuenta ${helpBtn('tx_account')}</label><select id="f-account">${state.accounts.map(a=>`<option value="${a.id}" ${(existing?existing.accountId:state.activeAccount)===a.id?'selected':''}>${a.name}</option>`).join('')}</select></div>`:''}
    ${showInvLink?`
      <div class="field-toggle">
        <div>
          <div class="field-toggle-label help-row">${isPurchase?'Sumar al stock de un producto':'Descontar stock de un producto'} ${helpBtn(isPurchase?'tx_link_purchase':'tx_link_sale')}</div>
          <div class="field-toggle-sub">${isPurchase?'Esta compra aumentará el inventario del producto elegido':'Esta venta reducirá el inventario del producto elegido'}</div>
        </div>
        <label class="switch"><input type="checkbox" id="f-link-inv" ${existing&&existing.linkInv?'checked':(!existing&&state.settings.linkSalesToInventory&&isBusiness?'checked':'')} onchange="document.getElementById('f-inv-fields').classList.toggle('hidden',!this.checked)"><span class="switch-slider"></span></label>
      </div>
      <div id="f-inv-fields" class="${(existing&&existing.linkInv)||(!existing&&state.settings.linkSalesToInventory&&isBusiness)?'':'hidden'}">
        <div class="field-row">
          <div class="field"><label class="help-row">Producto ${helpBtn('tx_inv_product')}</label><select id="f-inv-product">${invOptions}</select></div>
          <div class="field"><label class="help-row">Cantidad ${helpBtn('tx_inv_qty')}</label><input type="number" id="f-inv-qty" min="1" step="1" value="${existing?existing.invQty||1:1}"></div>
        </div>
      </div>
    `:''}
    <div class="field"><label class="help-row">Notas (opcional) ${helpBtn('tx_notes')}</label><textarea id="f-notes" placeholder="Información adicional...">${existing?(existing.notes||''):''}</textarea></div>
  `;
  if(existing&&showInvLink&&existing.invId){
    setTimeout(()=>{const sel=document.getElementById('f-inv-product');if(sel)sel.value=existing.invId;},0);
  }
  document.getElementById('modal-confirm').onclick=()=>{
    const amount=parseFloat(document.getElementById('f-amount').value);
    if(!amount||amount<=0){showToast('Ingresa un monto válido','error');return;}
    const desc=document.getElementById('f-desc').value;
    const linkInv=showInvLink&&document.getElementById('f-link-inv').checked;
    const invId=linkInv?document.getElementById('f-inv-product').value:null;
    const invQty=linkInv?(parseFloat(document.getElementById('f-inv-qty').value)||1):0;

    if(linkInv&&!invId){showToast('Selecciona un producto para vincular','error');return;}
    if(linkInv&&isBusiness){
      const prod=state.inventory.find(i=>i.id===invId);
      const prevQty=existing&&existing.invId===invId?Number(existing.invQty||0):0;
      const availableStock=Number(prod.stock)+prevQty;
      if(invQty>availableStock){showToast(`Stock insuficiente: solo hay ${availableStock} ${prod.unit||'uds'} disponibles`,'error');return;}
    }

    // revertir efecto de inventario de la transacción anterior si se está editando
    if(existing&&existing.linkInv&&existing.invId){
      const prevProd=state.inventory.find(i=>i.id===existing.invId);
      if(prevProd){
        if(existing.module==='business')prevProd.stock=Number(prevProd.stock)+Number(existing.invQty||0);
        else if(existing.module==='purchases')prevProd.stock=Number(prevProd.stock)-Number(existing.invQty||0);
      }
    }

    const payload={
      module,
      type:document.getElementById('f-type').value,
      amount,date:document.getElementById('f-date').value,
      desc,category:document.getElementById('f-cat').value,
      notes:document.getElementById('f-notes').value,
      accountId:state.accounts.length>1?document.getElementById('f-account').value:state.activeAccount,
      linkInv,invId:invId||null,invQty:linkInv?invQty:0
    };

    if(existing){
      Object.assign(existing,payload);
    }else{
      state.transactions.push(Object.assign({id:uid()},payload));
    }

    // aplicar efecto de inventario nuevo
    if(linkInv&&invId){
      const prod=state.inventory.find(i=>i.id===invId);
      if(prod){
        if(module==='business')prod.stock=Number(prod.stock)-invQty;
        else if(module==='purchases')prod.stock=Number(prod.stock)+invQty;
      }
    }

    closeModal();
    showToast(existing?'Movimiento actualizado':(linkInv?'Movimiento registrado y stock actualizado':'Movimiento registrado'));
    renderPage();scheduleAutosave();
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function editTx(id){
  const t=state.transactions.find(x=>x.id===id);
  if(!t)return;
  openTxModal(t.module,id);
}

function deleteTx(id){
  const t=state.transactions.find(x=>x.id===id);
  if(t&&t.linkInv&&t.invId){
    if(!confirm('Este movimiento está vinculado al inventario. Al eliminarlo se revertirá el efecto de stock. ¿Continuar?'))return;
    const prod=state.inventory.find(i=>i.id===t.invId);
    if(prod){
      if(t.module==='business')prod.stock=Number(prod.stock)+Number(t.invQty||0);
      else if(t.module==='purchases')prod.stock=Number(prod.stock)-Number(t.invQty||0);
    }
  }
  state.transactions=state.transactions.filter(x=>x.id!==id);
  showToast('Eliminado');renderPage();scheduleAutosave();
}
