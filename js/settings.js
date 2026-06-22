/* ============================================================
   FinFlow — settings.js  (versión reducida)
   Ya no existen perfiles de uso, vínculo ventas-inventario ni
   cuentas múltiples (eran de los módulos eliminados). Configuración
   se reduce a: respaldo local del navegador + accesos directos a
   las herramientas de datos de Carta del día.
   ============================================================ */

function renderSettings() {
  document.getElementById('page-body').innerHTML = `
    <div class="section-header"><div class="section-title">Carta del día</div></div>
    <div class="field-hint" style="margin-bottom:14px;line-height:1.6">
      El catálogo de productos, el nombre del negocio, el logo y el historial de ventas de
      Carta del día se guardan por separado en este navegador. Desde aquí puedes acceder
      rápido a sus herramientas de exportación, importación y configuración.
    </div>
    <div style="display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap">
      <button class="btn success" onclick="navigate('carta')"><i class="ti ti-receipt"></i> Ir a Carta del día</button>
      <button class="btn" onclick="navigate('carta');setTimeout(cartaOpenDataMenu,50)" style="border-color:var(--blue);color:var(--blue-text)"><i class="ti ti-file-spreadsheet"></i> Exportar / Importar</button>
      <button class="btn" onclick="navigate('carta');setTimeout(cartaOpenSettings,50)" style="border-color:var(--border2);color:var(--text3)"><i class="ti ti-settings"></i> Configurar Carta del día</button>
    </div>

    <div class="section-header"><div class="section-title help-row">Respaldo y almacenamiento</div></div>
    <div class="field-hint" style="margin-bottom:10px;line-height:1.6">
      <b style="color:var(--text)">Autoguardado local:</b> algunas preferencias se guardan automáticamente
      en este navegador (localStorage). Esto NO sustituye un respaldo externo — si limpias el navegador
      o cambias de equipo, este respaldo se pierde.
    </div>
    <button class="btn" onclick="clearAutosaveConfirm()" style="border-color:var(--red);color:var(--red-text)"><i class="ti ti-trash"></i> Borrar respaldo local de este navegador</button>
  `;
}

function clearAutosaveConfirm() {
  confirmDialog({
    title: 'Borrar respaldo local',
    message: '¿Borrar el respaldo guardado en este navegador? Esto no afecta el catálogo, ventas ni configuración de Carta del día, que se guardan por separado.',
    confirmLabel: 'Borrar respaldo',
    onConfirm: () => {
      clearAutosave();
      showToast('Respaldo local borrado');
    }
  });
}
