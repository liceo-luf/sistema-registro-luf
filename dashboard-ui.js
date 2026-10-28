'use strict';
// Home dashboard uses the existing operational forms without duplicating record logic.
const home=document.createElement('section');home.id='dashboard-home';home.className='dashboard-home';
home.innerHTML='<div class="dashboard-hero"><div><h1>Registro de movimientos</h1><p>Selecciona un módulo para registrar y revisar operaciones.</p></div><div class="dashboard-time" id="dashboard-clock"></div></div><div class="dashboard-module-grid" id="dashboard-module-grid"></div><div class="dashboard-bottom"><section class="dashboard-card"><div class="dashboard-card-head"><h2>Últimos registros</h2><button type="button" id="dashboard-history-link">Ver historial completo →</button></div><div class="table-wrap"><table><thead><tr><th>Hora</th><th>Estudiante</th><th>Módulo</th><th>Tipo</th><th>Funcionario</th></tr></thead><tbody id="dashboard-recent"></tbody></table></div></section><section class="dashboard-card"><div class="dashboard-card-head"><h2>Información del sistema</h2></div><div id="dashboard-information"></div></section></div>';
document.querySelector('main').insertBefore(home,document.querySelector('.intro'));
const moduleMeta={atrasos:['Ingreso tarde','Registra ingresos posteriores al horario oficial','↪','green','Registrar ingreso'],ingreso:['Ingreso con pase','Ingresos autorizados fuera del horario','▣','blue','Registrar ingreso'],pases:['Pases de almuerzo','Registra salidas y regresos de almuerzo','♜','blue','Registrar pase'],temprano:['Retiro temprano','Salidas autorizadas antes del término de la jornada','➜','orange','Registrar salida'],retiros:['Retiros','Salida con adulto responsable','♟','purple','Registrar retiro'],almuerzo:['Almuerzo','Registro del servicio de alimentación','◉','teal','Registrar almuerzo']};
const order=['atrasos','pases','temprano','retiros','ingreso','almuerzo'];
const grid=document.getElementById('dashboard-module-grid');
order.forEach(id=>{
 const [name,desc,symbol,color,action]=moduleMeta[id];
 const card=document.createElement('article');card.className='dashboard-module '+color;
 card.innerHTML='<div class="dashboard-module-head"><div class="dashboard-module-icon" aria-hidden="true">'+symbol+'</div><div><h2>'+name+'</h2><p>'+desc+'</p></div></div><div class="dashboard-module-scan"><span aria-hidden="true">▣</span> Escanear QR o ingresar código...</div><button type="button" class="dashboard-module-button">'+action+'</button><div class="dashboard-module-foot">'+(id==='temprano'?'Según autorización':id==='pases'?'Salida y regreso':id==='retiros'?'Verificación de apoderado':'Control institucional')+'</div>';
 card.querySelector('button').addEventListener('click',()=>openModule(id));
 grid.append(card);
});
function openModule(id){
 const button=Array.from(document.querySelectorAll('#modules .module')).find(b=>b.classList.contains('theme-'+id));
 if(button)button.click();
 document.body.classList.add('dashboard-detail');
 window.scrollTo({top:0,behavior:'smooth'});
}
function refreshDashboard(){
 const rows=records.slice().reverse().slice(0,8),body=document.getElementById('dashboard-recent');body.replaceChildren();
 for(const r of rows){const st=students.find(s=>s.id===r.studentId),tr=document.createElement('tr');for(const v of [new Date(r.at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}),st?.name||r.studentId,modules.find(m=>m[0]===r.module)?.[1]||r.module,r.annulled?'ANULADO':r.type,r.operator||'—']){const td=document.createElement('td');td.textContent=v;tr.append(td)}body.append(tr)}
 if(!rows.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=5;td.textContent='Todavía no hay movimientos registrados.';tr.append(td);body.append(tr)}
 const info=document.getElementById('dashboard-information');info.replaceChildren();
 for(const [label,value] of [['Fecha',new Date().toLocaleDateString('es-CL',{dateStyle:'full'})],['Hora actual',new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})],['Estudiantes registrados',String(students.filter(s=>s.active!==false).length)],['Registros hoy',String(todayRecords().length)]]){const line=document.createElement('div');line.className='dashboard-info-line';const left=document.createElement('span');left.textContent=label;const right=document.createElement('strong');right.textContent=value;line.append(left,right);info.append(line)}
 document.getElementById('dashboard-clock').textContent=new Date().toLocaleString('es-CL',{dateStyle:'full',timeStyle:'short'});
}
document.getElementById('dashboard-history-link').addEventListener('click',()=>openModule(current));
const back=document.createElement('button');back.type='button';back.id='dashboard-back';back.className='secondary';back.textContent='← Volver al inicio';back.addEventListener('click',()=>{document.body.classList.remove('dashboard-detail');refreshDashboard();window.scrollTo({top:0,behavior:'smooth'})});
document.querySelector('.intro').prepend(back);
document.getElementById('tab-register').addEventListener('click',()=>{document.body.classList.remove('dashboard-detail');refreshDashboard()});
const oldRenderStats=renderStats;
renderStats=function(){oldRenderStats();refreshDashboard()};
refreshDashboard();
setInterval(()=>{if(!document.hidden)refreshDashboard()},60000);
