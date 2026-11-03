'use strict';
/* Demo only: fictional students and browser-local storage. No server or authentication. */
const modules=[['atrasos','Atrasos','Ingreso posterior al horario'],['retiros','Retiros','Salida con adulto responsable'],['pases','Pases de almuerzo','Salida y regreso de almuerzo'],['temprano','Retiro temprano','Salida con autorización'],['ingreso','Ingreso tarde','Ingreso con pase'],['almuerzo','Almuerzo','Registro del servicio de alimentación']];
let students=[{id:'LUF-001',name:'Camila Pérez',rut:'11111111-1',course:'1° A'},{id:'LUF-002',name:'Matías Soto',rut:'22222222-2',course:'2° B'},{id:'LUF-003',name:'Valentina Rojas',rut:'33333333-3',course:'3° C'},{id:'LUF-004',name:'Diego Muñoz',rut:'44444444-4',course:'4° A'}];
const key='sistema-registro-luf-demo-v1';
const rosterKey='sistema-registro-luf-students-demo-v1';
const $=id=>document.getElementById(id);
const scanInput=$('scan-input');
try{const saved=JSON.parse(localStorage.getItem(rosterKey)||'null');if(Array.isArray(saved))students=saved}catch{}
let current='atrasos',selected=null,records=load();
const tardyKey='sistema-registro-luf-tardy-settings-v1';
const tardyDefaults={start:'08:10',tolerance:10,exception:'08:30',alert:3};
let tardySettings={...tardyDefaults};
try{const stored=JSON.parse(localStorage.getItem(tardyKey)||'null');if(stored&&typeof stored==='object')tardySettings={...tardyDefaults,...stored}}catch{}
function minuteOf(time){const [h,m]=time.split(':').map(Number);return h*60+m}
function countsAsLate(r){return !r.annulled&&(r.module==='atrasos'&&r.passType!=='Ingreso con pase'&&r.passType!=='Justificación del apoderado'||r.module==='ingreso'&&!r.justified)}
function tardyMonthly(id){const month=dateKey(new Date()).slice(0,7);return records.filter(r=>countsAsLate(r)&&r.studentId===id&&r.at&&dateKey(new Date(r.at)).startsWith(month))}
function updateTardySummary(){const box=$('tardy-summary');if(!selected){box.textContent='Selecciona o escanea un estudiante para ver sus atrasos del mes.';return}const list=tardyMonthly(selected.id);const normal=list.filter(r=>r.module==='atrasos'&&r.type==='Normal').length,exceptional=list.filter(r=>r.module==='atrasos'&&r.type==='Excepcional').length,late=list.filter(r=>r.module==='ingreso').length;box.textContent=selected.name+' · Este mes: '+normal+' normales, '+exceptional+' excepcionales y '+late+' ingresos tarde sin justificar ('+list.length+' en total).'+(list.length>=tardySettings.alert?' ⚠ Umbral de alerta alcanzado.':'')}
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
const lateFields=el('section');lateFields.id='late-fields';lateFields.hidden=true;lateFields.style.cssText='display:none;gap:9px;padding:15px;border:1px solid #34546a;border-radius:12px;margin:12px 0';
lateFields.innerHTML='<strong>Ingreso tarde · desde las 08:30</strong><label for="late-motive">Motivo obligatorio</label><select id="late-motive" required><option value="">Seleccionar motivo</option><option>Atención médica</option><option>Trámite familiar o personal</option><option>Justificación del apoderado</option><option>Sin justificación</option><option>Otro motivo</option></select><label for="late-operator">Funcionario responsable</label><input id="late-operator" placeholder="Nombre y apellido" autocomplete="off"><small>El motivo es interno y no se imprime. Los ingresos sin justificación suman al contador de atrasos.</small>';
$('movement-form').insertBefore(lateFields,$('reason'));
function printLate(r){if(!r||r.annulled)return;const st=students.find(x=>x.id===r.studentId);if(!st)return;const w=window.open('','_blank','width=420,height=650');if(!w){alert('Habilita ventanas emergentes para imprimir.');return}const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const d=new Date(r.at);w.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>Pase de ingreso</title><style>@page{size:58mm auto;margin:2mm}body{font:10px Arial;color:#000;background:white;width:53mm;margin:0 auto}h2{text-align:center;font-size:13px}p{margin:6px 0}.center{text-align:center}hr{border:0;border-top:1px dashed black}</style><div class="center"><b>LICEO LUIS URBINA FLORES</b><p>INSPECTORÍA GENERAL</p></div><hr><h2>PASE DE INGRESO</h2><p><b>Estudiante:</b> '+safe(st.name)+'</p><p><b>Curso:</b> '+safe(st.course)+'</p><p><b>Fecha:</b> '+safe(d.toLocaleDateString('es-CL'))+'</p><p><b>Hora:</b> '+safe(d.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}))+'</p><p><b>Funcionario:</b> '+safe(r.operator)+'</p><hr><p class="center">Se solicita permitir la incorporación del estudiante a clases, habiéndose registrado su ingreso en Inspectoría General.</p><p class="center" style="margin-top:22px">_______________________<br>Inspectoría General</p></html>');w.document.close();w.focus();w.print()}
function manageLate(id){const r=records.find(x=>x.id===id&&x.module==='ingreso');if(!r)return;const st=students.find(x=>x.id===r.studentId);const status=r.annulled?'ANULADO':r.justified?'Justificación registrada':'Sin justificar';const action=prompt((st?.name||r.studentId)+' · '+new Date(r.at).toLocaleString('es-CL')+' · '+status+'\nEscribe: IMPRIMIR, CORREGIR o ANULAR');if(!action)return;const a=action.trim().toUpperCase();if(a==='IMPRIMIR'){printLate(r);return}if(!['CORREGIR','ANULAR'].includes(a)||r.annulled){alert('Acción no permitida.');return}const operator=prompt('Nombre y apellido del funcionario responsable:');if(!operator?.trim())return;let configured=localStorage.getItem('luf-late-admin-key');if(!configured){alert('Primero configura una clave administrativa para esta demostración.');return}const password=prompt('Clave administrativa:');if(!password||password!==configured){alert('Clave incorrecta o no configurada.');return}const old={reason:r.reason,type:r.type,justified:r.justified,annulled:!!r.annulled};let newReason=r.reason,newJustified=r.justified;if(a==='CORREGIR'){newReason=prompt('Nuevo motivo (obligatorio):',r.reason);if(!newReason?.trim())return;const answer=prompt('Estado: J = justificación registrada; S = sin justificación',r.justified?'J':'S');if(!['J','S'].includes(answer?.toUpperCase()))return;newJustified=answer.toUpperCase()==='J'}else{const why=prompt('Motivo obligatorio de la anulación:');if(!why?.trim())return;newReason=why.trim()}if(!confirm('¿Confirmar '+a.toLowerCase()+'? Se conservará la auditoría.'))return;const backup=JSON.stringify(r);r.audit??=[];r.audit.push({at:new Date().toISOString(),operator:operator.trim(),action:a,previous:old,newReason});if(a==='ANULAR'){r.annulled=true;r.annulReason=newReason}else{r.reason=newReason.trim();r.justified=newJustified;r.type=newJustified?'Justificación registrada':'Sin justificar'}if(!persist()){Object.assign(r,JSON.parse(backup));alert('No se pudo guardar.');return}renderStats();renderHistory();updateTardySummary();alert('Cambio registrado correctamente.')}
const adminKeyButton=el('button','Configurar / cambiar clave administrativa','secondary');adminKeyButton.type='button';adminKeyButton.addEventListener('click',()=>{const old=localStorage.getItem('luf-late-admin-key');if(old&&prompt('Clave actual:')!==old){alert('Clave incorrecta.');return}const next=prompt('Nueva clave administrativa (mínimo 6 caracteres):');if(!next||next.length<6)return;const check=prompt('Repite la nueva clave:');if(next!==check){alert('Las claves no coinciden.');return}localStorage.setItem('luf-late-admin-key',next);alert('Clave de demostración configurada en este navegador. No constituye seguridad real.');});lateFields.append(adminKeyButton);

const earlyKey='luf-early-passes-v1',earlyDays=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
let earlyPasses={};try{earlyPasses=JSON.parse(localStorage.getItem(earlyKey)||'{}')}catch{}
let earlyConfig={tolerance:10,blocked:[]};try{earlyConfig={...earlyConfig,...JSON.parse(localStorage.getItem('luf-early-settings')||'{}')}}catch{}
let earlyOperator=sessionStorage.getItem('luf-early-operator')||'';
const earlyPanel=el('section');earlyPanel.id='early-panel';earlyPanel.style.cssText='display:none;padding:16px;margin:12px 0;border:1px solid #34546a;border-radius:12px';
earlyPanel.innerHTML='<h3>Retiro temprano · pases especiales</h3><label>Funcionario del turno <input id="early-operator" placeholder="Nombre y apellido"></label><details><summary>Administrar pases y horarios</summary><label>Estudiante <select id="early-student"></select></label><label>Desde <input id="early-start" type="date"></label><label>Hasta (opcional) <input id="early-end" type="date"></label><label><input id="early-active" type="checkbox" checked> Habilitado</label><div id="early-days"></div><button type="button" id="early-save" class="secondary">Guardar pase</button><label>Tolerancia en minutos <input id="early-tolerance" type="number" min="0" max="60" value="10"></label><label>Fechas bloqueadas, separadas por coma <input id="early-blocked" placeholder="2026-11-01, 2026-11-02"></label><button type="button" id="early-settings-save" class="secondary">Guardar configuración</button><p>CSV: identificador;lunes;martes;miércoles;jueves;viernes;sábado;domingo;inicio;fin;activo</p><input type="file" id="early-file" accept=".csv"><button type="button" id="early-import" class="secondary">Importar pases</button></details><details><summary>Salida excepcional manual</summary><p>Selecciona un estudiante desde el buscador de abajo.</p><label>Motivo <textarea id="early-reason"></textarea></label><button type="button" id="early-exception" class="secondary">Registrar salida excepcional</button></details><details><summary>Historial y reportes</summary><label>Estudiante o curso <input id="early-filter"></label><label>Fecha <input type="date" id="early-date"></label><label>Tipo <select id="early-type"><option value="">Todos</option><option>Normal</option><option>Excepcional</option></select></label><button type="button" id="early-export" class="secondary">Exportar CSV filtrado</button><div id="early-history"></div></details>';
$('movement-form').before(earlyPanel);
earlyDays.forEach((d,i)=>{const l=el('label',d+' '),v=el('input');v.type='time';v.id='early-day-'+i;l.append(v);$('early-days').append(l)});
function earlyAdmin(){const name=prompt('Nombre del funcionario:');if(!name?.trim())return null;const key=localStorage.getItem('luf-late-admin-key');if(!key){alert('Configura la clave administrativa en la pestaña Configuración.');return null}if(prompt('Clave administrativa:')!==key){alert('Clave incorrecta');return null}return name.trim()}
function earlyStore(){try{localStorage.setItem(earlyKey,JSON.stringify(earlyPasses));localStorage.setItem('luf-early-settings',JSON.stringify(earlyConfig));return true}catch{return false}}
function earlySelect(){const p=earlyPasses[$('early-student').value]||{};$('early-start').value=p.start||'';$('early-end').value=p.end||'';$('early-active').checked=p.active!==false;earlyDays.forEach((_,i)=>$('early-day-'+i).value=p.days?.[i]||'')}
function earlyRender(){earlyPanel.style.display=current==='temprano'?'block':'none';if(current!=='temprano')return;$('early-operator').value=earlyOperator;const select=$('early-student'),old=select.value;select.replaceChildren(...students.filter(s=>s.active!==false).map(s=>{const o=el('option',s.name+' · '+s.course);o.value=s.id;return o}));select.value=old||select.options[0]?.value||'';earlySelect();$('early-tolerance').value=earlyConfig.tolerance;$('early-blocked').value=earlyConfig.blocked.join(', ');earlyHistory()}
$('early-student').addEventListener('change',earlySelect);
$('early-operator').addEventListener('change',()=>{earlyOperator=$('early-operator').value.trim();sessionStorage.setItem('luf-early-operator',earlyOperator)});
$('early-save').addEventListener('click',()=>{const by=earlyAdmin();if(!by)return;const id=$('early-student').value,old=earlyPasses[id];if(!id)return;const start=$('early-start').value,end=$('early-end').value;if(start&&end&&end<start){alert('Fechas inválidas');return}earlyPasses[id]={start,end,active:$('early-active').checked,days:earlyDays.map((_,i)=>$('early-day-'+i).value),audit:[...(old?.audit||[]),{by,at:new Date().toISOString(),previous:old?{...old,audit:undefined}:null}]};if(earlyStore()){alert('Pase guardado');earlyRender()}else alert('Error al guardar')});
$('early-settings-save').addEventListener('click',()=>{const by=earlyAdmin();if(!by)return;const n=Number($('early-tolerance').value),blocked=$('early-blocked').value.split(',').map(x=>x.trim()).filter(Boolean);if(!Number.isInteger(n)||n<0||n>60||blocked.some(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x))){alert('Configuración inválida');return}earlyConfig={tolerance:n,blocked,audit:[...(earlyConfig.audit||[]),{by,at:new Date().toISOString()}]};if(earlyStore())alert('Configuración guardada')});
function earlyExisting(st){return todayRecords().find(r=>r.module==='temprano'&&r.studentId===st.id&&!r.annulled)}
function earlySchedule(st){const p=earlyPasses[st.id],now=new Date(),day=dateKey(now);if(!p||p.active===false||p.start&&day<p.start||p.end&&day>p.end||earlyConfig.blocked.includes(day))return null;return p.days?.[(now.getDay()+6)%7]||null}
function earlySaveExit(st,exceptional,motive=''){const previous=earlyExisting(st);if(previous){alert('Salida ya registrada: '+new Date(previous.at).toLocaleTimeString('es-CL'));return false}const schedule=earlySchedule(st),mins=new Date().getHours()*60+new Date().getMinutes();if(!exceptional&&(!schedule||mins<minuteOf(schedule)-earlyConfig.tolerance))return false;const operator=exceptional?prompt('Funcionario que autoriza la excepción:'):earlyOperator;if(!operator?.trim()||exceptional&&!motive.trim()){alert('Funcionario y motivo son obligatorios');return false}const r={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+Math.random(),module:'temprano',studentId:st.id,at:new Date().toISOString(),type:exceptional?'Excepcional':'Normal',reason:exceptional?motive:'Pase autorizado',operator:operator.trim(),scheduled:schedule||'',audit:[]};records.push(r);if(!persist()){records.pop();alert('Error al guardar');return false}renderStats();renderHistory();earlyHistory();$('feedback').textContent='Salida registrada: '+st.name;return true}
function earlyScan(st){attentionOpen(st,'Credencial identificada. Comprobando autorización de retiro temprano.');const message=$('attention-feedback');const old=earlyExisting(st);if(old){const notice='SALIDA YA REGISTRADA a las '+new Date(old.at).toLocaleTimeString('es-CL');showScan(notice,'warning',st);message.textContent=notice;message.classList.add('lunch-outside-hours');return}const schedule=earlySchedule(st),mins=new Date().getHours()*60+new Date().getMinutes();if(!schedule||mins<minuteOf(schedule)-earlyConfig.tolerance){const notice='PASE NO DISPONIBLE — Sin autorización vigente para esta hora o día. Requiere salida excepcional manual.';showScan(notice,'warning',st);message.textContent=notice;message.classList.add('lunch-blocked');return}if(!earlyOperator){const notice='Indica el funcionario del turno antes de registrar la salida.';showScan(notice,'warning',st);message.textContent=notice;message.classList.add('lunch-outside-hours');return}if(earlySaveExit(st,false)){const notice='✓ SALIDA REGISTRADA CORRECTAMENTE · '+new Date().toLocaleTimeString('es-CL');showScan(notice,'success',st);$('attention-message').textContent='Retiro temprano autorizado · '+schedule;message.textContent=notice;message.classList.add('early-success')}}
$('early-exception').addEventListener('click',()=>{if(!selected){alert('Busca y selecciona un estudiante');return}const motive=$('early-reason').value.trim();if(!motive){alert('Motivo obligatorio');return}if(confirm('¿Confirmar salida excepcional de '+selected.name+'?')&&earlySaveExit(selected,true,motive))$('early-reason').value=''});
function earlyRows(){const q=$('early-filter').value.toLowerCase(),day=$('early-date').value,type=$('early-type').value;return records.filter(r=>r.module==='temprano'&&(!day||dateKey(new Date(r.at))===day)&&(!type||r.type===type)&&(!q||[r.studentId,students.find(s=>s.id===r.studentId)?.name||'',students.find(s=>s.id===r.studentId)?.course||''].some(v=>v.toLowerCase().includes(q)))).slice().reverse()}
function earlyHistory(){const box=$('early-history');box.replaceChildren();for(const r of earlyRows().slice(0,100)){const st=students.find(s=>s.id===r.studentId),line=el('div',new Date(r.at).toLocaleString('es-CL')+' · '+(st?.name||r.studentId)+' · '+(st?.course||'')+' · '+(r.annulled?'ANULADO':r.type)+' · '+(r.scheduled||'Sin pase')+' · '+r.operator+' · '+r.reason);line.style.padding='8px';if(!r.annulled){const b=el('button','Anular','secondary');b.type='button';b.addEventListener('click',()=>{const by=earlyAdmin();if(!by)return;const why=prompt('Motivo de anulación:');if(!why?.trim()||!confirm('¿Anular salida?'))return;r.annulled=true;r.audit.push({by,why,at:new Date().toISOString()});if(persist()){renderStats();renderHistory();earlyHistory()}else{r.annulled=false;r.audit.pop();alert('Error al guardar')}});line.append(b)}box.append(line)}}
['early-filter','early-date','early-type'].forEach(id=>$(id).addEventListener('input',earlyHistory));
$('early-export').addEventListener('click',()=>{const rows=[['Fecha','ID','Nombre','Curso','Tipo','Horario','Funcionario','Motivo','Anulado','Auditoría'],...earlyRows().map(r=>{const st=students.find(s=>s.id===r.studentId);return [new Date(r.at).toLocaleString('es-CL'),r.studentId,st?.name,st?.course,r.type,r.scheduled,r.operator,r.reason,r.annulled?'Sí':'No',JSON.stringify(r.audit)]})];const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=el('a');a.href=url;a.download='retiro-temprano.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('early-import').addEventListener('click',async()=>{const file=$('early-file').files[0];if(!file){alert('Selecciona CSV');return}const by=earlyAdmin();if(!by)return;const lines=(await file.text()).replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean),sep=lines[0]?.includes(';')?';':',';let n=0;const next={...earlyPasses};for(const line of lines.slice(1)){const c=line.split(sep).map(x=>x.trim()),st=students.find(s=>s.id.toLowerCase()===c[0]?.toLowerCase()||s.rut.replace(/[^0-9k]/gi,'').toLowerCase()===c[0]?.replace(/[^0-9k]/gi,'').toLowerCase());if(!st||c.length<8||c.slice(1,8).some(v=>v&&!/^\d\d:\d\d$/.test(v)))continue;const old=next[st.id];next[st.id]={days:c.slice(1,8),start:c[8]||'',end:c[9]||'',active:!['0','no','false'].includes((c[10]||'').toLowerCase()),audit:[...(old?.audit||[]),{by,at:new Date().toISOString(),action:'Importación'}]};n++}if(!n||!confirm('¿Importar '+n+' pases? Los demás se conservan.'))return;const old=earlyPasses;earlyPasses=next;if(earlyStore()){alert(n+' pases importados');earlyRender()}else{earlyPasses=old;alert('Error al guardar')}});

function renderStats(){const today=todayRecords();const values=[['Movimientos hoy',today.length],['Atrasos hoy',today.filter(countsAsLate).length],['Retiros hoy',today.filter(r=>r.module==='retiros'||r.module==='temprano').length],['Almuerzos hoy',today.filter(r=>r.module==='almuerzo').length]];$('stats').replaceChildren(...values.map(([label,value])=>{const card=el('div',undefined,'stat');card.append(el('small',label),el('strong',String(value)));return card}))}
function renderModules(){$('modules').replaceChildren(...modules.map(([id,title,desc])=>{const btn=el('button',title,'module theme-'+id+(id===current?' active':''));btn.type='button';btn.append(el('span',desc));btn.addEventListener('click',()=>{current=id;selected=null;$('student-search').value='';$('reason').value='';$('exceptional').checked=false;$('selected').hidden=true;$('matches').replaceChildren();$('feedback').textContent='';render();if(current==='pases'||current==='temprano')focusScanner();if(current==='retiros')$('withdrawal-rut').focus({preventScroll:true})});return btn}))}
function renderWithdrawalHistory(){
 const section=$('withdrawal-history'),body=$('withdrawal-history-rows');
 section.hidden=current!=='retiros';body.replaceChildren();
 if(current!=='retiros')return;
 const rows=records.filter(r=>r.module==='retiros').slice().reverse().slice(0,30);
 if(!rows.length){const tr=el('tr'),td=el('td','Todavía no hay retiros registrados.');td.colSpan=4;tr.append(td);body.append(tr);return}
 for(const r of rows){
  const student=students.find(s=>s.id===r.studentId),tr=el('tr');
  const values=[new Date(r.at).toLocaleString('es-CL'),student?.name||r.studentId,student?.course||'—',r.reason||'Sin datos del adulto'];
  tr.append(...values.map(value=>el('td',value)));body.append(tr);
 }
}
function lunchExitAllowed(){const now=new Date(),minute=now.getHours()*60+now.getMinutes();return minute>=13*60+55&&minute<=14*60+55}
function lunchState(){
 const day=todayRecords().filter(r=>r.module==='pases');
 const pending=new Map();
 for(const r of day){if(r.type==='Salida')pending.set(r.studentId,r);else if(r.type==='Regreso')pending.delete(r.studentId)}
 return {day,pending};
}
function renderLunchControl(){
 const section=$('lunch-control');section.hidden=current!=='pases';
 if(current!=='pases')return;
 const {day,pending}=lunchState();
 const notice=section.querySelector('.lunch-hours-notice');if(notice){notice.textContent=lunchExitAllowed()?'Horario de salida habilitado: 13:55 a 14:55.':'Fuera del horario de salida (13:55 a 14:55). Los regresos siguen habilitados.'}
 const summary=$('lunch-summary');summary.replaceChildren();
 for(const [label,value] of [['Salidas del día',day.filter(r=>r.type==='Salida').length],['Regresos',day.filter(r=>r.type==='Regreso').length],['Estudiantes fuera',pending.size]]){
  const box=el('div',undefined,'lunch-stat');box.append(el('small',label),el('strong',String(value)));summary.append(box);
 }
 const body=$('lunch-outside');body.replaceChildren();
 if(!pending.size){const tr=el('tr'),td=el('td','No hay estudiantes pendientes de regreso.');td.colSpan=4;tr.append(td);body.append(tr)}
 for(const [id,departure] of pending){
  const s=students.find(x=>x.id===id),tr=el('tr');
  for(const value of [s?.name||id,s?.course||'—',new Date(departure.at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})])tr.append(el('td',value));
  const cell=el('td'),btn=el('button','Autorizar regreso','primary');btn.type='button';
  btn.addEventListener('click',()=>{
   if(!s||s.active===false){alert('El estudiante ya no figura activo. Revisa su registro.');return}
   if(attentionPending&&!window.confirm('Hay un movimiento pendiente. ¿Descartarlo?'))return;
   choose(s);attentionOpen(s,'Regreso pendiente desde las '+new Date(departure.at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})+'. Verifica al estudiante.');
  });
  cell.append(btn);tr.append(cell);body.append(tr);
 }
}
function renderHistory(){renderWithdrawalHistory();renderLunchControl();const body=$('history');body.replaceChildren();const rows=records.filter(r=>r.module===current).slice().reverse().slice(0,20);if(!rows.length){const tr=el('tr');const td=el('td','Sin movimientos registrados en este módulo.');td.colSpan=5;tr.append(td);body.append(tr);return}for(const r of rows){const tr=el('tr');const s=students.find(x=>x.id===r.studentId);const values=[new Date(r.at).toLocaleString('es-CL'),s?s.name:'Desconocido',modules.find(m=>m[0]===r.module)?.[1]||r.module,r.annulled?'ANULADO':r.type,(r.reason||'—')+(r.operator?' · Funcionario: '+r.operator:'')];tr.append(...values.map(v=>el('td',v)));if(current==='ingreso'){const cell=tr.lastElementChild;cell.append(el('span',' · '));const btn=el('button','Gestionar','secondary');btn.type='button';btn.addEventListener('click',()=>manageLate(r.id));cell.append(btn)}body.append(tr)}}
function render(){document.body.classList.forEach(c=>{if(c.startsWith('theme-'))document.body.classList.remove(c)});document.body.classList.add('theme-'+current);$('withdrawal-entry').hidden=current!=='retiros';scanInput.disabled=current==='retiros';scanInput.placeholder=current==='retiros'?'QR desactivado en Retiros':'Escanea aquí: LUF-001';$('student-search').placeholder=current==='retiros'?'Ingrese RUT del estudiante (obligatorio)':'Buscar estudiante por nombre, RUT o código QR';renderModules();const m=modules.find(x=>x[0]===current);$('module-title').textContent=m[1];$('module-desc').textContent=m[2];renderStats();renderHistory();earlyRender();$('late-fields').hidden=current!=='ingreso';$('late-fields').style.display=current==='ingreso'?'grid':'none';$('tardy-counter').hidden=current!=='atrasos';updateTardySummary()}
function findWithdrawalStudent(){
 const input=$('withdrawal-rut'),feedback=$('withdrawal-feedback');
 const rut=input.value.toUpperCase().replace(/[^0-9K]/g,'');
 if(input.value.trim().length<2){feedback.textContent='Ingrese RUT o nombre del estudiante.';input.focus();return}
 const matches=students.filter(s=>s.active!==false&&(s.rut.toUpperCase().replace(/[^0-9K]/g,'')===rut||s.name.toLocaleLowerCase('es-CL').includes(input.value.trim().toLocaleLowerCase('es-CL'))));const student=matches.length===1?matches[0]:null;
 if(!student){
 const area=$('withdrawal-matches');area.replaceChildren();area.hidden=!matches.length;
 for(const s of matches){const button=el('button',s.name+' · '+s.course,'secondary');button.type='button';button.addEventListener('click',()=>{if(attentionPending&&!confirm('¿Descartar retiro pendiente?'))return;choose(s);attentionOpen(s,'Estudiante seleccionado por funcionario.');area.hidden=true;input.value='';feedback.textContent=''});area.append(button)}
 feedback.textContent=matches.length?'Selecciona al estudiante correcto según su curso.':'No se encontró un estudiante activo con esos datos.';input.focus();return
}
 if(attentionPending&&!window.confirm('Hay un retiro sin confirmar. ¿Descartarlo?'))return;
 choose(student);attentionOpen(student,'Estudiante identificado mediante RUT ingresado por funcionario.');
 feedback.textContent='';input.value='';$('withdrawal-matches').hidden=true;
}
$('withdrawal-find').addEventListener('click',findWithdrawalStudent);
$('withdrawal-rut').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();findWithdrawalStudent()}});
function search(){if(current==='pases')return;const q=$('student-search').value.trim().toLocaleLowerCase('es-CL');selected=null;$('selected').hidden=true;const list=$('matches');list.replaceChildren();if(q.length<2)return;const hits=students.filter(s=>s.active!==false).filter(s=>current==='retiros'?s.rut.toLocaleLowerCase('es-CL').replace(/[^0-9k]/g,'').includes(q.replace(/[^0-9k]/g,'')):[s.name,s.rut,s.id,s.course].some(v=>v.toLocaleLowerCase('es-CL').includes(q))).slice(0,6);for(const s of hits){const b=el('button',s.name+' · '+s.course+' · '+s.id,'match');b.type='button';b.addEventListener('click',()=>{choose(s);attentionOpen(s,'Estudiante identificado manualmente. Verifica los datos del movimiento.')});list.append(b)}}
function choose(s){selected=s;updateTardySummary();refreshTardyPass();$('student-search').value=s.name;$('selected').textContent=s.name+' · '+s.course+' · '+s.rut;$('selected').hidden=false;$('matches').replaceChildren()}
$('student-search').addEventListener('input',search);
$('student-search').addEventListener('keydown',e=>{if(current==='pases')return;if(e.key!=='Enter')return;e.preventDefault();const q=$('student-search').value.trim().toLowerCase();const exact=students.find(s=>s.active!==false&&(current==='retiros'?s.rut.toLowerCase().replace(/[^0-9k]/g,'')===q.replace(/[^0-9k]/g,''):s.id.toLowerCase()===q||s.rut.toLowerCase()===q));const first=$('matches').querySelector('button');if(exact){choose(exact);attentionOpen(exact,'Estudiante seleccionado manualmente.')}else if(first)first.click()});
$('movement-form').addEventListener('submit',e=>{e.preventDefault();const feedback=$('feedback');feedback.className='';if(!selected||selected.active===false){feedback.textContent='Selecciona un estudiante activo de la lista.';feedback.className='error';return}if(current==='retiros'&&!$('reason').value.includes('RUT:')){feedback.textContent='El retiro requiere identificar al adulto y verificar su autorización en la pantalla de atención.';feedback.className='error';return}const exceptional=$('exceptional').checked;let reason=$('reason').value.trim();if(exceptional&&!reason){feedback.textContent='Indica el motivo del registro excepcional.';feedback.className='error';return}const today=todayRecords();if(current==='almuerzo'&&today.some(r=>r.module==='almuerzo'&&r.studentId===selected.id)){feedback.textContent='Este estudiante ya tiene un almuerzo registrado hoy.';feedback.className='error';return}let type=exceptional?'Excepcional':'Normal';
if(current==='atrasos'){
 const now=new Date(),minutes=now.getHours()*60+now.getMinutes();
 const previous=today.find(r=>r.module==='atrasos'&&r.studentId===selected.id);if(previous){feedback.textContent='Estudiante con atraso registrado hoy a las '+new Date(previous.at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})+'. No se genera otro registro.';feedback.className='error';return}
 if(minutes<=minuteOf(tardySettings.start)+(selected.tardyException?20:tardySettings.tolerance)){feedback.textContent='Todavía está dentro del horario permitido. No se registra atraso.';feedback.className='error';return}
 const needsExceptional=false;
 if(needsExceptional&&!exceptional){feedback.textContent='Fuera del horario normal: marca Registro excepcional e indica el motivo.';feedback.className='error';return}
 if(needsExceptional&&!reason){feedback.textContent='El atraso excepcional requiere motivo.';feedback.className='error';return}
}
if(current==='ingreso'){
 const now=new Date();if(now.getHours()*60+now.getMinutes()<510){feedback.textContent='Ingreso tarde disponible desde las 08:30.';feedback.className='error';return}
 const previous=today.find(r=>r.module==='ingreso'&&r.studentId===selected.id&&!r.annulled);
 if(previous){feedback.textContent='INGRESO YA REGISTRADO hoy a las '+new Date(previous.at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})+'. Consulta el historial para reimprimir.';feedback.className='error';return}
 const motive=$('late-motive').value,operator=$('late-operator').value.trim();
 if(!motive||motive==='Otro motivo'&&!reason){feedback.textContent='Selecciona un motivo y, si es otro, descríbelo.';feedback.className='error';return}
 if(!operator){feedback.textContent='Escribe el nombre del funcionario.';feedback.className='error';return}
 type=motive==='Sin justificación'?'Sin justificar':'Justificación registrada';
 reason=motive+(reason?' · '+reason:'');
 }
 if(current==='temprano'){feedback.textContent='Utiliza el QR o el panel de salida excepcional.';return}
if(current==='pases'){const pending=lunchState().pending.has(selected.id);if(attentionAction==='Salida'&&!selected.lunchPassAuthorized){feedback.textContent='PASE NO DISPONIBLE: estudiante sin pase habilitado en el registro.';feedback.className='error';return}const operator=$('lunch-operator').value.trim();if(!operator){feedback.textContent='Debes indicar el nombre del funcionario que autoriza.';feedback.className='error';return}if(attentionAction==='Salida'&&!lunchExitAllowed()){feedback.textContent='Salida bloqueada: el horario de almuerzo es de 13:55 a 14:55. El regreso sí puede registrarse fuera de ese horario.';feedback.className='error';return}if(!attentionPending||!attentionAction){feedback.textContent='Confirma la salida o el regreso desde la pantalla de atención.';feedback.className='error';return}if((attentionAction==='Salida'&&pending)||(attentionAction==='Regreso'&&!pending)){feedback.textContent='El estado del estudiante cambió. Vuelve a verificarlo.';feedback.className='error';return}type=attentionAction;reason='Autorizado por: '+operator}const record={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random(),at:new Date().toISOString(),module:current,studentId:selected.id,type,reason,...(current==='ingreso'?{operator:$('late-operator').value.trim(),justified:$('late-motive').value!=='Sin justificación',audit:[]}:{})};records.push(record);if(!persist()){records.pop();feedback.textContent='No se pudo guardar el registro en este navegador.';feedback.className='error';return}feedback.textContent=current==='ingreso'?(record.justified?'Ingreso registrado. Se ha solicitado imprimir el pase.':'⚠ INGRESO SIN JUSTIFICACIÓN. Se suma al contador de atrasos. Se ha solicitado imprimir el pase.'):'Movimiento registrado correctamente (solo en este navegador).';$('reason').value='';$('exceptional').checked=false;renderStats();renderHistory();updateTardySummary();refreshTardyPass();if(current==='ingreso')printLate(record);if(current==='atrasos'&&tardyMonthly(selected.id).length>=tardySettings.alert)feedback.textContent+=' ⚠ Umbral mensual de atrasos alcanzado.'});
function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
$('export').addEventListener('click',()=>{const rows=[['Fecha y hora','Código','Estudiante','Curso','Módulo','Tipo','Observación'],...records.filter(r=>r.module===current).map(r=>{const s=students.find(x=>x.id===r.studentId);return [new Date(r.at).toLocaleString('es-CL'),r.studentId,s?.name||'',s?.course||'',r.module,r.annulled?'ANULADO':r.type,r.reason+(r.operator?' · Funcionario: '+r.operator:'')+(r.audit?.length?' · Cambios: '+JSON.stringify(r.audit):'')]})];const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='luf-'+current+'-'+dateKey(new Date())+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('reset').addEventListener('click',()=>{if(!confirm('¿Eliminar todos los movimientos ficticios guardados en este navegador?'))return;records=[];localStorage.removeItem(key);$('feedback').textContent='Datos de prueba restablecidos.';render()});
function tick(){$('clock').textContent=new Date().toLocaleString('es-CL',{dateStyle:'full',timeStyle:'short'})}tick();setInterval(tick,30000);render();
// USB scanners operating as keyboards typically append Enter after the code.
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
 const area=$('attention-actions');area.replaceChildren();$('lunch-operator-wrap').hidden=current!=='pases';$('lunch-operator').value='';$('attention-feedback').classList.remove('lunch-blocked','lunch-outside-hours');
 if(current==='pases'&&!lunchState().pending.has(student.id)&&!student.lunchPassAuthorized){$('attention-feedback').textContent='PASE NO DISPONIBLE — El estudiante no tiene el pase habilitado en el registro.';$('attention-feedback').classList.add('lunch-blocked')}
 if(current==='pases'&&!lunchState().pending.has(student.id)&&student.lunchPassAuthorized&&!lunchExitAllowed()){$('attention-feedback').textContent='FUERA DEL HORARIO DE SALIDA — Horario permitido: 13:55 a 14:55.';$('attention-feedback').classList.add('lunch-outside-hours')}
 const actions=current==='atrasos'?[['Atraso habitual','Atraso'],['Ingreso con pase','Con pase'],['Justificación del apoderado','Justificado']]:current==='retiros'?[['Titular','Apoderado titular'],['Suplente','Apoderado suplente'],['Otro autorizado','Otro autorizado']]:current==='temprano'?[['Excepcional','Salida excepcional manual']]:current==='pases'?(lunchState().pending.has(student.id)?[['Regreso','Confirmar regreso']]:[['Salida','Autorizar salida']]):current==='almuerzo'?[['Almuerzo','Registrar almuerzo']]:[['Atención médica','Atención médica'],['Trámite familiar o personal','Trámite familiar'],['Justificación del apoderado','Apoderado'],['Sin justificación','Sin justificación'],['Otro motivo','Otro']];
 for(const [value,label] of actions){
  const btn=el('button',label);btn.type='button';
  btn.addEventListener('click',()=>{
   if(current==='pases'&&value==='Salida'&&!student.lunchPassAuthorized){$('attention-feedback').textContent='PASE NO DISPONIBLE — El estudiante no tiene el pase habilitado en el registro.';$('attention-feedback').classList.add('lunch-blocked');$('attention-confirm').hidden=true;attentionPending=false;return}
   if(current==='pases'&&value==='Salida'&&!lunchExitAllowed()){$('attention-feedback').textContent='FUERA DEL HORARIO DE SALIDA — Horario permitido: 13:55 a 14:55.';$('attention-feedback').classList.add('lunch-outside-hours');$('attention-confirm').hidden=true;attentionPending=false;return}
   $('attention-feedback').classList.remove('lunch-blocked','lunch-outside-hours');attentionAction=value;
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
 }else if(current==='ingreso'){$('late-motive').value=attentionAction;const operator=prompt('Nombre y apellido del funcionario que registra el ingreso:');if(!operator?.trim()){$('attention-feedback').textContent='Debes indicar el funcionario.';return}$('late-operator').value=operator.trim();if(attentionAction==='Otro motivo'){const detail=prompt('Describe el motivo del ingreso:');if(!detail?.trim()){$('attention-feedback').textContent='Describe el motivo.';return}$('reason').value=detail.trim()}}
 const before=records.length;
 $('movement-form').requestSubmit();
 if(records.length>before){attentionPending=false;$('attention-confirm').hidden=true;$('attention-feedback').textContent='✓ Movimiento registrado correctamente.';if(current==='pases'){$('attention-overlay').hidden=true;selected=null;focusScanner()}if(current==='retiros'){$('attention-overlay').hidden=true;selected=null;$('withdrawal-rut').value='';$('withdrawal-feedback').textContent='✓ Retiro registrado correctamente.';$('withdrawal-matches').hidden=true;$('withdrawal-rut').focus({preventScroll:true})}}
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
 if(current==='temprano'){earlyScan(student);focusScanner();return}
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
