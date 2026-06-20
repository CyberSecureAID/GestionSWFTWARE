/* ============================================================
   FinFlow 2.0 — constants.js
   Constantes globales: categorías, paleta de colores, clave de localStorage y sistema de ayuda contextual (HELP_TEXT).
   ============================================================ */

const CATS_INCOME=['Salario','Freelance','Inversiones','Negocio','Renta','Otros ingresos'];
const CATS_EXPENSE=['Alimentación','Hogar','Transporte','Salud','Educación','Entretenimiento','Ropa','Servicios','Deudas','Familia','Otros gastos'];
const CATS_BUSINESS_SALE=['Venta de productos','Venta de servicios'];
const CATS_BUSINESS_EXP=['Gasto operativo','Publicidad','Nómina','Logística','Impuestos','Renta del local','Otros'];
const CATS_PURCHASE=['Materia prima','Insumos','Mercancía para reventa','Equipo','Mantenimiento','Otros'];
const CATS_TRADE=['Compra','Venta','Ganancia','Pérdida','Comisión','Depósito','Retiro'];
const CATS_SIMPLE=['Alimentación','Transporte','Hogar','Salud','Educación','Entretenimiento','Ropa','Servicios','Deudas','Otros'];
const PALETTE=['#00C896','#4DABF7','#FFB84D','#B197FC','#FF5C6A','#20C997','#74C0FC','#FFA94D','#DA77F2','#FF8787','#63E6BE','#A9E34B'];
const LS_KEY='finflow_v2_autosave';

/* Iconos por categoría */
const CAT_ICONS={
  'Salario':'ti-cash','Freelance':'ti-briefcase','Inversiones':'ti-chart-line','Negocio':'ti-building-store','Renta':'ti-home','Otros ingresos':'ti-plus',
  'Alimentación':'ti-tools-kitchen-2','Hogar':'ti-home','Transporte':'ti-car','Salud':'ti-heart','Educación':'ti-school','Entretenimiento':'ti-movie','Ropa':'ti-shirt','Servicios':'ti-bolt','Deudas':'ti-credit-card','Familia':'ti-users','Otros gastos':'ti-dots',
  'Venta de productos':'ti-package','Venta de servicios':'ti-headset',
  'Gasto operativo':'ti-settings','Publicidad':'ti-speakerphone','Nómina':'ti-users','Logística':'ti-truck','Impuestos':'ti-receipt','Renta del local':'ti-building','Otros':'ti-dots',
  'Materia prima':'ti-box','Insumos':'ti-package','Mercancía para reventa':'ti-shopping-bag','Equipo':'ti-tool','Mantenimiento':'ti-settings',
  'Compra':'ti-arrow-down','Venta':'ti-arrow-up','Ganancia':'ti-trending-up','Pérdida':'ti-trending-down','Comisión':'ti-receipt-2','Depósito':'ti-arrow-down-circle','Retiro':'ti-arrow-up-circle'
};
function catIcon(c){return CAT_ICONS[c]||'ti-tag';}

/* ---------- Sistema de ayuda contextual ---------- */
const HELP_TEXT={
  inv_name:{title:'Nombre del producto',body:'Cómo se llama lo que vendes o usas en tu negocio. Por ejemplo: <b>"Pullover talla M"</b> o <b>"Harina 1kg"</b>. Te ayuda a identificarlo rápido en la lista.'},
  inv_stock:{title:'Stock actual',body:'Cuántas unidades tienes <b>ahora mismo</b> de este producto. Si tienes 20 pulóveres guardados, pones 20.'},
  inv_min:{title:'Stock mínimo',body:'La cantidad más baja que quieres permitir antes de preocuparte. Si pones <b>1</b>, el sistema te avisará con una alerta cuando solo te quede 1 o menos.'},
  inv_price:{title:'Precio unitario',body:'Cuánto cuesta <b>una sola unidad</b> de este producto.'},
  inv_unit:{title:'Unidad',body:'Cómo se mide o cuenta este producto. La mayoría de las veces será <b>"uds"</b> (unidades). Otros: <b>"kg"</b>, <b>"lt"</b>, <b>"caja"</b>. Si no sabes qué poner, usa "uds".'},
  inv_desc:{title:'Descripción (opcional)',body:'Un detalle extra para recordar algo del producto, como el color, talla, o proveedor. No es obligatorio.'},
  tx_type:{title:'¿Entró o salió dinero?',body:'Elige <b>"Entró dinero"</b> si recibiste un pago. Elige <b>"Salió dinero"</b> si pagaste o tuviste un gasto.'},
  tx_amount:{title:'Monto',body:'La cantidad de dinero de este movimiento. Solo escribe el número, por ejemplo <b>500</b> si fueron $500.'},
  tx_date:{title:'Fecha',body:'El día en que ocurrió este movimiento. Por defecto se pone la fecha de hoy.'},
  tx_desc:{title:'Descripción',body:'Una frase corta que te recuerde de qué se trató. Por ejemplo: <b>"Pago de luz"</b> o <b>"Venta a cliente Pedro"</b>.'},
  tx_category:{title:'Categoría',body:'El "tipo" de gasto o ingreso, para poder agruparlos después. Por ejemplo, un pago de luz va en <b>"Servicios"</b>, y un sueldo va en <b>"Salario"</b>.'},
  tx_account:{title:'Cuenta',body:'A cuál de tus cuentas pertenece este movimiento, si manejas más de una.'},
  tx_link_sale:{title:'Descontar stock de un producto',body:'Si activas esto, al guardar se restará automáticamente la cantidad vendida del stock de ese producto.'},
  tx_link_purchase:{title:'Sumar al stock de un producto',body:'Si activas esto, al guardar se sumará automáticamente la cantidad comprada al stock de ese producto.'},
  tx_inv_product:{title:'Producto',body:'Elige a cuál producto de tu inventario corresponde este movimiento.'},
  tx_inv_qty:{title:'Cantidad',body:'Cuántas unidades de ese producto se vendieron o compraron.'},
  tx_notes:{title:'Notas (opcional)',body:'Espacio libre para anotar cualquier información extra. No afecta ningún cálculo.'},
  budget_cat:{title:'Categoría',body:'Elige sobre qué tipo de gasto quieres poner un límite mensual.'},
  budget_limit:{title:'Límite mensual',body:'La cantidad máxima que quieres gastar en esa categoría cada mes. Si gastas más, la app te lo mostrará en rojo.'},
  goal_name:{title:'Nombre de la meta',body:'Cómo quieres llamar a este objetivo de ahorro. Por ejemplo: <b>"Vacaciones"</b> o <b>"Fondo de emergencia"</b>.'},
  goal_target:{title:'Monto objetivo',body:'Cuánto dinero quieres llegar a ahorrar en total para esta meta.'},
  goal_current:{title:'Monto actual / inicial',body:'Cuánto dinero ya tienes ahorrado para esta meta hasta ahora. Si estás empezando de cero, déjalo en 0.'},
  goal_deadline:{title:'Fecha límite (opcional)',body:'Si te quieres poner un plazo, elige una fecha para la cual te gustaría haber alcanzado esta meta.'},
  goal_add:{title:'Monto a agregar',body:'Cuánto dinero quieres sumar a lo que ya tienes ahorrado en esta meta.'},
  account_name:{title:'Nombre de la cuenta',body:'Cómo quieres llamar a esta cuenta. Por ejemplo: <b>"Personal"</b>, <b>"Negocio de ropa"</b>, o <b>"Ahorros"</b>.'},
  cfg_link_inv:{title:'Vínculo automático ventas-inventario',body:'Cuando está <b>activado</b>, al registrar una venta el sistema te sugerirá vincularla a un producto y descontar su stock automáticamente.'},
  rep_month:{title:'Período',body:'Elige de qué mes quieres ver la información, o selecciona <b>"Todos los meses"</b> para ver el total acumulado.'},
  rep_module:{title:'Módulo',body:'Filtra para ver solo los movimientos de una parte específica: <b>Personal</b>, <b>Negocio</b>, <b>Compras</b>, o <b>Trading</b>.'},
  concept_balance:{title:'Balance neto',body:'Es la diferencia entre todo lo que entró (ingresos) y todo lo que salió (gastos). Si es <b>positivo (verde)</b>, ganaste más de lo que gastaste.'},
  concept_capital:{title:'Capital neto',body:'Es el dinero que has metido a tu cuenta de trading menos el que has retirado.'},
  concept_pnl:{title:'Ganancias menos pérdidas del mes',body:'Es la diferencia entre lo que ganaste y lo que perdiste en tus operaciones este mes.'},
  concept_utilidad:{title:'Utilidad',body:'Es lo que te queda después de restarle los gastos a las ventas del mes.'},
  concept_operations:{title:'Operaciones',body:'Es la cantidad total de movimientos que has registrado hasta ahora.'},
  cfg_about_file:{title:'¿Qué es la base de datos?',body:'Es un archivo Excel (.xlsx) que guarda <b>todos</b> tus datos. Es tu copia de seguridad real — guárdala en tu computadora o en la nube.'},
  simple_income:{title:'Ingreso mensual',body:'Escribe aquí cuánto dinero recibes cada mes. Puede ser tu sueldo, lo que gana tu negocio, o cualquier otro ingreso fijo. Este número se usa para calcular cuánto te queda después de tus gastos.'},
  simple_expense:{title:'Gastos rápidos',body:'Escribe cada gasto con su nombre y monto. Puedes agregar tantos como quieras. No necesitas ser exacto — una estimación ya es muy útil para ver en qué se va tu dinero.'},
  simple_period:{title:'Período',body:'Elige si quieres ver y registrar gastos de la semana actual o del mes completo. El modo semanal es útil si quieres llevar un control más frecuente.'},
};

function showHelp(key,evt){
  if(evt)evt.stopPropagation();
  const h=HELP_TEXT[key];
  if(!h)return;
  document.getElementById('help-title').textContent=h.title;
  document.getElementById('help-body').innerHTML=h.body;
  document.getElementById('help-overlay').classList.remove('hidden');
}
function closeHelp(){document.getElementById('help-overlay').classList.add('hidden');}
function helpBtn(key){return `<button type="button" class="help-btn" onclick="showHelp('${key}',event)" title="Más información" aria-label="Más información">?</button>`;}

/* ---------- Escape HTML ---------- */
function esc(s){
  if(s===undefined||s===null)return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ============================================================
   Menú de acciones (⋮) — VERSIÓN CORREGIDA
   Usa position:fixed calculada en tiempo de ejecución para que
   el menú nunca quede recortado por overflow:hidden de ningún
   contenedor padre. El menú se posiciona con getBoundingClientRect()
   sobre el botón trigger y se ancla al viewport.
   ============================================================ */
let _openActionMenu=null;

function actionMenu(id,actions){
  const items=actions.map(a=>`<button onclick="${a.onclick};closeActionMenu()" ${a.danger?'class="danger"':''}><i class="ti ${a.icon}"></i> ${a.label}</button>`).join('');
  return `<div class="tx-actions" style="position:relative;flex-shrink:0;z-index:20">
    <button class="menu-trigger" onclick="toggleActionMenu(event,'${id}')" aria-label="Más acciones" aria-haspopup="true"><i class="ti ti-dots-vertical"></i></button>
    <div class="action-menu" id="menu-${id}">${items}</div>
  </div>`;
}

function toggleActionMenu(evt,id){
  evt.stopPropagation();
  const menu=document.getElementById('menu-'+id);
  const trigger=evt.currentTarget;
  const wasOpen=menu.classList.contains('open');

  closeActionMenu();

  if(!wasOpen){
    // Posicionar el menú usando fixed + getBoundingClientRect para evitar clipping
    const rect=trigger.getBoundingClientRect();
    menu.style.position='fixed';
    menu.style.zIndex='9999';

    // Primero mostramos para poder medir su tamaño
    menu.classList.add('open');
    trigger.classList.add('open');

    // Calculamos posición después de hacer visible el menú
    requestAnimationFrame(()=>{
      const menuRect=menu.getBoundingClientRect();
      const vw=window.innerWidth;
      const vh=window.innerHeight;

      // Anclar por defecto abajo-derecha del botón
      let top=rect.bottom+4;
      let left=rect.right-menuRect.width;

      // Si se sale por abajo, abrirlo hacia arriba
      if(top+menuRect.height>vh-8){
        top=rect.top-menuRect.height-4;
      }
      // Si se sale por la izquierda, ajustar
      if(left<8)left=8;
      // Si se sale por la derecha, ajustar
      if(left+menuRect.width>vw-8)left=vw-menuRect.width-8;

      menu.style.top=top+'px';
      menu.style.left=left+'px';
    });

    _openActionMenu={menu,trigger};
  }
}

function closeActionMenu(){
  if(_openActionMenu){
    _openActionMenu.menu.classList.remove('open');
    _openActionMenu.trigger.classList.remove('open');
    // Limpiar estilos inline para el próximo uso
    _openActionMenu.menu.style.top='';
    _openActionMenu.menu.style.left='';
    _openActionMenu=null;
  }
}

document.addEventListener('click',()=>closeActionMenu());
window.addEventListener('scroll',()=>closeActionMenu(),true);
window.addEventListener('resize',()=>closeActionMenu());
