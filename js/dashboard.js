/* ============================================================
   FinFlow 2.0 — dashboard.js
   Página Dashboard: métricas generales, gráfico de flujo mensual,
   guía de "próximo paso" para usuarios nuevos sin datos, y barra de cuentas.
   ============================================================ */

/* ---------- Guía de próximo paso (cuando no hay movimientos) ---------- */
const NEXT_STEP_BY_PROFILE={
  business:{icon:'ti-building-store',title:'Registra tu primera venta o gasto',text:'Ve a "Ventas y Gastos" y registra tu primer movimiento. A partir de ahí, el dashboard se llenará solo con tus números.',page:'business',cta:'Ir a Ventas y Gastos'},
  restaurant:{icon:'ti-tools-kitchen-2',title:'Registra tu primera venta del día',text:'Ve a "Ventas del restaurante" y registra lo que vendiste hoy. A partir de ahí, el dashboard se llenará solo con tus números.',page:'business',cta:'Ir a Ventas del restaurante'},
  personal:{icon:'ti-wallet',title:'Registra tu primer ingreso o gasto',text:'Ve a "Ingresos y Gastos" y anota algo simple, como tu sueldo o un gasto del día. El dashboard se llenará solo a partir de eso.',page:'personal',cta:'Ir a Ingresos y Gastos'}
};

/* Secciones disponibles cuando el perfil elegido es "Todo" */
const ALL_PROFILE_SECTIONS=[
  {page:'personal',icon:'ti-wallet',title:'Ingresos y Gastos',desc:'Tu dinero personal del día a día.'},
  {page:'business',icon:'ti-building-store',title:'Ventas y Gastos',desc:'Ingresos y gastos de tu negocio.'},
  {page:'trade',icon:'ti-trending-up',title:'Capital / Trading',desc:'Tus operaciones e inversiones.'},
  {page:'purchases',icon:'ti-shopping-cart',title:'Compras',desc:'Compras de insumos o mercancía.'},
  {page:'inventory',icon:'ti-package',title:'Inventario',desc:'Control de stock de productos.'}
];

const GUIDE_HINTS_HTML=`
  <div class="guide-hints" style="margin-top:18px">
    <div class="guide-hint"><i class="ti ti-bulb"></i> Cada campo del sistema tiene un botón <b>"?"</b> a su lado — tócalo si no entiendes qué poner.</div>
    <div class="guide-hint"><i class="ti ti-device-floppy"></i> Tus datos se guardan automáticamente en este navegador, pero exporta a tu base de datos seguido para tener un respaldo permanente.</div>
  </div>
`;

function renderEmptyDashboard(){
  if(state.profile==='all'){
    document.getElementById('page-body').innerHTML=`
      <div class="guide-card" style="max-width:680px">
        <div class="guide-icon"><i class="ti ti-apps"></i></div>
        <div class="guide-step-tag">Primer paso</div>
        <h3>¿Por dónde quieres empezar?</h3>
        <p>Tienes acceso completo. Elige la sección que quieres usar primero — puedes usar todas las que necesites, cuando quieras.</p>
      </div>
      <div class="onboard-grid" style="max-width:680px;margin:0 auto">
        ${ALL_PROFILE_SECTIONS.map(s=>`
          <button class="onboard-card" onclick="navigate('${s.page}')">
            <div class="onboard-card-icon"><i class="ti ${s.icon}"></i></div>
            <div class="onboard-card-title">${s.title}</div>
            <div class="onboard-card-desc">${s.desc}</div>
            <div class="onboard-card-arrow"><i class="ti ti-arrow-right"></i></div>
          </button>
        `).join('')}
      </div>
      ${GUIDE_HINTS_HTML}
    `;
    return;
  }
  const step=NEXT_STEP_BY_PROFILE[state.profile]||NEXT_STEP_BY_PROFILE.personal;
  document.getElementById('page-body').innerHTML=`
    <div class="guide-card">
      <div class="guide-icon"><i class="ti ${step.icon}"></i></div>
      <div class="guide-step-tag">Primer paso</div>
      <h3>${step.title}</h3>
      <p>${step.text}</p>
      <button class="w-btn primary" onclick="navigate('${step.page}')"><i class="ti ti-arrow-right"></i> ${step.cta}</button>
    </div>
    ${GUIDE_HINTS_HTML}
  `;
}

/* ---------- CTA centrado reutilizable para módulos sin movimientos ---------- */
function moduleEmptyState(opts){
  return `<div class="guide-card">
    <div class="guide-icon"><i class="ti ${opts.icon}"></i></div>
    <div class="guide-step-tag">Primer paso</div>
    <h3>${opts.title}</h3>
    <p>${opts.text}</p>
    <button class="w-btn primary" onclick="${opts.onclick}"><i class="ti ti-plus"></i> ${opts.btn}</button>
  </div>`;
}

/* ---------- Dashboard ---------- */
function renderDashboard(){
  const all=activeTxs(state.transactions);
  if(all.length===0&&state.inventory.length===0){
    renderEmptyDashboard();
    return;
  }
  const ym=getThisMonth();
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
    <div class="tx-list">${recent.length?recent.map(txRow).join(''):'<div class="empty"><i class="ti ti-inbox"></i><p>Sin movimientos aún.</p></div>'}</div>
  `;
  setTimeout(()=>{
    const labels=months.map(m=>m.label);
    const incData=months.map(m=>sum(filterMonth(all,m.ym),'income'));
    const expData=months.map(m=>sum(filterMonth(all,m.ym),'expense'));
    _charts['ch-flow']=new Chart(document.getElementById('ch-flow'),{
      type:'bar',
      data:{labels,datasets:[
        {label:'Ingresos',data:incData,backgroundColor:'rgba(77,171,247,.25)',borderColor:'#4DABF7',borderWidth:2,borderRadius:4},
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
