/* ============================================================
   FinFlow 2.0 — fileio.js
   Manejo de archivo: nuevo archivo (vía onboarding), exportar/importar base de datos (Excel).
   ============================================================ */

/* ---------- Archivo: nuevo / exportar / importar ---------- */
function newFile(){
  const hasData=state.transactions.length>0||state.inventory.length>0;
  if(hasData){
    confirmDialog({
      title:'¿Crear nuevo archivo?',
      message:'Los datos que no hayas exportado a tu base de datos se perderán (el respaldo local también se reiniciará). Si quieres conservarlos, exporta primero tu base de datos.',
      confirmLabel:'Sí, crear nuevo',
      onConfirm:()=>navigate('onboarding')
    });
    return;
  }
  navigate('onboarding');
}

function exportExcel(){
  if(!state.fileName){showToast('Primero crea o carga una base de datos','error');return;}
  const wb=XLSX.utils.book_new();
  const txH=['id','module','type','amount','date','desc','category','notes','accountId','linkInv','invId','invQty'];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([txH,...state.transactions.map(t=>txH.map(h=>t[h]===undefined||t[h]===null?'':t[h]))]),'Transacciones');
  const invH=['id','name','stock','minStock','price','unit','desc'];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([invH,...state.inventory.map(i=>invH.map(h=>i[h]===undefined||i[h]===null?'':i[h]))]),'Inventario');
  const budH=['id','category','limit','month'];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([budH,...state.budgets.map(b=>budH.map(h=>b[h]===undefined?'':b[h]))]),'Presupuestos');
  const goalH=['id','name','target','current','deadline'];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([goalH,...state.goals.map(g=>goalH.map(h=>g[h]===undefined?'':g[h]))]),'Metas');
  const accH=['id','name'];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([accH,...state.accounts.map(a=>accH.map(h=>a[h]))]),'Cuentas');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([
    ['FinFlow — Base de datos'],['Versión','2.0'],['Fecha',new Date().toLocaleString('es')],
    ['Perfil',state.profile?PROFILES[state.profile].label:'Sin definir'],
    ['Transacciones',state.transactions.length],['Inventario',state.inventory.length],
    ['Presupuestos',state.budgets.length],['Metas',state.goals.length],
    ['Vínculo ventas-inventario',state.settings.linkSalesToInventory?'Activado':'Desactivado']
  ]),'Info');
  XLSX.writeFile(wb,state.fileName);
  state.settings.lastSavedExcelAt=new Date().toISOString();
  scheduleAutosave();
  showToast('Base de datos exportada correctamente');
}

function importExcel(e){
  const file=e.target.files[0];if(!file)return;
  e.target.value=''; // permite volver a elegir el mismo archivo más adelante si hace falta
  const hasData=state.transactions.length>0||state.inventory.length>0;
  const proceed=()=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const wb=XLSX.read(ev.target.result,{type:'array'});
        const txSheet=wb.Sheets['Transacciones'];
        if(!txSheet){showToast('Esta no es una base de datos válida de FinFlow','error');return;}
        const sheetToObjs=(sheet)=>{
          if(!sheet)return[];
          const rows=XLSX.utils.sheet_to_json(sheet,{header:1});
          const h=rows[0]||[];
          return rows.slice(1).filter(r=>r.length>1).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]===undefined?'':r[i]);return o;});
        };
        const newState=defaultState();
        newState.transactions=sheetToObjs(txSheet).map(t=>({...t,amount:Number(t.amount)||0,linkInv:t.linkInv===true||t.linkInv==='true'||t.linkInv===1,invQty:Number(t.invQty)||0}));
        newState.inventory=sheetToObjs(wb.Sheets['Inventario']).map(i=>({...i,stock:Number(i.stock)||0,minStock:Number(i.minStock)||0,price:Number(i.price)||0}));
        newState.budgets=sheetToObjs(wb.Sheets['Presupuestos']).map(b=>({...b,limit:Number(b.limit)||0}));
        newState.goals=sheetToObjs(wb.Sheets['Metas']).map(g=>({...g,target:Number(g.target)||0,current:Number(g.current)||0}));
        const accs=sheetToObjs(wb.Sheets['Cuentas']);
        newState.accounts=accs.length?accs:defaultState().accounts;
        newState.activeAccount=newState.accounts[0].id;
        newState.fileName=file.name;
        newState.currentPage='dashboard';
        newState.profile='all'; // al cargar una base existente, mostramos todos los módulos por seguridad
        state=newState;
        document.getElementById('file-badge').textContent=file.name;
        navigate('dashboard');
        showToast(`Cargado: ${state.transactions.length} movimientos, ${state.inventory.length} productos`);
      }catch(err){showToast('Error al leer la base de datos','error');}
    };
    reader.readAsArrayBuffer(file);
  };
  if(hasData){
    confirmDialog({
      title:'¿Cargar otra base de datos?',
      message:'Esto reemplazará los datos que tienes en pantalla por los del archivo que elegiste. Si no has exportado tus cambios actuales a Excel, se perderán.',
      confirmLabel:'Sí, cargar archivo',
      onConfirm:proceed
    });
  }else{
    proceed();
  }
}
