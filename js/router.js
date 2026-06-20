/* ============================================================
   FinFlow 2.0 — router.js
   Router de páginas: navigate(), renderPage(), pantalla de bienvenida y recuperación de sesión autoguardada.
   ============================================================ */

/* ---------- Render router ---------- */
function navigate(page){
  state.currentPage=page;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.getAttribute('onclick')===`navigate('${page}')`));
  Object.keys(_charts).forEach(destroyChart);
  renderPage();
  scheduleAutosave();
}

function renderPage(){
  const p=state.currentPage;
  if(p==='welcome'){renderWelcome();return;}
  const titles={dashboard:'Dashboard',reports:'Reportes y Análisis',personal:'Ingresos y Gastos',trade:'Capital / Trading',budgets:'Presupuestos',goals:'Metas de ahorro',business:'Ventas y Gastos del Negocio',purchases:'Compras',inventory:'Inventario',settings:'Configuración'};
  const subs={dashboard:'Resumen financiero general',reports:'Gráficos, tendencias y análisis detallado',personal:'Gestión personal y familiar',trade:'Seguimiento de capital e inversiones',budgets:'Límites de gasto por categoría',goals:'Objetivos de ahorro con seguimiento de progreso',business:'Ingresos por ventas y gastos operativos',purchases:'Compras de insumos y mercancía',inventory:'Control de stock de productos',settings:'Cuentas, vínculos e información del sistema'};
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
}

function renderWelcome(){
  const auto=loadAutosave();
  const hasResume=auto&&auto.transactions&&auto.transactions.length>0;
  document.getElementById('page-content').innerHTML=`
    <div class="welcome">
      <div class="welcome-icon"><i class="ti ti-chart-line"></i></div>
      <h2>Bienvenido a FinFlow 2.0</h2>
      <p>Gestiona tus finanzas personales y de negocio con facilidad. Crea un nuevo archivo, carga uno existente, o continúa donde lo dejaste.</p>
      ${hasResume?`
        <div class="welcome-resume">
          <div class="welcome-resume-title"><i class="ti ti-history"></i> Sesión anterior encontrada</div>
          <div class="welcome-resume-text">Este navegador guardó automáticamente <b>${auto.transactions.length}</b> movimientos${auto.fileName?` del archivo <b>${auto.fileName}</b>`:''}. Esto es un respaldo local, no tu archivo Excel.</div>
        </div>
      `:''}
      <div class="welcome-actions">
        ${hasResume?`<button class="w-btn primary" onclick="resumeAutosave()"><i class="ti ti-player-play"></i> Continuar sesión</button>`:''}
        <button class="w-btn ${hasResume?'secondary':'primary'}" onclick="newFile()"><i class="ti ti-file-plus"></i> Nuevo archivo</button>
        <button class="w-btn secondary" onclick="document.getElementById('file-input').click()"><i class="ti ti-upload"></i> Cargar Excel</button>
      </div>
    </div>
  `;
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
