'use strict';
/* Demo only: fictional students and browser-local storage. No server or authentication. */
const modules=[['atrasos','Atrasos','Ingreso posterior al horario'],['retiros','Retiros','Salida con adulto responsable'],['pases','Pases de almuerzo','Salida y regreso de almuerzo'],['temprano','Retiro temprano','Salida con autorización'],['ingreso','Ingreso tarde','Ingreso con pase'],['almuerzo','Almuerzo','Registro del servicio de alimentación']];
let students=[{id:'LUF-001',name:'Camila Pérez',rut:'11111111-1',course:'1° A'},{id:'LUF-002',name:'Matías Soto',rut:'22222222-2',course:'2° B'},{id:'LUF-003',name:'Valentina Rojas',rut:'33333333-3',course:'3° C'},{id:'LUF-004',name:'Diego Muñoz',rut:'44444444-4',course:'4° A'}];
const key='sistema-registro-luf-demo-v1';
const rosterKey='sistema-registro-luf-students-demo-v1';
const $=id=>document.getElementById(id);
try{const saved=JSON.parse(localStorage.getItem(rosterKey)||'null');if(Array.isArray(saved))students=saved}catch{}
let current='atrasos',selected=null,records=load();
function load(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data:[]}catch{return []}}
function persist(){try{localStorage.setItem(key,JSON.stringify(records));return true}catch{return false}}
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node}
function dateKey(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function todayRecords(){const day=dateKey(new Date());return records.filter(r=>dateKey(new Date(r.at))===day)}
function renderStats(){const today=todayRecords();const values=[['Movimientos hoy',today.length],['Atrasos hoy',today.filter(r=>r.module==='atrasos').length],['Retiros hoy',today.filter(r=>r.module==='retiros'||r.module==='temprano').length],['Almuerzos hoy',today.filter(r=>r.module==='almuerzo').length]];$('stats').replaceChildren(...values.map(([label,value])=>{const card=el('div',undefined,'stat');card.append(el('small',label),el('strong',String(value)));return card}))}
function renderModules(){$('modules').replaceChildren(...modules.map(([id,title,desc])=>{const btn=el('button',title,'module'+(id===current?' active':''));btn.type='button';btn.append(el('span',desc));btn.addEventListener('click',()=>{current=id;selected=null;$('student-search').value='';$('reason').value='';$('exceptional').checked=false;$('selected').hidden=true;$('matches').replaceChildren();$('feedback').textContent='';render()});return btn}))}
function renderHistory(){const body=$('history');body.replaceChildren();const rows=records.filter(r=>r.module===current).slice().reverse().slice(0,20);if(!rows.length){const tr=el('tr');const td=el('td','Sin movimientos registrados en este módulo.');td.colSpan=5;tr.append(td);body.append(tr);return}for(const r of rows){const tr=el('tr');const s=students.find(x=>x.id===r.studentId);const values=[new Date(r.at).toLocaleString('es-CL'),s?s.name:'Desconocido',modules.find(m=>m[0]===r.module)?.[1]||r.module,r.type,r.reason||'—'];tr.append(...values.map(v=>el('td',v)));body.append(tr)}}
function render(){renderModules();const m=modules.find(x=>x[0]===current);$('module-title').textContent=m[1];$('module-desc').textContent=m[2];renderStats();renderHistory()}
function search(){const q=$('student-search').value.trim().toLocaleLowerCase('es-CL');selected=null;$('selected').hidden=true;const list=$('matches');list.replaceChildren();if(q.length<2)return;const hits=students.filter(s=>s.active!==false).filter(s=>[s.name,s.rut,s.id,s.course].some(v=>v.toLocaleLowerCase('es-CL').includes(q))).slice(0,6);for(const s of hits){const b=el('button',s.name+' · '+s.course+' · '+s.id,'match');b.type='button';b.addEventListener('click',()=>choose(s));list.append(b)}}
function choose(s){selected=s;$('student-search').value=s.name;$('selected').textContent=s.name+' · '+s.course+' · '+s.rut;$('selected').hidden=false;$('matches').replaceChildren()}
$('student-search').addEventListener('input',search);
$('student-search').addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const q=$('student-search').value.trim().toLowerCase();const exact=students.find(s=>s.id.toLowerCase()===q||s.rut.toLowerCase()===q);const first=$('matches').querySelector('button');if(exact)choose(exact);else if(first)first.click()});
$('movement-form').addEventListener('submit',e=>{e.preventDefault();const feedback=$('feedback');feedback.className='';if(!selected||selected.active===false){feedback.textContent='Selecciona un estudiante activo de la lista.';feedback.className='error';return}const exceptional=$('exceptional').checked,reason=$('reason').value.trim();if(exceptional&&!reason){feedback.textContent='Indica el motivo del registro excepcional.';feedback.className='error';return}const today=todayRecords();if(current==='almuerzo'&&today.some(r=>r.module==='almuerzo'&&r.studentId===selected.id)){feedback.textContent='Este estudiante ya tiene un almuerzo registrado hoy.';feedback.className='error';return}let type=exceptional?'Excepcional':'Normal';if(current==='pases'){const last=records.filter(r=>r.module==='pases'&&r.studentId===selected.id).at(-1);type=last?.type==='Salida'?'Regreso':'Salida'}const record={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random(),at:new Date().toISOString(),module:current,studentId:selected.id,type,reason};records.push(record);if(!persist()){records.pop();feedback.textContent='No se pudo guardar el registro en este navegador.';feedback.className='error';return}feedback.textContent='Movimiento registrado correctamente (solo en este navegador).';$('reason').value='';$('exceptional').checked=false;renderStats();renderHistory()});
function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
$('export').addEventListener('click',()=>{const rows=[['Fecha y hora','Código','Estudiante','Curso','Módulo','Tipo','Observación'],...records.filter(r=>r.module===current).map(r=>{const s=students.find(x=>x.id===r.studentId);return [new Date(r.at).toLocaleString('es-CL'),r.studentId,s?.name||'',s?.course||'',r.module,r.type,r.reason]})];const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='luf-'+current+'-'+dateKey(new Date())+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('reset').addEventListener('click',()=>{if(!confirm('¿Eliminar todos los movimientos ficticios guardados en este navegador?'))return;records=[];localStorage.removeItem(key);$('feedback').textContent='Datos de prueba restablecidos.';render()});
function tick(){$('clock').textContent=new Date().toLocaleString('es-CL',{dateStyle:'full',timeStyle:'short'})}tick();setInterval(tick,30000);render();
// USB scanners operating as keyboards typically append Enter after the code.
const scanInput=$('scan-input');
const recentScans=[];
let identityTimer;
function showIdentity(student,message,status){const card=$('scan-identity');clearTimeout(identityTimer);card.hidden=false;card.className='scan-identity '+(status||'');$('scan-avatar').textContent=student?student.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase():'?';$('scan-person-name').textContent=student?.name||'Código no reconocido';$('scan-person-course').textContent=student?.course||'Revisa la credencial';$('scan-person-result').textContent=message;identityTimer=setTimeout(()=>{card.hidden=true},3000)}
function showScan(message,status,student){
 const box=$('scan-status');box.textContent=message;box.className='scan-status'+(status==='error'?' error':status==='warning'?' warning':'');
 recentScans.unshift({message,at:new Date(),student:student?.name||''});recentScans.length=Math.min(recentScans.length,5);
 const list=$('scan-recent');list.replaceChildren();for(const item of recentScans){const li=el('li',item.message);li.append(el('small',item.at.toLocaleTimeString('es-CL')));list.append(li)}
}
function focusScanner(){if(document.visibilityState==='visible')scanInput.focus({preventScroll:true})}
function isEditingField(target){return target instanceof HTMLElement&&(target.matches('input:not(#scan-input), textarea, select, [contenteditable="true"]')||Boolean(target.closest('[contenteditable="true"]')))}
// Recover focus after ordinary clicks, but never interrupt manual editing.
document.addEventListener('click',event=>{if(!isEditingField(event.target))setTimeout(focusScanner,0)});
window.addEventListener('focus',()=>setTimeout(focusScanner,0));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(focusScanner,0)});
$('scan-focus').addEventListener('click',focusScanner);
scanInput.addEventListener('keydown',event=>{
 if(event.key!=='Enter')return;
 event.preventDefault();
 const code=scanInput.value.trim().toUpperCase();scanInput.value='';
 const student=students.find(s=>s.active!==false&&s.id.toUpperCase()===code);
 if(!student){showScan('Código no reconocido: '+(code||'(vacío)'),'error');showIdentity(null,'Código no reconocido','error');focusScanner();return}
 choose(student);
 if((current==='atrasos'||current==='almuerzo')&&!$('exceptional').checked&&!$('reason').value.trim()){
   const before=records.length;
   $('movement-form').requestSubmit();
   if(records.length>before){showScan('✓ '+student.name+' · '+student.course+' · registro exitoso','success',student);showIdentity(student,'✓ Movimiento registrado','success')}
   else{showScan('Atención: '+student.name+' · '+$('feedback').textContent,'warning',student);showIdentity(student,$('feedback').textContent,'warning')}
 }else{
   showScan('Identificado: '+student.name+' · '+student.course+' · requiere confirmación manual','warning',student);showIdentity(student,'Pendiente de confirmación manual','warning');
   $('feedback').textContent='Completa los datos y confirma manualmente el movimiento.';
 }
 focusScanner();
 // Some USB readers or browsers move focus after Enter; restore it after that event finishes.
 setTimeout(focusScanner,0);
});
// Start ready for the first scan. Scanning keeps focus on the same field.
focusScanner();
