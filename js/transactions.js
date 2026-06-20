/* ============================================================
   FinFlow 2.0 — transactions.js
   Renderizado de filas de transacción, filtro de tabs y wizard de movimientos (crear/editar/eliminar).
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
      <div class="tx-desc">${esc(t.desc)||'Sin descripción'}</div>
      <div class="tx-meta"><span class="tx-tag ${modTag}">${modLabel}</span>${esc(t.category||'')}${invTag}</div>
    </div>
    <div>
      <div class="tx-amount ${isPos?'pos':'neg'}">${isPos?'+':'-'}${fmt(t.amount)}</div>
      <div class="tx-date">${t.date||''}</div>
    </div>
    ${actionMenu('tx-'+t.id,[
      {label:'Editar',icon:'ti-pencil',onclick:`editTx('${t.id}')`},
      {label:'Eliminar',icon:'ti-trash',onclick:`deleteTx('${t.id}')`,danger:true}
    ])}
  </div>`;
}

function filterTx(btn,type,module){
  btn.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const list=document.getElementById(`tx-${module}`);
  const txs=activeTxs(state.transactions).filter(t=>t.module===module&&(type==='all'||t.type===type));
  list.innerHTML=txs.length?[...txs].sort((a,b)=>b.date>a.date?1:-1).map(txRow).join(''):`<div class="empty"><i class="ti ti-inbox"></i><p>Sin resultados</p></div>`;
}

/* ============================================================
   WIZARD de registro de movimiento — 3 pasos simples:
   1) ¿Entró o salió dinero? (elección grande, visual)
   2) ¿Cuánto y cuándo? (monto + descripción + fecha)
   3) Categoría y detalles (categoría, cuenta, inventario, notas)
   Esto reemplaza el formulario de una sola pantalla con 7+ campos.
   ============================================================ */

let _wz={}; // estado temporal del wizard mientras está abierto

function openTxModal(module,editId){
  _editingTxId=editId||null;
  const existing=editId?state.transactions.find(t=>t.id===editId):null;
  const isTrade=module==='trade';
  const isBusiness=module==='business';
  const isPurchase=module==='purchases';
  const today=new Date().toISOString().slice(0,10);

  // Para compras, el tipo siempre es "salió dinero" — no tiene sentido preguntar.
  _wz={
    module,editId,isTrade,isBusiness,isPurchase,
    step:isPurchase?2:1, // las compras se saltan el paso de tipo
    type:isPurchase?'expense':(existing?existing.type:null),
    amount:existing?existing.amount:'',
    date:existing?existing.date:today,
    desc:existing?(existing.desc||''):'',
    category:existing?existing.category:null,
    accountId:existing?existing.accountId:state.activeAccount,
    linkInv:existing?!!existing.linkInv:(!existing&&state.settings.linkSalesToInventory&&isBusiness),
    invId:existing?existing.invId:null,
    invQty:existing?(existing.invQty||1):1,
    notes:existing?(existing.notes||''):''
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
  renderWizardStep();
}

function wizardCats(){
  const {module}=_wz;
  if(module==='trade')return CATS_TRADE;
  if(module==='personal')return _wz.type==='income'?CATS_INCOME:CATS_EXPENSE;
  if(module==='business')return _wz.type==='income'?CATS_BUSINESS_SALE:CATS_BUSINESS_EXP;
  if(module==='purchases')return CATS_PURCHASE;
  return [];
}

function wizardTotalSteps(){return _wz.isPurchase?2:3;}
function wizardStepIndex(){return _wz.isPurchase?_wz.step-1:_wz.step;} // para los puntos de progreso (1-indexado, ignora el paso de tipo en compras)

function renderWizardStep(){
  const total=wizardTotalSteps();
  const idx=wizardStepIndex();
  const dotsHtml=Array.from({length:total},(_,i)=>{
    const n=i+1;
    return `<div class="wizard-step-dot ${n<idx?'done':n===idx?'active':''}"></div>`;
  }).join('');
  document.getElementById('modal-title').textContent=_wz.editId?'Editar movimiento':'Registrar movimiento';
  let stepHtml='';
  if(_wz.step===1)stepHtml=wizardStepType();
  else if(_wz.step===2)stepHtml=wizardStepAmount();
  else if(_wz.step===3)stepHtml=wizardStepDetails();
  document.getElementById('modal-body').innerHTML=`
    <div class="wizard-steps" style="margin:-20px -20px 14px;padding:14px 20px 0">${dotsHtml}</div>
    ${stepHtml}
  `;
  renderWizardFooter();
}

function wizardBack(){
  if(_wz.step===1)return;
  if(_wz.isPurchase&&_wz.step===2){closeModal();return;}
  _wz.step--;
  renderWizardStep();
}

/* ---------- Paso 1: ¿Entró o salió dinero? ---------- */
function wizardStepType(){
  const {isTrade,isBusiness}=_wz;
  const incomeLabel=isTrade?'Gané dinero':isBusiness?'Fue una venta':'Entró dinero';
  const expenseLabel=isTrade?'Perdí dinero':isBusiness?'Fue un gasto':'Salió dinero';
  const incomeDesc=isTrade?'Ganancia, depósito o ingreso de capital':isBusiness?'Vendiste un producto o servicio':'Recibiste un pago o ingreso';
  const expenseDesc=isTrade?'Pérdida, comisión o retiro de capital':isBusiness?'Pagaste algo para el negocio':'Pagaste o gastaste dinero';
  return `
    <div class="wizard-step-label help-row">Paso 1 de ${wizardTotalSteps()} ${helpBtn('tx_type')}</div>
    <div class="wizard-big-choice">
      <button type="button" class="wizard-choice-card income ${_wz.type==='income'?'sel':''}" onclick="wizardPickType('income')">
        <div class="wizard-choice-icon"><i class="ti ti-arrow-down-left"></i></div>
        <div class="wizard-choice-title">${incomeLabel}</div>
        <div class="wizard-choice-desc">${incomeDesc}</div>
      </button>
      <button type="button" class="wizard-choice-card expense ${_wz.type==='expense'?'sel':''}" onclick="wizardPickType('expense')">
        <div class="wizard-choice-icon"><i class="ti ti-arrow-up-right"></i></div>
        <div class="wizard-choice-title">${expenseLabel}</div>
        <div class="wizard-choice-desc">${expenseDesc}</div>
      </button>
    </div>
  `;
}
function wizardPickType(type){
  _wz.type=type;
  _wz.category=null; // cambiar el tipo invalida la categoría elegida antes
  _wz.step=2;
  renderWizardStep();
}

/* ---------- Paso 2: ¿Cuánto, cuándo y qué fue? ---------- */
function wizardStepAmount(){
  return `
    <div class="wizard-step-label help-row">Paso ${wizardStepIndex()} de ${wizardTotalSteps()} ${helpBtn('tx_amount')}</div>
    <div class="field">
      <input type="number" id="wz-amount" class="wizard-amount-big" placeholder="0.00" min="0" step="0.01" value="${_wz.amount}" autofocus>
    </div>
    <div class="field-row">
      <div class="field"><label class="help-row">Fecha ${helpBtn('tx_date')}</label><input type="date" id="wz-date" value="${_wz.date}"></div>
      <div class="field"><label class="help-row">Descripción ${helpBtn('tx_desc')}</label><input type="text" id="wz-desc" placeholder="Ej: Pago de luz" value="${esc(_wz.desc)}"></div>
    </div>
  `;
}
function wizardValidateAmount(){
  const amount=parseFloat(document.getElementById('wz-amount').value);
  if(!amount||amount<=0){showToast('Ingresa un monto válido','error');return false;}
  _wz.amount=amount;
  _wz.date=document.getElementById('wz-date').value||_wz.date;
  _wz.desc=document.getElementById('wz-desc').value;
  return true;
}

/* ---------- Paso 3: categoría y detalles ---------- */
function wizardStepDetails(){
  const {isBusiness,isPurchase}=_wz;
  const cats=wizardCats();
  const showInvLink=(isBusiness||isPurchase)&&state.inventory.length>0;
  const invOptions=state.inventory.map(i=>`<option value="${i.id}" ${_wz.invId===i.id?'selected':''}>${esc(i.name)} (stock: ${i.stock} ${esc(i.unit||'uds')})</option>`).join('');
  const catGrid=cats.map(c=>`<button type="button" class="wizard-cat-chip ${_wz.category===c?'sel':''}" data-cat="${esc(c)}" onclick="wizardPickCategory(this.dataset.cat)"><i class="ti ${catIcon(c)}" style="display:block;font-size:16px;margin-bottom:4px"></i>${c}</button>`).join('');
  return `
    <div class="wizard-step-label help-row">Paso ${wizardStepIndex()} de ${wizardTotalSteps()} — Categoría ${helpBtn('tx_category')}</div>
    <div class="wizard-cat-grid">${catGrid}</div>
    ${state.accounts.length>1?`<div class="field" style="margin-top:16px"><label class="help-row">Cuenta ${helpBtn('tx_account')}</label><select id="wz-account">${state.accounts.map(a=>`<option value="${a.id}" ${_wz.accountId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>`:''}
    ${showInvLink?`
      <div class="field-toggle" style="margin-top:16px">
        <div>
          <div class="field-toggle-label help-row">${isPurchase?'Sumar al stock de un producto':'Descontar stock de un producto'} ${helpBtn(isPurchase?'tx_link_purchase':'tx_link_sale')}</div>
          <div class="field-toggle-sub">${isPurchase?'Esta compra aumentará el inventario del producto elegido':'Esta venta reducirá el inventario del producto elegido'}</div>
        </div>
        <label class="switch"><input type="checkbox" id="wz-link-inv" ${_wz.linkInv?'checked':''} onchange="document.getElementById('wz-inv-fields').classList.toggle('hidden',!this.checked)"><span class="switch-slider"></span></label>
      </div>
      <div id="wz-inv-fields" class="${_wz.linkInv?'':'hidden'}">
        <div class="field-row">
          <div class="field"><label class="help-row">Producto ${helpBtn('tx_inv_product')}</label><select id="wz-inv-product">${invOptions}</select></div>
          <div class="field"><label class="help-row">Cantidad ${helpBtn('tx_inv_qty')}</label><input type="number" id="wz-inv-qty" min="1" step="1" value="${_wz.invQty}"></div>
        </div>
      </div>
    `:''}
    <div class="field" style="margin-top:${showInvLink?'0':'16px'}"><label class="help-row">Notas (opcional) ${helpBtn('tx_notes')}</label><textarea id="wz-notes" placeholder="Información adicional...">${esc(_wz.notes)}</textarea></div>
  `;
}
function wizardPickCategory(c){
  _wz.category=c;
  document.querySelectorAll('.wizard-cat-chip').forEach(el=>el.classList.toggle('sel',el.dataset.cat===c));
}

/* ---------- Footer dinámico del wizard ---------- */
function renderWizardFooter(){
  const footer=document.querySelector('.modal-footer');
  const isLastStep=_wz.step===3;
  const isFirstVisibleStep=_wz.step===1||(_wz.isPurchase&&_wz.step===2);
  footer.innerHTML=`
    <button class="wizard-back-link" onclick="${isFirstVisibleStep?'closeModal()':'wizardBack()'}" style="margin-right:auto"><i class="ti ti-arrow-left"></i> ${isFirstVisibleStep?'Cancelar':'Atrás'}</button>
    <button class="btn-primary" onclick="${isLastStep?'wizardFinish()':'wizardNext()'}">${isLastStep?(_wz.editId?'Guardar cambios':'Registrar movimiento'):'Continuar'} <i class="ti ti-arrow-right"></i></button>
  `;
}

function wizardNext(){
  if(_wz.step===1){
    if(!_wz.type){showToast('Elige si entró o salió dinero','error');return;}
    _wz.step=2;renderWizardStep();return;
  }
  if(_wz.step===2){
    if(!wizardValidateAmount())return;
    _wz.step=3;renderWizardStep();return;
  }
}

function wizardFinish(){
  if(!_wz.category){showToast('Elige una categoría','error');return;}
  const {module,isBusiness,isPurchase,editId}=_wz;
  const existing=editId?state.transactions.find(t=>t.id===editId):null;
  const showInvLink=(isBusiness||isPurchase)&&state.inventory.length>0;
  const linkInv=showInvLink&&document.getElementById('wz-link-inv')&&document.getElementById('wz-link-inv').checked;
  const invId=linkInv?document.getElementById('wz-inv-product').value:null;
  const invQty=linkInv?(parseFloat(document.getElementById('wz-inv-qty').value)||1):0;

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
    type:_wz.type,
    amount:_wz.amount,
    date:_wz.date,
    desc:_wz.desc,
    category:_wz.category,
    notes:document.getElementById('wz-notes')?document.getElementById('wz-notes').value:_wz.notes,
    accountId:state.accounts.length>1&&document.getElementById('wz-account')?document.getElementById('wz-account').value:_wz.accountId,
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
}

function editTx(id){
  const t=state.transactions.find(x=>x.id===id);
  if(!t)return;
  openTxModal(t.module,id);
}

function deleteTx(id){
  const t=state.transactions.find(x=>x.id===id);
  if(!t)return;
  const linked=t.linkInv&&t.invId;
  confirmDialog({
    title:'Eliminar movimiento',
    message:linked
      ?'Este movimiento está vinculado al inventario. Al eliminarlo se revertirá el efecto sobre el stock del producto. ¿Quieres continuar?'
      :'¿Seguro que quieres eliminar este movimiento? Esta acción no se puede deshacer.',
    confirmLabel:'Eliminar',
    onConfirm:()=>{
      if(linked){
        const prod=state.inventory.find(i=>i.id===t.invId);
        if(prod){
          if(t.module==='business')prod.stock=Number(prod.stock)+Number(t.invQty||0);
          else if(t.module==='purchases')prod.stock=Number(prod.stock)-Number(t.invQty||0);
        }
      }
      state.transactions=state.transactions.filter(x=>x.id!==id);
      showToast('Eliminado');renderPage();scheduleAutosave();
    }
  });
}
