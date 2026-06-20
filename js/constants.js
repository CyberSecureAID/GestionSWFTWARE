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
const PALETTE=['#00C896','#4DABF7','#FFB84D','#B197FC','#FF5C6A','#20C997','#74C0FC','#FFA94D','#DA77F2','#FF8787','#63E6BE','#A9E34B'];
const LS_KEY='finflow_v2_autosave';

/* ---------- Sistema de ayuda contextual ---------- */
const HELP_TEXT={
  // Inventario
  inv_name:{title:'Nombre del producto',body:'Cómo se llama lo que vendes o usas en tu negocio. Por ejemplo: <b>"Pullover talla M"</b> o <b>"Harina 1kg"</b>. Te ayuda a identificarlo rápido en la lista.'},
  inv_stock:{title:'Stock actual',body:'Cuántas unidades tienes <b>ahora mismo</b> de este producto. Si tienes 20 pulóveres guardados, pones 20. Cada vez que vendas o compres más, este número puede cambiar solo.'},
  inv_min:{title:'Stock mínimo',body:'La cantidad más baja que quieres permitir antes de preocuparte. Si pones <b>1</b>, el sistema te avisará con una alerta cuando solo te quede 1 o menos, para que sepas que debes reabastecer.'},
  inv_price:{title:'Precio unitario',body:'Cuánto cuesta <b>una sola unidad</b> de este producto. Si vendes el pullover a $800 cada uno, pones 800 aquí (no el total de todos los que tienes).'},
  inv_unit:{title:'Unidad',body:'Cómo se mide o cuenta este producto. La mayoría de las veces será <b>"uds"</b> (unidades), como en ropa o productos individuales. Otros ejemplos: <b>"kg"</b> si vendes por peso (como harina o carne), <b>"lt"</b> si vendes por volumen (como líquidos o pintura), o <b>"caja"</b> si vendes por paquetes. Si no sabes qué poner, usa "uds" — es la opción más común.'},
  inv_desc:{title:'Descripción (opcional)',body:'Un detalle extra para recordar algo del producto, como el color, talla, o proveedor. Por ejemplo: <b>"Color azul, proveedor Juan"</b>. No es obligatorio.'},

  // Movimientos (ingresos/gastos/ventas/compras/trading)
  tx_type:{title:'Tipo de movimiento',body:'Indica si el dinero <b>entró</b> (ingreso o venta) o <b>salió</b> (gasto o compra) de tu bolsillo o negocio. Esto determina si se suma o se resta en tus reportes.'},
  tx_amount:{title:'Monto',body:'La cantidad de dinero de este movimiento. Solo escribe el número, por ejemplo <b>500</b> si fueron $500. No necesitas poner el signo de dólar.'},
  tx_date:{title:'Fecha',body:'El día en que ocurrió este movimiento. Por defecto se pone la fecha de hoy, pero puedes cambiarla si estás registrando algo de días anteriores.'},
  tx_desc:{title:'Descripción',body:'Una frase corta que te recuerde de qué se trató. Por ejemplo: <b>"Pago de luz"</b> o <b>"Venta a cliente Pedro"</b>. Te ayuda a identificar el movimiento después, sin tener que adivinar.'},
  tx_category:{title:'Categoría',body:'El "tipo" de gasto o ingreso, para poder agruparlos después y ver en qué se va más tu dinero. Por ejemplo, un pago de luz va en <b>"Servicios"</b>, y un sueldo va en <b>"Salario"</b>.'},
  tx_account:{title:'Cuenta',body:'A cuál de tus cuentas pertenece este movimiento, si manejas más de una (por ejemplo, "Personal" y "Negocio"). Así mantienes el dinero de cada una separado y organizado.'},
  tx_link_sale:{title:'Descontar stock de un producto',body:'Si activas esto, le dices al sistema: <b>"esta venta fue de un producto que tengo en inventario"</b>. Al guardar, se restará automáticamente la cantidad vendida del stock de ese producto, sin que tengas que ir a editarlo a mano.'},
  tx_link_purchase:{title:'Sumar al stock de un producto',body:'Si activas esto, le dices al sistema: <b>"esta compra fue para reabastecer un producto que tengo en inventario"</b>. Al guardar, se sumará automáticamente la cantidad comprada al stock de ese producto.'},
  tx_inv_product:{title:'Producto',body:'Elige a cuál producto de tu inventario corresponde este movimiento. La lista te muestra cuánto stock tiene cada uno en este momento.'},
  tx_inv_qty:{title:'Cantidad',body:'Cuántas unidades de ese producto se vendieron o compraron en este movimiento. Por ejemplo, si vendiste 3 pulóveres, pones <b>3</b>.'},
  tx_notes:{title:'Notas (opcional)',body:'Espacio libre para anotar cualquier información extra que quieras recordar sobre este movimiento. No afecta ningún cálculo, es solo para ti.'},

  // Presupuestos
  budget_cat:{title:'Categoría',body:'Elige sobre qué tipo de gasto quieres poner un límite mensual. Por ejemplo, si gastas demasiado en <b>"Entretenimiento"</b>, puedes ponerle un tope para controlarlo.'},
  budget_limit:{title:'Límite mensual',body:'La cantidad máxima de dinero que quieres permitirte gastar en esa categoría, cada mes. Si gastas más que esto, la app te lo mostrará en rojo como aviso, pero no te bloqueará nada — es solo una guía visual para ayudarte a controlar tus gastos.'},

  // Metas de ahorro
  goal_name:{title:'Nombre de la meta',body:'Cómo quieres llamar a este objetivo de ahorro, para identificarlo fácilmente. Por ejemplo: <b>"Vacaciones"</b> o <b>"Fondo de emergencia"</b>.'},
  goal_target:{title:'Monto objetivo',body:'Cuánto dinero quieres llegar a ahorrar en total para esta meta. Por ejemplo, si quieres ahorrar $5,000 para un viaje, pones <b>5000</b> aquí.'},
  goal_current:{title:'Monto actual / inicial',body:'Cuánto dinero ya tienes ahorrado para esta meta hasta ahora. Si estás empezando de cero, déjalo en 0 o vacío.'},
  goal_deadline:{title:'Fecha límite (opcional)',body:'Si te quieres poner un plazo, elige una fecha para la cual te gustaría haber alcanzado esta meta. Es solo una referencia para ti, la app no te penaliza si no la cumples a tiempo.'},
  goal_add:{title:'Monto a agregar',body:'Cuánto dinero quieres sumar a lo que ya tienes ahorrado en esta meta. Por ejemplo, si ahorraste $100 esta semana, pones <b>100</b> y se sumará a tu total.'},

  // Cuentas
  account_name:{title:'Nombre de la cuenta',body:'Cómo quieres llamar a esta cuenta para diferenciarla de las demás. Por ejemplo: <b>"Personal"</b>, <b>"Negocio de ropa"</b>, o <b>"Ahorros"</b>. Cada cuenta guarda sus propios movimientos por separado.'},

  // Configuración
  cfg_link_inv:{title:'Vínculo automático ventas-inventario',body:'Cuando está <b>activado</b>, al registrar una venta el sistema te sugerirá automáticamente vincularla a un producto y descontar su stock. Si lo <b>desactivas</b>, tendrás que activarlo manualmente en cada venta, o llevar tu inventario totalmente aparte de tus ventas.'},

  // Reportes
  rep_month:{title:'Período',body:'Elige de qué mes quieres ver la información, o selecciona <b>"Todos los meses"</b> para ver el total acumulado de todo el tiempo.'},
  rep_module:{title:'Módulo',body:'Filtra para ver solo los movimientos de una parte específica de tu vida financiera: <b>Personal</b>, <b>Negocio</b>, <b>Compras</b>, o <b>Trading</b>. Elige "Todos" para verlo junto.'},

  // Conceptos generales del dashboard
  concept_balance:{title:'Balance neto',body:'Es la diferencia entre todo lo que entró (ingresos) y todo lo que salió (gastos) en el período mostrado. Si es <b>positivo (verde)</b>, ganaste más de lo que gastaste. Si es <b>negativo (rojo)</b>, gastaste más de lo que ganaste.'},
  concept_capital:{title:'Capital neto',body:'Es el dinero que has metido a tu cuenta de trading menos el que has retirado. No incluye ganancias ni pérdidas de las operaciones — solo el dinero "propio" que has puesto en juego.'},
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
