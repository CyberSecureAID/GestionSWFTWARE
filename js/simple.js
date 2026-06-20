/* ============================================================
   FinFlow 2.0 — simple.js
   Modo Simple: entrada rápida tipo planilla para usuarios que solo
   quieren registrar ingresos y gastos sin complejidad.
   - Un campo grande para el ingreso mensual/semanal
   - Tabla editable de gastos con descripción, categoría y monto
   - Resumen automático: ingreso − gastos = disponible
   - Los datos se sincronizan con state.transactions (módulo 'personal')
   ============================================================ */

/* Estado local del modo simple (se deriva/sincroniza con state) */
let _simpleRows=[];        // [{id,desc,cat,amount,period}]  period: 'month'|'week'
let _simplePeriod='month'; // 'month' | 'week'

/* ---- Generar ID de semana actual: "YYYY-Wnn" ---- */
function getThisWeek(){
  const now=new Date();
  const jan4=new Date(now.getFullYear(),0,4);
  const week=Math.ceil(((now-jan4)/86400000+jan4.getDay()+1)/7);
  return `${now.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

/* ---- Clave de localStorage para el modo simple ---- */
function simpleStorageKey(){
  return `finflow_simple_${_simplePeriod==='month'?getThisMonth():getThisWeek()}`;
}

/* ---- Cargar filas del período activo desde localStorage ---- */
function loadSimpleRows(){
  try{
    const raw=localStorage.getItem(simpleStorageKey());
    _simpleRows=raw?JSON.parse(raw):[];
  }catch(e){_simpleRows=[];}
}

/* ---- Guardar filas en localStorage y sincronizar con state ---- */
function saveSimpleRows(){
  try{
    localStorage.setItem(simpleStorageKey(),JSON.stringify(_simpleRows));
  }catch(e){}
  syncSimpleToState();
  updateSimpleSummary();
  scheduleAutosave();
}

/* ---- Sincronizar filas del modo simple → state.transactions ----
   Para no duplicar, marcamos las transacciones del modo simple con
   notes='__simple__'. Cada guardado borra las existentes del período
   y las reescribe. */
function syncSimpleToState(){
  const periodKey=_simplePeriod==='month'?getThisMonth():getThisWeek();
  const datePrefix=_simplePeriod==='month'?getThisMonth():new Date().toISOString().slice(0,10);

  // Quitar transacciones previas del modo simple del mismo período
  state.transactions=state.transactions.filter(t=>
    !(t.notes==='__simple__'&&t.accountId===state.activeAccount&&
      (_simplePeriod==='month'?(t.date||'').startsWith(periodKey):t.date===datePrefix))
  );

  // Insertar filas actuales como transactions
  _simpleRows.forEach(row=>{
    if(!row.amount||Number(row.amount)<=0)return;
    state.transactions.push({
      id:row.id||uid(),
      module:'personal',
      type:'expense',
      amount:Number(row.amount),
      date:datePrefix,
      desc:row.desc||'Gasto sin nombre',
      category:row.cat||'Otros gastos',
      notes:'__simple__',
      accountId:state.activeAccount,
      linkInv:false,invId:null,invQty:0
    });
  });
}

/* ---- Obtener el ingreso simple guardado ---- */
function getSimpleIncome(){
  try{
    const key=`finflow_simple_income_${_simplePeriod==='month'?getThisMonth():getThisWeek()}`;
    const v=localStorage.getItem(key);
    return v?parseFloat(v):0;
  }catch(e){return 0;}
}
function setSimpleIncome(val){
  try{
    const key=`finflow_simple_income_${_simplePeriod==='month'?getThisMonth():getThisWeek()}`;
    localStorage.setItem(key,String(val));
  }catch(e){}
  // Guardar también como transacción de ingreso
  syncSimpleIncomeToState(val);
  updateSimpleSummary();
  scheduleAutosave();
}

function syncSimpleIncomeToState(amount){
  const periodKey=_simplePeriod==='month'?getThisMonth():getThisWeek();
  const datePrefix=_simplePeriod==='month'?getThisMonth():new Date().toISOString().slice(0,10);

  // Quitar ingreso simple previo del período
  state.transactions=state.transactions.filter(t=>
    !(t.notes==='__simple_income__'&&t.accountId===state.activeAccount&&
      (_simplePeriod==='month'?(t.date||'').startsWith(periodKey):t.date===datePrefix))
  );

  if(amount>0){
    state.transactions.push({
      id:uid(),
      module:'personal',
      type:'income',
      amount:Number(amount),
      date:datePrefix,
      desc:_simplePeriod==='month'?'Ingreso del mes':'Ingreso de la semana',
      category:'Salario',
      notes:'__simple_income__',
      accountId:state.activeAccount,
      linkInv:false,invId:null,invQty:0
    });
  }
}

/* ---- Calcular totales ---- */
function simpleTotal(){
  return _simpleRows.reduce((a,r)=>a+Number(r.amount||0),0);
}

/* ---- Actualizar la barra de resumen sin re-renderizar toda la página ---- */
function updateSimpleSummary(){
  const income=getSimpleIncome();
  const expenses=simpleTotal();
  const left=income-expenses;

  const eEl=document.getElementById('simple-total-expenses');
  const lEl=document.getElementById('simple-total-left');
  if(eEl)eEl.textContent=fmt(expenses);
  if(lEl){
    lEl.textContent=fmt(Math.abs(left));
    lEl.className='simple-summary-value '+(left>=0?'green':'red');
    const lLabel=document.getElementById('simple-left-label');
    if(lLabel)lLabel.textContent=left>=0?'Disponible':'Déficit';
  }
}

/* ============================================================
   RENDER PRINCIPAL del Modo Simple
   ============================================================ */
function renderSimple(){
  document.getElementById('topbar-actions').innerHTML=`
    <button class="btn" onclick="clearSimpleRows()" style="border-color:var(--border2);color:var(--text3)"><i class="ti ti-refresh"></i> Limpiar período</button>
  `;

  loadSimpleRows();
  const income=getSimpleIncome();

  document.getElementById('page-body').innerHTML=`
    <div class="simple-mode-wrap">

      <!-- Selector de período -->
      <div class="simple-period-bar">
        <span class="simple-period-label">Ver y registrar:</span>
        <button class="simple-period-btn ${_simplePeriod==='month'?'active':''}" onclick="switchSimplePeriod('month')">Este mes</button>
        <button class="simple-period-btn ${_simplePeriod==='week'?'active':''}" onclick="switchSimplePeriod('week')">Esta semana</button>
        <span style="font-size:11px;color:var(--text3);margin-left:6px">${_simplePeriod==='month'?getThisMonth():getThisWeek()}</span>
      </div>

      <!-- Resumen -->
      <div class="simple-summary-bar">
        <div class="simple-summary-card">
          <div class="simple-summary-label">Ingreso ${_simplePeriod==='month'?'del mes':'de la semana'}</div>
          <div class="simple-summary-value green">${fmt(income)}</div>
        </div>
        <div class="simple-summary-card">
          <div class="simple-summary-label">Total gastos</div>
          <div class="simple-summary-value red" id="simple-total-expenses">${fmt(simpleTotal())}</div>
        </div>
        <div class="simple-summary-card">
          <div class="simple-summary-label" id="simple-left-label">${income-simpleTotal()>=0?'Disponible':'Déficit'}</div>
          <div class="simple-summary-value ${income-simpleTotal()>=0?'green':'red'}" id="simple-total-left">${fmt(Math.abs(income-simpleTotal()))}</div>
        </div>
      </div>

      <!-- Ingreso principal -->
      <div class="simple-income-card">
        <div class="simple-income-header">
          <div class="simple-income-title">
            <i class="ti ti-arrow-down-left" style="color:var(--green)"></i>
            ¿Cuánto ${_simplePeriod==='month'?'ganas este mes':'ganaste esta semana'}?
            ${helpBtn('simple_income')}
          </div>
          <span class="simple-income-badge">${_simplePeriod==='month'?'Ingreso mensual':'Ingreso semanal'}</span>
        </div>
        <div class="simple-income-row">
          <input
            type="number"
            class="simple-income-input"
            id="simple-income-input"
            placeholder="Escribe tu ingreso aquí..."
            value="${income||''}"
            min="0"
            step="0.01"
            oninput="onSimpleIncomeChange(this.value)"
          >
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px">
          <i class="ti ti-info-circle"></i> Puede ser tu sueldo, lo que ganó tu negocio, o cualquier entrada de dinero.
        </div>
      </div>

      <!-- Tabla de gastos -->
      <div class="section-header" style="margin-bottom:10px">
        <div class="section-title" style="display:flex;align-items:center;gap:8px">
          <i class="ti ti-arrow-up-right" style="color:var(--red)"></i>
          Gastos ${_simplePeriod==='month'?'del mes':'de la semana'}
          ${helpBtn('simple_expense')}
        </div>
        <button class="btn success" onclick="addSimpleRow()"><i class="ti ti-plus"></i> Agregar gasto</button>
      </div>

      <div id="simple-expense-table-wrap">
        ${renderSimpleTable()}
      </div>

    </div>
  `;
}

function renderSimpleTable(){
  if(_simpleRows.length===0){
    return `<div class="tx-list">
      <div class="simple-placeholder">
        <i class="ti ti-receipt"></i>
        Todavía no hay gastos registrados.<br>
        Toca <b>Agregar gasto</b> o el botón de abajo para empezar.
      </div>
      <button class="simple-add-row-btn" onclick="addSimpleRow()">
        <i class="ti ti-plus"></i> Agregar primer gasto
      </button>
    </div>`;
  }

  const rows=_simpleRows.map((row,i)=>`
    <tr>
      <td>
        <input
          class="qe-input"
          type="text"
          placeholder="Ej: Supermercado, Gasolina, Luz..."
          value="${esc(row.desc||'')}"
          oninput="updateSimpleRow(${i},'desc',this.value)"
        >
      </td>
      <td>
        <select class="qe-cat-select" onchange="updateSimpleRow(${i},'cat',this.value)">
          ${CATS_SIMPLE.map(c=>`<option value="${c}" ${row.cat===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </td>
      <td style="width:130px">
        <input
          class="qe-input mono"
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          value="${row.amount||''}"
          oninput="updateSimpleRow(${i},'amount',this.value)"
        >
      </td>
      <td class="qe-del">
        <button class="qe-del-btn" onclick="deleteSimpleRow(${i})" title="Eliminar esta fila">
          <i class="ti ti-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  const total=simpleTotal();

  return `<table class="quick-expense-table">
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="width:150px">Categoría</th>
        <th style="width:130px">Monto</th>
        <th style="width:40px"></th>
      </tr>
    </thead>
    <tbody id="simple-tbody">
      ${rows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2" style="text-align:right;color:var(--text2)">Total gastos:</td>
        <td style="font-family:var(--mono);color:var(--red)">${fmt(total)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
  <button class="simple-add-row-btn" onclick="addSimpleRow()">
    <i class="ti ti-plus"></i> Agregar otro gasto
  </button>`;
}

/* ---- Handlers ---- */
function onSimpleIncomeChange(val){
  const amount=parseFloat(val)||0;
  setSimpleIncome(amount);
}

function addSimpleRow(){
  _simpleRows.push({id:uid(),desc:'',cat:'Otros gastos',amount:''});
  document.getElementById('simple-expense-table-wrap').innerHTML=renderSimpleTable();
  // Focus en el último input de descripción
  const inputs=document.querySelectorAll('#simple-tbody .qe-input');
  if(inputs.length)inputs[inputs.length-2].focus();
  saveSimpleRows();
}

function updateSimpleRow(index,field,value){
  if(!_simpleRows[index])return;
  _simpleRows[index][field]=field==='amount'?(parseFloat(value)||''):value;
  // Solo guardamos si cambia el monto (para recalcular resumen); desc y cat se guardan en blur
  if(field==='amount'||field==='cat'){
    saveSimpleRows();
    // Refrescar solo la tabla de totales sin re-renderizar todo
    const wrap=document.getElementById('simple-expense-table-wrap');
    if(wrap)wrap.innerHTML=renderSimpleTable();
    updateSimpleSummary();
  }
}

function deleteSimpleRow(index){
  _simpleRows.splice(index,1);
  document.getElementById('simple-expense-table-wrap').innerHTML=renderSimpleTable();
  saveSimpleRows();
}

function switchSimplePeriod(period){
  // Guardar desc de filas antes de cambiar
  saveSimpleDescFromDOM();
  _simplePeriod=period;
  renderSimple();
}

/* Guardar descripciones desde el DOM antes de re-renderizar */
function saveSimpleDescFromDOM(){
  const inputs=document.querySelectorAll('#simple-tbody tr');
  inputs.forEach((tr,i)=>{
    if(!_simpleRows[i])return;
    const descInput=tr.querySelector('.qe-input:not(.mono)');
    if(descInput)_simpleRows[i].desc=descInput.value;
  });
  try{
    localStorage.setItem(simpleStorageKey(),JSON.stringify(_simpleRows));
  }catch(e){}
}

function clearSimpleRows(){
  confirmDialog({
    title:'Limpiar período',
    message:`¿Borrar todos los gastos registrados para ${_simplePeriod==='month'?'este mes':'esta semana'}? El ingreso también se reiniciará. Esta acción no se puede deshacer.`,
    confirmLabel:'Sí, limpiar',
    onConfirm:()=>{
      _simpleRows=[];
      try{
        localStorage.removeItem(simpleStorageKey());
        const incKey=`finflow_simple_income_${_simplePeriod==='month'?getThisMonth():getThisWeek()}`;
        localStorage.removeItem(incKey);
      }catch(e){}
      // Quitar transacciones simple del state
      const periodKey=_simplePeriod==='month'?getThisMonth():getThisWeek();
      const datePrefix=_simplePeriod==='month'?getThisMonth():new Date().toISOString().slice(0,10);
      state.transactions=state.transactions.filter(t=>
        !((t.notes==='__simple__'||t.notes==='__simple_income__')&&t.accountId===state.activeAccount)
      );
      scheduleAutosave();
      renderSimple();
      showToast('Período limpiado');
    }
  });
}

/* Guardar desc cuando el usuario sale de un campo (blur) */
document.addEventListener('blur',function(e){
  if(e.target&&e.target.closest&&e.target.closest('#simple-tbody')){
    saveSimpleDescFromDOM();
    syncSimpleToState();
    scheduleAutosave();
  }
},true);
