/* ============================================================
   FinFlow — router.js
   Solo existen 3 páginas: welcome (portada), settings (configuración)
   y carta (Carta del día). El logo de la sidebar (en index.html) llama
   directamente a navigate('welcome') al ser clickeado.
   ============================================================ */

function navigate(page) {
  state.currentPage = page;
  renderSidebarNav();
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.getAttribute('data-page') === page));
  renderPage();
  scheduleAutosave();
}

function renderPage() {
  const p = state.currentPage;
  if (p === 'welcome') { renderWelcome(); return; }

  const titles = {
    settings: 'Configuración',
    carta: 'Carta del día'
  };
  const subs = {
    settings: isGodMode() ? 'Respaldo local · Modo Dios activo' : 'Respaldo local del navegador',
    carta: 'Carta del día · catálogo, ventas táctiles y facturas al instante'
  };
  document.getElementById('page-content').innerHTML = `
    <div class="topbar">
      <div><div class="topbar-title">${titles[p] || p}</div><div class="topbar-sub">${subs[p] || ''}</div></div>
      <div class="topbar-actions" id="topbar-actions"></div>
    </div>
    <div class="content" id="page-body"></div>
  `;
  if (p === 'settings') renderSettings();
  else if (p === 'carta') { _cartaView = 'catalog'; renderCarta(); }
}

/* ---------- Sidebar ---------- */
function renderSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = `
    <div class="nav-section">General</div>
    <button class="nav-item${state.currentPage === 'carta' ? ' active' : ''}" style="border:1px solid var(--amber);margin-bottom:4px;" data-page="carta" onclick="navigate('carta')">
      <i class="ti ti-clipboard-list"></i> <span>Carta del día</span>
      <span style="font-size:9px;background:var(--amber);color:#000;padding:1px 5px;border-radius:3px;margin-left:auto;font-weight:700">POS</span>
    </button>
    <div class="nav-section">Sistema</div>
    <button class="nav-item${state.currentPage === 'settings' ? ' active' : ''}" data-page="settings" onclick="navigate('settings')"><i class="ti ti-settings"></i> <span>Configuración</span>${isGodMode() ? '<i class="ti ti-skull" style="margin-left:auto;color:var(--purple)" title="Modo Dios activo"></i>' : ''}</button>
  `;
}

/* ---------- Pantalla de bienvenida ---------- */
function renderWelcome() {
  document.getElementById('page-content').innerHTML = `
    <div class="hero-welcome">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <img class="hero-logo-img" src="assets/logo-full.png" alt="FinFlow — logotipo completo">
        <p class="hero-tagline">Carta del día — catálogo de productos, ventas táctiles por sesión y facturas listas para compartir.</p>
        <div class="hero-actions">
          <button class="w-btn primary" onclick="navigate('carta')"><i class="ti ti-receipt"></i> Ir a Carta del día</button>
          <button class="w-btn secondary" onclick="navigate('settings')"><i class="ti ti-settings"></i> Configuración</button>
        </div>
        <div class="hero-footnote"><i class="ti ti-shield-check"></i> Tus datos se quedan en tu equipo. Nada se sube a internet.</div>
      </div>
    </div>
  `;
}
