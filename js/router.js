/* ============================================================
   FinFlow 2.0 — router.js
   Router de páginas: navigate(), renderPage(), pantalla de bienvenida,
   selección de perfil (onboarding) y recuperación de sesión autoguardada.
   ============================================================ */

/* ---------- Render router ---------- */
function navigate(page){
  state.currentPage=page;
  renderSidebarNav();
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.getAttribute('data-page')===page));
  Object.keys(_charts).forEach(destroyChart);
  renderPage();
  scheduleAutosave();
}

function renderPage(){
  const p=state.currentPage;
  if(p==='welcome'){renderWelcome();return;}
  if(p==='onboarding'){renderOnboarding();return;}
  const prof=currentProfile();
  const titles={
    dashboard:'Dashboard',
    reports:'Reportes',
    personal:'Ingresos y Gastos',
    trade:'Capital / Trading',
    budgets:'Presupuestos',
    goals:'Metas de ahorro',
    business:navLabel('business','Ventas y Gastos'),
    purchases:navLabel('purchases','Compras'),
    inventory:navLabel('inventory','Inventario'),
    settings:'Configuración',
    simple:'Modo Simple'
  };
  const subs={
    dashboard:'Resumen general',
    reports:'Gráficos, tendencias y análisis',
    personal:'Gestión personal y familiar',
    trade:'Seguimiento de capital e inversiones',
    budgets:'Límites de gasto por categoría',
    goals:'Objetivos de ahorro con seguimiento de progreso',
    business:`Ingresos y gastos de tu ${prof.moduleLabel}`,
    purchases:'Compras de insumos y mercancía',
    inventory:'Control de stock de productos',
    settings:'Cuentas, vínculos e información del sistema',
    simple:'Registra ingresos y gastos de forma rápida y sencilla'
  };
  document.getElementById('page-content').innerHTML=`
    <div class="topbar">
      <div><div class="topbar-title">${titles[p]||p}</div><div class="topbar-sub">${subs[p]||''}</div></div>
      <div class="topbar-actions" id="topbar-actions"></div>
    </div>
    <div class="content" id="page-body"></div>
  `;
  if(p==='dashboard')renderDashboard();
  else if(p==='reports')renderReports();
  else if(p==='personal')renderPersonal();
  else if(p==='trade')renderTrade();
  else if(p==='budgets')renderBudgets();
  else if(p==='goals')renderGoals();
  else if(p==='business')renderBusiness();
  else if(p==='purchases')renderPurchases();
  else if(p==='inventory')renderInventory();
  else if(p==='settings')renderSettings();
  else if(p==='simple')renderSimple();
}

/* ---------- Sidebar dinámico (según perfil elegido) ---------- */
const NAV_DEFS=[
  {key:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard',section:'General'},
  {key:'reports',label:'Reportes',icon:'ti-chart-bar',section:'General'},
  /* Modo Simple: visible siempre, en la sección General */
  {key:'simple',label:'Modo Simple',icon:'ti-table',section:'General'},
  {key:'personal',label:'Ingresos y Gastos',icon:'ti-wallet',section:'Personal'},
  {key:'trade',label:'Capital / Trading',icon:'ti-trending-up',section:'Personal'},
  {key:'budgets',label:'Presupuestos',icon:'ti-chart-pie',section:'Personal'},
  {key:'goals',label:'Metas de ahorro',icon:'ti-target-arrow',section:'Personal'},
  {key:'business',label:'Ventas y Gastos',icon:'ti-building-store',section:'Negocio'},
  {key:'purchases',label:'Compras',icon:'ti-shopping-cart',section:'Negocio'},
  {key:'inventory',label:'Inventario',icon:'ti-package',section:'Negocio'},
  {key:'settings',label:'Configuración',icon:'ti-settings',section:'Sistema'}
];

function renderSidebarNav(){
  const nav=document.getElementById('sidebar-nav');
  if(!nav)return;
  const prof=currentProfile();
  let lastSection=null;
  let html='';
  NAV_DEFS.forEach(item=>{
    // 'simple' y 'dashboard' y 'reports' se muestran en todos los perfiles
    if(item.key!=='simple'&&item.key!=='dashboard'&&item.key!=='reports'){
      if(!profileAllows(item.key))return;
    }
    const section=item.key==='business'||item.key==='purchases'||item.key==='inventory'?prof.sectionLabel:item.section;
    if(section!==lastSection){
      html+=`<div class="nav-section">${section}</div>`;
      lastSection=section;
    }
    const label=navLabel(item.key,item.label);
    const isSimple=item.key==='simple';
    const extraStyle=isSimple?'border:1px solid var(--green);margin-bottom:4px;':'';
    html+=`<button class="nav-item${state.currentPage===item.key?' active':''}" style="${extraStyle}" data-page="${item.key}" onclick="navigate('${item.key}')"><i class="ti ${item.icon}"></i> <span>${label}</span>${isSimple?'<span style="font-size:9px;background:var(--green);color:#000;padding:1px 5px;border-radius:3px;margin-left:auto;font-weight:700">NUEVO</span>':''}</button>`;
  });
  nav.innerHTML=html;
}

/* ---------- Pantalla de bienvenida ---------- */
function renderWelcome(){
  const auto=loadAutosave();
  const hasResume=auto&&auto.transactions&&auto.transactions.length>0;
  document.getElementById('page-content').innerHTML=`
    <div class="hero-welcome">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <img class="hero-logo-img" src="assets/logo-full.png" alt="FinFlow 2.0 — logotipo completo">
        <p class="hero-tagline">Controla tus finanzas personales o tu negocio con una herramienta que te explica todo, paso a paso — sin necesidad de saber de contabilidad.</p>
        ${hasResume?`
          <div class="welcome-resume">
            <div class="welcome-resume-title"><i class="ti ti-history"></i> Sesión anterior encontrada</div>
            <div class="welcome-resume-text">Este navegador guardó automáticamente <b>${auto.transactions.length}</b> movimientos${auto.fileName?` del archivo <b>${auto.fileName}</b>`:''}. Esto es un respaldo local, no tu base de datos.</div>
          </div>
        `:''}
        <div class="hero-actions">
          ${hasResume?`<button class="w-btn primary" onclick="resumeAutosave()"><i class="ti ti-player-play"></i> Continuar sesión</button>`:''}
          <button class="w-btn ${hasResume?'secondary':'primary'}" onclick="navigate('onboarding')"><i class="ti ti-rocket"></i> Empezar ahora</button>
          <button class="w-btn secondary" onclick="document.getElementById('file-input').click()"><i class="ti ti-upload"></i> Cargar base de datos</button>
        </div>
        <div class="hero-footnote"><i class="ti ti-shield-check"></i> Tus datos se quedan en tu equipo. Nada se sube a internet.</div>
      </div>
    </div>
  `;
}

/* ---------- Onboarding: selección de objetivo ---------- */
const ONBOARD_OPTIONS=[
  {key:'business',icon:'ti-building-store',title:'Quiero gestionar mi negocio',desc:'Ventas, compras, inventario y gastos operativos.'},
  {key:'restaurant',icon:'ti-tools-kitchen-2',title:'Quiero gestionar mi restaurante',desc:'Ventas diarias, compra de insumos y control de inventario.'},
  {key:'personal',icon:'ti-wallet',title:'Quiero gestionar mis ingresos y gastos personales',desc:'Tu dinero del día a día, presupuestos y metas de ahorro.'},
  {key:'all',icon:'ti-apps',title:'Quiero ver todas las opciones',desc:'Acceso completo, ideal si manejas varias cosas a la vez.'}
];

function renderOnboarding(){
  document.getElementById('page-content').innerHTML=`
    <div class="onboard-screen">
      <button class="onboard-back" onclick="navigate('welcome')"><i class="ti ti-arrow-left"></i> Volver</button>
      <div class="onboard-head">
        <h2>¿Qué quieres gestionar?</h2>
        <p>Elige una opción y FinFlow se adapta para mostrarte solo lo que necesitas. Puedes cambiarlo después en Configuración.</p>
      </div>
      <div class="onboard-grid">
        ${ONBOARD_OPTIONS.map(o=>`
          <button class="onboard-card" onclick="selectProfile('${o.key}')">
            <div class="onboard-card-icon"><i class="ti ${o.icon}"></i></div>
            <div class="onboard-card-title">${o.title}</div>
            <div class="onboard-card-desc">${o.desc}</div>
            <div class="onboard-card-arrow"><i class="ti ti-arrow-right"></i></div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function selectProfile(key){
  const hasData=state.transactions.length>0||state.inventory.length>0;
  if(hasData&&!confirm('¿Crear nuevo archivo? Los datos no exportados a tu base de datos se perderán (el respaldo local también se reiniciará).')){
    return;
  }
  state=defaultState();
  state.profile=key;
  state.fileName='mis_finanzas.xlsx';
  state.currentPage='dashboard';
  clearAutosave();
  document.getElementById('file-badge').textContent=state.fileName;
  navigate('dashboard');
  showToast(`Listo — configurado para ${PROFILES[key].label.toLowerCase()}`);
}

function resumeAutosave(){
  const auto=loadAutosave();
  if(!auto)return;
  state=Object.assign(defaultState(),auto);
  state.currentPage='dashboard';
  document.getElementById('file-badge').textContent=state.fileName||'Sesión recuperada (sin nombre de archivo)';
  navigate('dashboard');
  setSaveDot('saved','Guardado en este navegador');
  showToast('Sesión anterior recuperada');
}
