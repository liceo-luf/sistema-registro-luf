'use strict';
/* Demo only: fictional students and browser-local storage. No server or authentication. */
const modules=[['atrasos','Atrasos','Ingreso posterior al horario'],['retiros','Retiros','Salida con adulto responsable'],['pases','Pases de almuerzo','Salida y regreso de almuerzo'],['temprano','Retiro temprano','Salida con autorización'],['ingreso','Ingreso tarde','Ingreso con pase'],['almuerzo','Almuerzo','Registro del servicio de alimentación']];
let students=[{id:'LUF-001',name:'Camila Pérez',rut:'11111111-1',course:'1° A'},{id:'LUF-002',name:'Matías Soto',rut:'22222222-2',course:'2° B'},{id:'LUF-003',name:'Valentina Rojas',rut:'33333333-3',course:'3° C'},{id:'LUF-004',name:'Diego Muñoz',rut:'44444444-4',course:'4° A'}];
const key='sistema-registro-luf-demo-v1';
const rosterKey='sistema-registro-luf-students-demo-v1';
const $=id=>document.getElementById(id);
try{const saved=JSON.parse(localStorage.getItem(rosterKey)||'null');if(Array.isArray(saved))students=saved}catch{}
let current='atrasos',selected=null,records=load();
const tardyKey='sistema-registro-luf-tardy-settings-v1';
const tardyDefaults={start:'08:10',tolerance:10,exception:'08:30',alert:3};
let tardySettings={...tardyDefaults};
try{const stored=JSON.parse(localStorage.getItem(tardyKey)||'null');if(stored&&typeof stored==='object')tardySettings={...tardyDefaults,...stored}}catch{}
function minuteOf(time){const [h,m]=time.split(':').map(Number);return h*60+m}
function tardyMonthly(id){const month=dateKey(new Date()).slice(0,7);return records.filter(r=>r.module==='atrasos'&&r.passType!=='Ingreso con pase'&&r.passType!=='Justificación del apoderado'&&r.studentId===id&&r.at&&dateKey(new Date(r.at)).startsWith(month))}
function updateTardySummary(){const box=$('tardy-summary');if(!selected){box.textContent='Selecciona o escanea un estudiante para ver sus atrasos del mes.';return}const list=tardyMonthly(selected.id);const normal=list.filter(r=>r.type==='Normal').length,exceptional=list.filter(r=>r.type==='Excepcional').length;box.textContent=selected.name+' · Este mes: '+normal+' normales y '+exceptional+' excepcionales ('+list.length+' en total).'+(list.length>=tardySettings.alert?' ⚠ Umbral de alerta alcanzado.':'')}
function loadTardySettings(){for(const [field,key] of [['tardy-start','start'],['tardy-tolerance','tolerance'],['tardy-exception-time','exception'],['tardy-alert-count','alert']])$(field).value=tardySettings[key]}
loadTardySettings();
$('tardy-save').addEventListener('click',()=>{const next={start:$('tardy-start').value,exception:$('tardy-exception-time').value,tolerance:Number($('tardy-tolerance').value),alert:Number($('tardy-alert-count').value)};if(!/^\d\d:\d\d$/.test(next.start)||!/^\d\d:\d\d$/.test(next.exception)||next.exception<=next.start||!Number.isInteger(next.tolerance)||next.tolerance<0||next.tolerance>60||!Number.isInteger(next.alert)||next.alert<1||next.alert>30){$('tardy-config-feedback').textContent='Revisa los horarios y los valores.';return}try{localStorage.setItem(tardyKey,JSON.stringify(next));tardySettings=next;$('tardy-config-feedback').textContent='Configuración de prueba guardada.';updateTardySummary();refreshTardyPass()}catch{$('tardy-config-feedback').textContent='No se pudo guardar la configuración.'}});

function refreshTardyPass(){const area=$('tardy-pass-actions');if(!area)return;const last=selected&&records.filter(r=>r.module==='atrasos'&&r.studentId===selected.id&&dateKey(new Date(r.at))===dateKey(new Date())).at(-1);area.hidden=current!=='atrasos'||!selected;area.dataset.recordId=last?.id||'';if(last){$('tardy-pass-type').value=last.passType||'Atraso habitual';$('tardy-pass-note').value=last.passNote||'';syncPassButtons()}}
function printTardyPass(){
 const record=records.find(r=>r.id===$('tardy-pass-actions').dataset.recordId);
 const student=record&&students.find(s=>s.id===record.studentId);
 if(!record||!student)return;
 const popup=window.open('','_blank','width=480,height=680');
 if(!popup){alert('Permite las ventanas emergentes para imprimir el pase.');return}
 record.passType=$('tardy-pass-type').value;
 record.passNote=$('tardy-pass-note').value.trim();
 if(!persist()){popup.close();alert('No se pudo guardar el tipo de pase.');return}
 const safe=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const stamp=new Date(record.at);
 const justified=record.passType==='Justificación del apoderado';
 const subtitle=justified?'INGRESO JUSTIFICADO':record.passType==='Ingreso con pase'?'INGRESO CON PASE':'ATRASO REGISTRADO';
 const explanation=justified?'Se autoriza el ingreso del estudiante a clases, habiéndose registrado la justificación correspondiente en Inspectoría General.':record.passType==='Ingreso con pase'?'Se autoriza el ingreso del estudiante a clases mediante pase emitido por Inspectoría General.':'Se solicita permitir el ingreso del estudiante a clases, habiéndose registrado su atraso.';
 const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ticket de ingreso LUF</title><style>
 @page{size:58mm 85mm;margin:2mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000;font:10px Arial,sans-serif}
 .ticket{width:54mm;max-width:100%;padding:2mm 1mm;overflow-wrap:anywhere}.center{text-align:center}.school{font-size:10px;font-weight:800}.small{font-size:9px}
 h1{font-size:12px;margin:7px 0 3px}.status{font-size:10px;font-weight:800;margin:3px 0 8px}
 .rule{border-top:1px dashed #111;margin:6px 0}.line{margin:4px 0;line-height:1.3}
 .signature{margin-top:18px;text-align:center;font-size:9px}.signature:before{content:"________________________";display:block;margin-bottom:4px}
 @media screen{body{padding:18px}.ticket{margin:auto;border:1px solid #ddd}}
 </style></head><body><article class="ticket"><div class="center school">LICEO LUIS URBINA FLORES</div><div class="center small">INSPECTORÍA GENERAL</div><div class="rule"></div>
 <h1 class="center">PASE DE INGRESO</h1><div class="center status">${safe(subtitle)}</div>
 <div class="line"><b>Estudiante:</b> ${safe(student.name)}</div>
 <div class="line"><b>Curso:</b> ${safe(student.course)}</div>
 <div class="line"><b>Fecha:</b> ${safe(stamp.toLocaleDateString('es-CL'))}</div>
 <div class="line"><b>Hora:</b> ${safe(stamp.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}))}</div>
 ${record.passNote?'<div class="line"><b>Observación:</b> '+safe(record.passNote)+'</div>':''}
 <div class="rule"></div><div class="center small">Se autoriza el ingreso a clases.</div>
 <div class="signature">Inspectoría General</div></article></body></html>`;
 popup.document.open();popup.document.write(html);popup.document.close();popup.focus();popup.print();
}
function syncPassButtons(){document.querySelectorAll('.pass-type-btn').forEach(button=>{const active=button.dataset.passType===$('tardy-pass-type').value;button.setAttribute('aria-pressed',String(active));button.classList.toggle('pass-type-active',active)})}
document.querySelectorAll('.pass-type-btn').forEach(button=>button.addEventListener('click',()=>{
 if(!selected||current!=='atrasos')return;
 const passType=button.dataset.passType;
 let record=records.find(r=>r.id===$('tardy-pass-actions').dataset.recordId);
 if(!record){
   record={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random(),at:new Date().toISOString(),module:'atrasos',studentId:selected.id,type:passType==='Atraso habitual'?'Normal':'Ingreso autorizado',reason:'',passType};
   records.push(record);
   if(!persist()){records.pop();$('feedback').textContent='No se pudo guardar el ingreso.';return}
 }else if(record.passType!==passType){
   record.passType=passType;
   record.type=passType==='Atraso habitual'?'Normal':'Ingreso autorizado';
   if(!persist()){$('feedback').textContent='No se pudo actualizar el motivo.';return}
 }
 $('tardy-pass-type').value=passType;
 refreshTardyPass();renderStats();renderHistory();updateTardySummary();
 printTardyPass();
}));
$('print-tardy-pass').addEventListener('click',printTardyPass);
function load(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data:[]}catch{return []}}
function persist(){try{localStorage.setItem(key,JSON.stringify(records));return true}catch{return false}}
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node}
function dateKey(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function todayRecords(){const day=dateKey(new Date());return records.filter(r=>dateKey(new Date(r.at))===day)}
function renderStats(){const today=todayRecords();const values=[['Movimientos hoy',today.length],['Atrasos hoy',today.filter(r=>r.module==='atrasos'&&r.passType!=='Ingreso con pase'&&r.passType!=='Justificación del apoderado').length],['Retiros hoy',today.filter(r=>r.module==='retiros'||r.module==='temprano').length],['Almuerzos hoy',today.filter(r=>r.module==='almuerzo').length]];$('stats').replaceChildren(...values.map(([label,value])=>{const card=el('div',undefined,'stat');card.append(el('small',label),el('strong',String(value)));return card}))}
function renderModules(){$('modules').replaceChildren(...modules.map(([id,title,desc])=>{const btn=el('button',title,'module theme-'+id+(id===current?' active':''));btn.type='button';btn.append(el('span',desc));btn.addEventListener('click',()=>{current=id;selected=null;$('student-search').value='';$('reason').value='';$('exceptional').checked=false;$('selected').hidden=true;$('matches').replaceChildren();$('feedback').textContent='';render()});return btn}))}
function renderHistory(){const body=$('history');body.replaceChildren();const rows=records.filter(r=>r.module===current).slice().reverse().slice(0,20);if(!rows.length){const tr=el('tr');const td=el('td','Sin movimientos registrados en este módulo.');td.colSpan=5;tr.append(td);body.append(tr);return}for(const r of rows){const tr=el('tr');const s=students.find(x=>x.id===r.studentId);const values=[new Date(r.at).toLocaleString('es-CL'),s?s.name:'Desconocido',modules.find(m=>m[0]===r.module)?.[1]||r.module,r.type,r.reason||'—'];tr.append(...values.map(v=>el('td',v)));body.append(tr)}}
function render(){document.body.className='theme-'+current;scanInput.disabled=current==='retiros';scanInput.placeholder=current==='retiros'?'QR desactivado en Retiros':'Escanea aquí: LUF-001';$('student-search').placeholder=current==='retiros'?'Ingrese RUT del estudiante (obligatorio)':'Buscar estudiante por nombre, RUT o código QR';renderModules();const m=modules.find(x=>x[0]===current);$('module-title').textContent=m[1];$('module-desc').textContent=m[2];renderStats();renderHistory();$('tardy-counter').hidden=current!=='atrasos';updateTardySummary()}
function search(){const q=$('student-search').value.trim().toLocaleLowerCase('es-CL');selected=null;$('selected').hidden=true;const list=$('matches');list.replaceChildren();if(q.length<2)return;const hits=students.filter(s=>s.active!==false).filter(s=>current==='retiros'?s.rut.toLocaleLowerCase('es-CL').replace(/[^0-9k]/g,'').includes(q.replace(/[^0-9k]/g,'')):[s.name,s.rut,s.id,s.course].some(v=>v.toLocaleLowerCase('es-CL').includes(q))).slice(0,6);for(const s of hits){const b=el('button',s.name+' · '+s.course+' · '+s.id,'match');b.type='button';b.addEventListener('click',()=>{choose(s);if(current==='retiros')attentionOpen(s,'RUT ingresado por funcionario. Verifica los datos del estudiante.')});list.append(b)}}
function choose(s){selected=s;updateTardySummary();refreshTardyPass();$('student-search').value=s.name;$('selected').textContent=s.name+' · '+s.course+' · '+s.rut;$('selected').hidden=false;$('matches').replaceChildren()}
$('student-search').addEventListener('input',search);
$('student-search').addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const q=$('student-search').value.trim().toLowerCase();const exact=students.find(s=>s.active!==false&&(current==='retiros'?s.rut.toLowerCase().replace(/[^0-9k]/g,'')===q.replace(/[^0-9k]/g,''):s.id.toLowerCase()===q||s.rut.toLowerCase()===q));const first=$('matches').querySelector('button');if(exact){choose(exact);attentionOpen(exact,'Estudiante seleccionado manualmente.')}else if(first)first.click()});
$('movement-form').addEventListener('submit',e=>{e.preventDefault();const feedback=$('feedback');feedback.className='';if(!selected||selected.active===false){feedback.textContent='Selecciona un estudiante activo de la lista.';feedback.className='error';return}if(current==='retiros'&&!$('reason').value.includes('RUT:')){feedback.textContent='El retiro requiere identificar al adulto y verificar su autorización en la pantalla de atención.';feedback.className='error';return}const exceptional=$('exceptional').checked,reason=$('reason').value.trim();if(exceptional&&!reason){feedback.textContent='Indica el motivo del registro excepcional.';feedback.className='error';return}const today=todayRecords();if(current==='almuerzo'&&today.some(r=>r.module==='almuerzo'&&r.studentId===selected.id)){feedback.textContent='Este estudiante ya tiene un almuerzo registrado hoy.';feedback.className='error';return}let type=exceptional?'Excepcional':'Normal';
if(current==='atrasos'){
 const now=new Date(),minutes=now.getHours()*60+now.getMinutes();
 const previous=today.find(r=>r.module==='atrasos'&&r.studentId===selected.id);if(previous){feedback.textContent='Estudiante con atraso registrado hoy a las '+new Date(previous.at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})+'. No se genera otro registro.';feedback.className='error';return}
 if(minutes<=minuteOf(tardySettings.start)+(selected.tardyException?20:tardySettings.tolerance)){feedback.textContent='Todavía está dentro del horario permitido. No se registra atraso.';feedback.className='error';return}
 const needsExceptional=false;
 if(needsExceptional&&!exceptional){feedback.textContent='Fuera del horario normal: marca Registro excepcional e indica el motivo.';feedback.className='error';return}
 if(needsExceptional&&!reason){feedback.textContent='El atraso excepcional requiere motivo.';feedback.className='error';return}
}
if(current==='pases'){const last=records.filter(r=>r.module==='pases'&&r.studentId===selected.id).at(-1);type=last?.type==='Salida'?'Regreso':'Salida'}const record={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random(),at:new Date().toISOString(),module:current,studentId:selected.id,type,reason};records.push(record);if(!persist()){records.pop();feedback.textContent='No se pudo guardar el registro en este navegador.';feedback.className='error';return}feedback.textContent='Movimiento registrado correctamente (solo en este navegador).';$('reason').value='';$('exceptional').checked=false;renderStats();renderHistory();updateTardySummary();refreshTardyPass();if(current==='atrasos'&&tardyMonthly(selected.id).length>=tardySettings.alert)feedback.textContent+=' ⚠ Umbral mensual de atrasos alcanzado.'});
function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
$('export').addEventListener('click',()=>{const rows=[['Fecha y hora','Código','Estudiante','Curso','Módulo','Tipo','Observación'],...records.filter(r=>r.module===current).map(r=>{const s=students.find(x=>x.id===r.studentId);return [new Date(r.at).toLocaleString('es-CL'),r.studentId,s?.name||'',s?.course||'',r.module,r.type,r.reason]})];const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='luf-'+current+'-'+dateKey(new Date())+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('reset').addEventListener('click',()=>{if(!confirm('¿Eliminar todos los movimientos ficticios guardados en este navegador?'))return;records=[];localStorage.removeItem(key);$('feedback').textContent='Datos de prueba restablecidos.';render()});
function tick(){$('clock').textContent=new Date().toLocaleString('es-CL',{dateStyle:'full',timeStyle:'short'})}tick();setInterval(tick,30000);render();
// USB scanners operating as keyboards typically append Enter after the code.
const scanInput=$('scan-input');
const recentScans=[];
let identityTimer;

let attentionPending=false,attentionAction='';
function attentionOpen(student,message){
 if(!student)return;
 $('attention-overlay').hidden=false;
 $('attention-name').textContent=student.name;
 $('attention-course').textContent=student.course+' · '+student.id;
 $('attention-avatar').textContent=student.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 $('attention-message').textContent=message||'Selecciona el movimiento correspondiente.';
 $('attention-feedback').textContent='';
 $('attention-adult').hidden=true;
 $('attention-adult-name').value='';
 $('attention-adult-rut').value='';
 $('attention-verified').checked=false;
 $('attention-confirm').hidden=true;
 attentionPending=false;attentionAction='';
 const area=$('attention-actions');area.replaceChildren();
 const actions=current==='atrasos'?[['Atraso habitual','Atraso'],['Ingreso con pase','Con pase'],['Justificación del apoderado','Justificado']]:current==='retiros'||current==='temprano'?[['Titular','Apoderado titular'],['Suplente','Apoderado suplente'],['Otro autorizado','Otro autorizado']]:current==='pases'?[['Salida','Registrar salida'],['Regreso','Registrar regreso']]:current==='almuerzo'?[['Almuerzo','Registrar almuerzo']]:[['Ingreso con pase','Con pase'],['Justificación del apoderado','Justificado'],['Sin justificación','Sin justificación']];
 for(const [value,label] of actions){
  const btn=el('button',label);btn.type='button';
  btn.addEventListener('click',()=>{
   attentionAction=value;
   area.querySelectorAll('button').forEach(b=>b.classList.toggle('chosen',b===btn));
   if(current==='atrasos'){
    const passBtn=[...document.querySelectorAll('.pass-type-btn')].find(b=>b.dataset.passType===value);
    if(passBtn){passBtn.click();$('attention-feedback').textContent='Pase preparado para impresión. Puedes escanear al siguiente estudiante.'}
    attentionPending=false;return;
   }
   attentionPending=true;
   $('attention-adult').hidden=!(current==='retiros'||current==='temprano');
   $('attention-confirm').hidden=false;
   $('attention-feedback').textContent='Confirma el movimiento antes de continuar.';
  });
  area.append(btn);
 }
}
$('attention-close').addEventListener('click',()=>{
 if(attentionPending&&!window.confirm('Hay un movimiento sin confirmar. ¿Descartarlo?'))return;
 $('attention-overlay').hidden=true;attentionPending=false;focusScanner();
});
$('attention-confirm').addEventListener('click',()=>{
 if(!selected||!attentionAction)return;
 if(current==='retiros'||current==='temprano'){
  const adult=$('attention-adult-name').value.trim();
  const adultRut=$('attention-adult-rut').value.trim();
  if(!adult||!adultRut){$('attention-feedback').textContent='Ingresa nombre y RUT del adulto que retira.';return}
  if(!$('attention-verified').checked){$('attention-feedback').textContent='Debes confirmar que verificaste la identidad y autorización del adulto.';return}
  $('reason').value='Adulto que retira ('+attentionAction+'): '+adult+' · RUT: '+adultRut;
 }else if(current==='ingreso'){$('reason').value=attentionAction}
 const before=records.length;
 $('movement-form').requestSubmit();
 if(records.length>before){attentionPending=false;$('attention-confirm').hidden=true;$('attention-feedback').textContent='✓ Movimiento registrado. Puedes escanear la siguiente credencial.'}
 else $('attention-feedback').textContent=$('feedback').textContent||'No se pudo registrar.';
});

function showIdentity(student,message,status){const card=$('scan-identity');clearTimeout(identityTimer);card.hidden=false;card.className='scan-identity '+(status||'');$('scan-avatar').textContent=student?student.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase():'?';$('scan-person-name').textContent=student?.name||'Código no reconocido';$('scan-person-course').textContent=student?.course||'Revisa la credencial';$('scan-person-result').textContent=message;if(current!=='atrasos')identityTimer=setTimeout(()=>{card.hidden=true},3000)}
function showScan(message,status,student){
 const box=$('scan-status');box.textContent=message;box.className='scan-status'+(status==='error'?' error':status==='warning'?' warning':'');
 recentScans.unshift({message,at:new Date(),student:student?.name||''});recentScans.length=Math.min(recentScans.length,5);
 const list=$('scan-recent');list.replaceChildren();for(const item of recentScans){const li=el('li',item.message);li.append(el('small',item.at.toLocaleTimeString('es-CL')));list.append(li)}
}
function focusScanner(){if(document.visibilityState==='visible'&&current!=='retiros')scanInput.focus({preventScroll:true})}
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
 if(current==='retiros'){showScan('En Retiros ingresa manualmente el RUT del estudiante. El QR está desactivado.','warning');return}
 const student=students.find(s=>s.active!==false&&s.id.toUpperCase()===code);
 if(!student){showScan('Código no reconocido: '+(code||'(vacío)'),'error');showIdentity(null,'Código no reconocido','error');focusScanner();return}
 if(attentionPending&&!window.confirm('Hay un movimiento pendiente. ¿Descartarlo para atender al siguiente estudiante?')){focusScanner();return}
 choose(student);
 attentionOpen(student,'Credencial leída correctamente.');
 if(current==='atrasos'){const previous=todayRecords().find(r=>r.module==='atrasos'&&r.studentId===student.id);if(previous){const msg='Estudiante con ingreso registrado hoy a las '+new Date(previous.at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})+'. No se genera otro registro; puedes emitir el pase desde su tarjeta.';showScan(msg,'warning',student);showIdentity(student,msg,'warning');$('feedback').textContent=msg;focusScanner();setTimeout(focusScanner,0);return}}
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
