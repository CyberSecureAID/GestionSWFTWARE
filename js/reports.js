/* ============================================================
   FinFlow 2.0 — reports.js
   Página Reportes: filtros, métricas, gráficos (donut/línea), tabla de categorías y exportación de reporte a Excel.
   ============================================================ */

/* ---------- Reportes ---------- */
function renderReports(){
  document.getElementById('topbar-actions').innerHTML=`<button class="btn success" onclick="exportReportCSV()"><i class="ti ti-file-spreadsheet"></i> Exportar reporte</button>`;
  const months=getLastNMonths(12);
  const curMonth=getThisMonth();
  const selOpts=months.map(m=>`<option value="${m.ym}" ${m.ym===curMonth?'selected':''}>${m.label} ${m.ym.split('-')[0]}</option>`).reverse().join('');
  document.getElementById('page-body').innerHTML=`
    <div class="report-filters">
      <span class="filter-label help-row">Período: ${helpBtn('rep_month')}</span>
      <select class="filter-select" id="rep-month" onchange="refreshReports()">${selOpts}<option value="all">Todos los meses</option></select>
      <span class="filter-label help-row" style="margin-left:6px">Módulo: ${helpBtn('rep_module')}</span>
      <select class="filter-select" id="rep-module" onchange="refreshReports()">
        <option value="all">Todos los módulos</option>
        <option value="personal">Personal</option>
        <option value="business">Negocio</option>
        <option value="purchases">Compras</option>
        <option value="trade">Trading</option>
      </select>
    </div>
    <div id="rep-metrics" class="metrics" style="margin-bottom:20px"></div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Gastos por categoría</div>
        <div class="chart-sub">Distribución proporcional</div>
        <div class="chart-wrap" style="height:220px"><canvas id="ch-donut"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Ingresos por categoría</div>
        <div class="chart-sub">Distribución proporcional</div>
        <div class="chart-wrap" style="height:220px"><canvas id="ch-donut-inc"></canvas></div>
      </div>
      <div class="chart-card full">
        <div class="chart-title">Evolución mensual</div>
        <div class="chart-sub">Tendencia de ingresos y gastos — últimos 6 meses</div>
        <div class="chart-wrap" style="height:200px"><canvas id="ch-line"></canvas></div>
      </div>
    </div>
    <div class="section-header"><div class="section-title">Top gastos por categoría</div></div>
    <div class="tx-list" id="rep-cat-table"></div>
    <div style="height:24px"></div>
    <div class="section-header"><div class="section-title">Movimientos del período</div></div>
    <div class="tx-list" id="rep-tx-list"></div>
  `;
  refreshReports();
}

function refreshReports(){
  const ym=document.getElementById('rep-month').value;
  const mod=document.getElementById('rep-module').value;
  let txs=activeTxs(state.transactions);
  if(mod!=='all')txs=txs.filter(t=>t.module===mod);
  if(ym!=='all')txs=txs.filter(t=>t.date&&t.date.startsWith(ym));
  const inc=sum(txs,'income'),exp=sum(txs,'expense'),bal=inc-exp;
  const expTxCount=txs.filter(t=>t.type==='expense').length;
  const avgExp=expTxCount?exp/expTxCount:0;
  let trendHtml='';
  if(ym!=='all'){
    const [y,m]=ym.split('-').map(Number);
    const prevD=new Date(y,m-2,1);
    const prevYm=`${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,'0')}`;
    let prev=activeTxs(state.transactions);
    if(mod!=='all')prev=prev.filter(t=>t.module===mod);
    prev=prev.filter(t=>t.date&&t.date.startsWith(prevYm));
    if(prev.length){
      const diff=bal-(sum(prev,'income')-sum(prev,'expense'));
      const cls=diff>0?'up':diff<0?'down':'flat';
      trendHtml=`<span class="trend ${cls}">${diff>0?'+':''}${fmtShort(diff)} vs mes anterior</span>`;
    }
  }
  document.getElementById('rep-metrics').innerHTML=`
    <div class="metric-card green"><div class="metric-label">Ingresos</div><div class="metric-value green">${fmtShort(inc)}</div></div>
    <div class="metric-card red"><div class="metric-label">Gastos</div><div class="metric-value red">${fmtShort(exp)}</div></div>
    <div class="metric-card ${bal>=0?'green':'red'}"><div class="metric-label">Balance</div><div class="metric-value ${bal>=0?'green':'red'}">${bal>=0?'':'-'}${fmtShort(Math.abs(bal))}</div>${trendHtml?`<div class="metric-sub" style="margin-top:6px">${trendHtml}</div>`:''}</div>
    <div class="metric-card amber"><div class="metric-label">Gasto promedio</div><div class="metric-value amber">${fmtShort(avgExp)}</div><div class="metric-sub">Por transacción</div></div>
    <div class="metric-card purple"><div class="metric-label">Operaciones</div><div class="metric-value purple">${txs.length}</div></div>
  `;
  ['ch-donut','ch-donut-inc','ch-line'].forEach(destroyChart);
  const expTxs=txs.filter(t=>t.type==='expense');
  const catExpMap={};
  expTxs.forEach(t=>{const c=t.category||'Sin categoría';catExpMap[c]=(catExpMap[c]||0)+Number(t.amount||0);});
  const catExpLabels=Object.keys(catExpMap).sort((a,b)=>catExpMap[b]-catExpMap[a]);
  setTimeout(()=>{
    if(catExpLabels.length){
      _charts['ch-donut']=new Chart(document.getElementById('ch-donut'),{
        type:'doughnut',
        data:{labels:catExpLabels,datasets:[{data:catExpLabels.map(c=>catExpMap[c]),backgroundColor:PALETTE.slice(0,catExpLabels.length).map(c=>c+'CC'),borderColor:PALETTE.slice(0,catExpLabels.length),borderWidth:1.5,hoverOffset:6}]},
        options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'right',labels:{color:'#8B949E',font:{size:11},boxWidth:10,padding:8}},tooltip:{callbacks:{label:c=>` ${c.label}: ${fmt(c.raw)}`}}}}
      });
    } else {
      const el=document.getElementById('ch-donut');
      if(el)el.parentElement.innerHTML='<div class="empty" style="padding:20px"><p>Sin gastos en este período</p></div>';
    }
    const incTxs=txs.filter(t=>t.type==='income');
    const catIncMap={};
    incTxs.forEach(t=>{const c=t.category||'Sin categoría';catIncMap[c]=(catIncMap[c]||0)+Number(t.amount||0);});
    const catIncLabels=Object.keys(catIncMap).sort((a,b)=>catIncMap[b]-catIncMap[a]);
    if(catIncLabels.length){
      _charts['ch-donut-inc']=new Chart(document.getElementById('ch-donut-inc'),{
        type:'doughnut',
        data:{labels:catIncLabels,datasets:[{data:catIncLabels.map(c=>catIncMap[c]),backgroundColor:PALETTE.map(c=>c+'CC'),borderColor:PALETTE,borderWidth:1.5,hoverOffset:6}]},
        options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'right',labels:{color:'#8B949E',font:{size:11},boxWidth:10,padding:8}},tooltip:{callbacks:{label:c=>` ${c.label}: ${fmt(c.raw)}`}}}}
      });
    } else {
      const el=document.getElementById('ch-donut-inc');
      if(el)el.parentElement.innerHTML='<div class="empty" style="padding:20px"><p>Sin ingresos en este período</p></div>';
    }
    const months6=getLastNMonths(6);
    let base=activeTxs(state.transactions);
    if(mod!=='all')base=base.filter(t=>t.module===mod);
    _charts['ch-line']=new Chart(document.getElementById('ch-line'),{
      type:'line',
      data:{labels:months6.map(m=>m.label),datasets:[
        {label:'Ingresos',data:months6.map(m=>sum(filterMonth(base,m.ym),'income')),borderColor:'#4DABF7',backgroundColor:'rgba(77,171,247,.08)',fill:true,tension:.35,pointBackgroundColor:'#4DABF7',pointRadius:4},
        {label:'Gastos',data:months6.map(m=>sum(filterMonth(base,m.ym),'expense')),borderColor:'#FF5C6A',backgroundColor:'rgba(255,92,106,.08)',fill:true,tension:.35,pointBackgroundColor:'#FF5C6A',pointRadius:4}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8B949E',font:{size:11}}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{ticks:{color:'#6E7681',font:{size:11}},grid:{color:'#21262D'}},y:{ticks:{color:'#6E7681',font:{size:11},callback:v=>fmtShort(v)},grid:{color:'#21262D'}}}}
    });
  },80);
  const maxCatVal=catExpLabels.length?catExpMap[catExpLabels[0]]:1;
  const totalExp2=catExpLabels.reduce((a,c)=>a+catExpMap[c],0)||1;
  document.getElementById('rep-cat-table').innerHTML=catExpLabels.length?`
    <table class="cat-table">
      <thead><tr><th>Categoría</th><th>Monto</th><th>% del total</th><th style="width:140px">Proporción</th></tr></thead>
      <tbody>${catExpLabels.slice(0,8).map((c,i)=>`
        <tr>
          <td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${PALETTE[i%PALETTE.length]};margin-right:8px"></span>${c}</td>
          <td style="font-family:var(--mono);color:var(--red-text)">${fmt(catExpMap[c])}</td>
          <td style="font-family:var(--mono);color:var(--text3)">${((catExpMap[c]/totalExp2)*100).toFixed(1)}%</td>
          <td><div class="cat-bar-wrap"><div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${Math.round((catExpMap[c]/maxCatVal)*100)}%"></div></div></div></td>
        </tr>`).join('')}
      </tbody>
    </table>
  `:'<div class="empty" style="padding:20px"><i class="ti ti-table"></i><p>Sin gastos en este período</p></div>';
  const sorted=[...txs].sort((a,b)=>b.date>a.date?1:-1);
  document.getElementById('rep-tx-list').innerHTML=sorted.length?sorted.map(txRow).join(''):'<div class="empty"><i class="ti ti-inbox"></i><p>Sin movimientos en este período</p></div>';
}

function exportReportCSV(){
  const ym=document.getElementById('rep-month').value;
  const mod=document.getElementById('rep-module').value;
  let txs=activeTxs(state.transactions);
  if(mod!=='all')txs=txs.filter(t=>t.module===mod);
  if(ym!=='all')txs=txs.filter(t=>t.date&&t.date.startsWith(ym));
  const wb=XLSX.utils.book_new();
  const headers=['Fecha','Módulo','Tipo','Descripción','Categoría','Monto','Notas'];
  const rows=txs.map(t=>[t.date,t.module,t.type==='income'?'Ingreso':'Gasto',t.desc,t.category,Number(t.amount||0),t.notes]);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([headers,...rows]),'Reporte');
  XLSX.writeFile(wb,`finflow_reporte_${ym==='all'?'completo':ym}.xlsx`);
  showToast('Reporte exportado');
}
