/* ============================================================
   FinFlow 2.0 — state.js
   Estado global de la app, estructura por defecto (defaultState), utilidades de cálculo/fecha y persistencia en localStorage (autoguardado).
   ============================================================ */

let state=defaultState();
let _charts={};
let _saveTimer=null;
let _editingTxId=null;
let _editingInvId=null;
let _editingGoalId=null;

function defaultState(){
  return {
    fileName:null,
    currentPage:'welcome',
    accounts:[{id:'default',name:'General'}],
    activeAccount:'default',
    transactions:[],     // {id,module,type,amount,date,desc,category,notes,accountId,linkInv,invId,invQty}
    inventory:[],        // {id,name,stock,minStock,price,unit,desc}
    budgets:[],          // {id,category,limit,month}
    goals:[],            // {id,name,target,current,deadline}
    settings:{
      linkSalesToInventory:true,   // toggle global, editable en Configuración
      lastSavedExcelAt:null
    }
  };
}

/* ---------- Utilidades ---------- */
function destroyChart(id){if(_charts[id]){_charts[id].destroy();delete _charts[id];}}
function fmt(n){return '$'+Math.abs(Number(n)||0).toLocaleString('es',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtShort(n){n=Math.abs(Number(n)||0);if(n>=1000000)return '$'+(n/1000000).toFixed(1)+'M';if(n>=1000)return '$'+(n/1000).toFixed(1)+'K';return fmt(n);}
function getThisMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function getMonthLabel(m){return['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m];}
function filterMonth(txs,ym){return txs.filter(t=>t.date&&t.date.startsWith(ym));}
function sum(txs,type){return txs.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.amount||0),0);}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function getLastNMonths(n){
  const now=new Date(),res=[];
  for(let i=n-1;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);res.push({label:getMonthLabel(d.getMonth()),ym:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`});}
  return res;
}
function activeTxs(list){return list.filter(t=>t.accountId===state.activeAccount||!t.accountId);}

/* ---------- Persistencia: autoguardado en localStorage ---------- */
function scheduleAutosave(){
  setSaveDot('pending','Guardando…');
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{
    try{
      localStorage.setItem(LS_KEY,JSON.stringify(state));
      setSaveDot('saved','Guardado en este navegador');
    }catch(e){
      setSaveDot('unsynced','No se pudo guardar localmente');
    }
  },500);
}
function setSaveDot(cls,text){
  const dot=document.getElementById('save-dot');
  const txt=document.getElementById('save-text');
  if(!dot)return;
  dot.className='save-dot '+cls;
  txt.textContent=text;
}
function loadAutosave(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    if(!parsed||!Array.isArray(parsed.transactions))return null;
    return parsed;
  }catch(e){return null;}
}
function clearAutosave(){
  try{localStorage.removeItem(LS_KEY);}catch(e){}
}
