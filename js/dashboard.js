/* ============================================================
   FinFlow 2.0 — dashboard.js
   Página Dashboard: métricas generales, gráfico de flujo mensual y barra de selección de cuentas.
   ============================================================ */

/* ---------- Dashboard ---------- */
function renderDashboard(){
  const ym=getThisMonth();
  const all=activeTxs(state.transactions);
  const pm=filterMonth(all.filter(t=>t.module==='personal'),ym);
  const bm=filterMonth(all.filter(t=>t.module==='business'),ym);
  const tm=filterMonth(all.filter(t=>t.module==='trade'),ym);
  const pu=filterMonth(all.filter(t=>t.module==='purchases'),ym);
  const totalInc=sum(pm,'income')+sum(bm,'income')+sum(tm,'income');
  const totalExp=sum(pm,'expense')+sum(bm,'expense')+sum(tm,'expense')+sum(pu,'expense');
  const balance=totalInc-totalExp;
  const months=getLastNMonths(6);
  const recent=[...all].sort((a,b)=>b.date>a.date?1:-1).slice(0,5);
  const lowStock=state.inventory.filter(i=>Number(i.stock)<=Number(i.minStock||0)).length;
  document.getElementById('page-body').innerHTML=`
    ${renderAccountBar()}
    <div class="metrics">
      <div class="metric-card green"><div class="metric-label">Ingresos del mes</div><div class="metric-value green">${fmtShort(totalInc)}</div><div class="metric-sub">Todos los módulos</div></div>
      <div class="metric-card red"><div class="metric-label">Gastos del mes</div><div class="metric-value red">${fmtShort(totalExp)}</div><div class="metric-sub">Incluye compras</div></div>
      <div class="metric-card ${balance>=0?'green':'red'}"><div class="metric-label help-row">Balance neto ${helpBtn('concept_balance')}</div><div class="metric-value ${balance>=0?'green':'red'}">${balance>=0?'':'-'}${fmtShort(Math.abs(balance))}</div><div class="metric-sub">Mes actual</div></div>
      <div class="metric-card ${lowStock>0?'amber':'blue'}"><div class="metric-label">Stock crítico</div><div class="metric-value ${lowStock>0?'amber':'blue'}">${lowStock}</div><div class="metric-sub">Productos bajo mínimo</div></div>
    </div>
    <div class="charts-grid">
      <div class="chart-card full">
        <div class="chart-title">Flujo mensual — últimos 6 meses</div>
        <div class="chart-sub">Ingresos vs gastos consolidados</div>
        <div class="chart-wrap" style="height:200px"><canvas id="ch-flow"></canvas></div>
      </div>
    </div>
    <div class="section-header"><div class="section-title">Movimientos recientes</div><button class="btn success" onclick="navigate('reports')">Ver reportes completos</button></div>
    <div class="tx-list">${recent.length?recent.map(txRow).join(''):'<div class="empty"><i class="ti ti-inbox"></i><p>Sin movimientos aún. Crea un archivo nuevo para empezar.</p></div>'}</div>
  `;
  setTimeout(()=>{
    const labels=months.map(m=>m.label);
    const incData=months.map(m=>sum(filterMonth(all,m.ym),'income'));
    const expData=months.map(m=>sum(filterMonth(all,m.ym),'expense'));
    _charts['ch-flow']=new Chart(document.getElementById('ch-flow'),{
      type:'bar',
      data:{labels,datasets:[
        {label:'Ingresos',data:incData,backgroundColor:'rgba(0,200,150,.25)',borderColor:'#00C896',borderWidth:2,borderRadius:4},
        {label:'Gastos',data:expData,backgroundColor:'rgba(255,92,106,.2)',borderColor:'#FF5C6A',borderWidth:2,borderRadius:4}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8B949E',font:{size:11}}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{ticks:{color:'#6E7681',font:{size:11}},grid:{color:'#21262D'}},y:{ticks:{color:'#6E7681',font:{size:11},callback:v=>fmtShort(v)},grid:{color:'#21262D'}}}}
    });
  },100);
}

/* ---------- Cuentas ---------- */
function renderAccountBar(){
  if(state.accounts.length<=1)return '';
  return `<div class="account-bar">
    <span class="filter-label">Cuenta:</span>
    ${state.accounts.map(a=>`<span class="account-chip ${a.id===state.activeAccount?'active':''}" onclick="switchAccount('${a.id}')">${a.id===state.activeAccount?'<i class=\"ti ti-check\"></i> ':''}${a.name}</span>`).join('')}
  </div>`;
}
function switchAccount(id){state.activeAccount=id;renderPage();scheduleAutosave();}
