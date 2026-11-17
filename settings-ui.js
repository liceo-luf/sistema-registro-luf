'use strict';
// Navigation only: keep the existing modules and data stores intact.
const registerTab=document.getElementById('tab-register');
const settingsTab=document.getElementById('tab-settings');
const settingsView=document.getElementById('settings-view');
const rosterPanel=document.getElementById('student-admin');
const earlyAdminDetails=document.querySelector('#early-panel details');
const keyAction=document.getElementById('settings-key-action');
const earlyAction=document.getElementById('settings-early-action');
const keyButton=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Configurar / cambiar clave administrativa'));
if(keyButton)keyAction.append(keyButton);
if(earlyAdminDetails){earlyAdminDetails.open=true;earlyAction.append(earlyAdminDetails)}
const rosterOriginalParent=rosterPanel.parentElement;
settingsView.append(rosterPanel);
rosterPanel.hidden=false;
document.getElementById('admin-content').hidden=false;
document.getElementById('admin-toggle').hidden=true;
const configSection=document.createElement('section');
configSection.className='settings-card';
configSection.innerHTML='<h3>Horarios y alertas de atrasos</h3>';
const tardyDetails=rosterPanel.querySelector('.admin-config');
if(tardyDetails){tardyDetails.open=true;configSection.append(tardyDetails);settingsView.append(configSection)}
// Local demo access gate. This is not server-side authentication.
const SETTINGS_SESSION_MS=30*60*1000;
const SETTINGS_SESSION_KEY='luf-settings-unlocked-until';
let settingsUnlocked=Number(sessionStorage.getItem(SETTINGS_SESSION_KEY)||0)>Date.now();
function keepSettingsSession(){settingsUnlocked=true;sessionStorage.setItem(SETTINGS_SESSION_KEY,String(Date.now()+SETTINGS_SESSION_MS))}
function settingsSessionValid(){const until=Number(sessionStorage.getItem(SETTINGS_SESSION_KEY)||0);settingsUnlocked=until>Date.now();return settingsUnlocked}
const accessGate=document.createElement('div');
accessGate.id='settings-access-gate';
accessGate.className='settings-access-gate';
accessGate.hidden=true;
accessGate.innerHTML='<form id="settings-access-form" class="settings-access-form"><div class="settings-access-symbol" aria-hidden="true">🔐</div><h2>Acceso a Configuración</h2><p>Ingresa la clave administrativa para administrar estudiantes, pases y horarios.</p><label for="settings-access-password">Clave administrativa</label><div class="settings-password-wrap"><input id="settings-access-password" type="password" autocomplete="current-password" required placeholder="Clave administrativa"><button type="button" class="settings-password-toggle" id="settings-password-toggle" aria-label="Mostrar contraseña" title="Mostrar contraseña">👁</button></div><small class="settings-session-note">La sesión permanecerá abierta durante 30 minutos en esta pestaña.</small><p id="settings-access-error" role="alert" aria-live="polite"></p><button type="submit" class="primary" id="settings-access-submit">Ingresar a Configuración</button><button type="button" class="secondary" id="settings-access-cancel">Volver a Registros</button></form>';
settingsView.before(accessGate);
const accessForm=document.getElementById('settings-access-form');
const accessPassword=document.getElementById('settings-access-password');
const accessError=document.getElementById('settings-access-error');
const accessSubmit=document.getElementById('settings-access-submit');
const passwordToggle=document.getElementById('settings-password-toggle');
passwordToggle.addEventListener('click',()=>{const showing=accessPassword.type==='text';accessPassword.type=showing?'password':'text';passwordToggle.textContent=showing?'👁':'🙈';passwordToggle.setAttribute('aria-label',showing?'Mostrar contraseña':'Ocultar contraseña');passwordToggle.title=showing?'Mostrar contraseña':'Ocultar contraseña'});
function refreshGate(){
 const hasKey=!!localStorage.getItem('luf-late-admin-key');
 accessForm.querySelector('h2').textContent=hasKey?'Acceso a Configuración':'Configuración inicial';
 accessForm.querySelector('p').textContent=hasKey?'Ingresa la clave administrativa para administrar estudiantes, pases y horarios.':'No existe una clave en este navegador. Crea una clave inicial de al menos 6 caracteres para proteger el panel.';
 accessSubmit.textContent=hasKey?'Ingresar a Configuración':'Crear clave e ingresar';
 accessPassword.value='';accessError.textContent='';
}
accessForm.addEventListener('submit',e=>{
 e.preventDefault();
 const configured=localStorage.getItem('luf-late-admin-key'),entered=accessPassword.value;
 if(configured){
  if(entered!==configured){accessError.textContent='Clave incorrecta. Inténtalo nuevamente.';accessPassword.select();return}
 }else{
  if(entered.length<6){accessError.textContent='La clave debe tener al menos 6 caracteres.';return}
  const repeated=prompt('Repite la clave inicial para confirmarla:');
  if(repeated!==entered){accessError.textContent='Las claves no coinciden.';return}
  try{localStorage.setItem('luf-late-admin-key',entered)}catch{accessError.textContent='No se pudo guardar la clave en este navegador.';return}
 }
 keepSettingsSession();switchView('settings');
});
document.getElementById('settings-access-cancel').addEventListener('click',()=>switchView('register'));
function switchView(name){
 const config=name==='settings';
 if(!config){accessPassword.value='';}
 const granted=config&&settingsSessionValid();
 document.body.classList.toggle('settings-open',config);
 settingsView.hidden=!granted;
 accessGate.hidden=!config||granted;
 if(config&&!granted){refreshGate();requestAnimationFrame(()=>accessPassword.focus())}
 registerTab.classList.toggle('active',!config);
 settingsTab.classList.toggle('active',config);
 if(config){settingsTab.setAttribute('aria-current','page');registerTab.removeAttribute('aria-current');}
 else{registerTab.setAttribute('aria-current','page');settingsTab.removeAttribute('aria-current');}
 if(granted&&typeof renderRoster==='function')renderRoster();
}
registerTab.addEventListener('click',()=>switchView('register'));
settingsTab.addEventListener('click',()=>switchView('settings'));
switchView('register');
// Approved visual layout: configuration menu with dedicated sections.
const settingsCards=[
 {id:'settings-key',label:'Clave administrativa',icon:'🔐',desc:'Crear o cambiar la clave de administración.'},
 {id:'student-admin',label:'Estudiantes',icon:'👥',desc:'Nómina, cursos y credenciales QR.'},
 {id:'settings-lunch',label:'Pases de almuerzo',icon:'🎫',desc:'Buscar, habilitar y deshabilitar autorizaciones individuales o por curso.'},
 {id:'settings-early',label:'Retiro temprano',icon:'🏃',desc:'Autorizaciones por día, vigencia e importación.'},
 {id:'settings-tardy',label:'Horarios y atrasos',icon:'🕒',desc:'Jornada, tolerancia y alertas.'}
];
// Dedicated lunch-pass authorization panel; uses the existing student roster and saveRoster().
const lunchAdmin=document.createElement('section');
lunchAdmin.id='settings-lunch';lunchAdmin.className='settings-card';
lunchAdmin.innerHTML=`<div class="luf-pass-toolbar"><label>Buscar estudiante<input id="luf-pass-search" type="search" placeholder="Nombre, RUT o identificador"></label><label>Curso<select id="luf-pass-course"><option value="">Todos los cursos</option></select></label><label>Estado<select id="luf-pass-status"><option value="">Todos</option><option value="yes">Autorizados</option><option value="no">Sin autorización</option></select></label></div><div class="luf-pass-summary" id="luf-pass-summary"></div><div class="luf-pass-bulk"><label><input id="luf-pass-select-all" type="checkbox"> Seleccionar estudiantes visibles</label><span id="luf-pass-selected-count">0 seleccionados</span><button type="button" class="secondary" id="luf-pass-enable">Autorizar seleccionados</button><button type="button" class="secondary" id="luf-pass-disable">Desautorizar seleccionados</button></div><p class="luf-pass-note">Los permisos se aplican al registro existente. El horario y el control de salida y regreso no cambian.</p><p id="luf-pass-feedback" role="status" aria-live="polite"></p><div class="table-wrap"><table><thead><tr><th>Seleccionar</th><th>Estudiante</th><th>Curso</th><th>RUT</th><th>Autorización</th><th>Acción</th></tr></thead><tbody id="luf-pass-rows"></tbody></table></div>`;
settingsView.append(lunchAdmin);
const passSelected=new Set();
const passSearch=lunchAdmin.querySelector('#luf-pass-search'),passCourse=lunchAdmin.querySelector('#luf-pass-course'),passStatus=lunchAdmin.querySelector('#luf-pass-status');
const passRows=lunchAdmin.querySelector('#luf-pass-rows'),passFeedback=lunchAdmin.querySelector('#luf-pass-feedback');
const passSelectAll=lunchAdmin.querySelector('#luf-pass-select-all');
function passFiltered(){
 const query=passSearch.value.trim().toLocaleLowerCase('es-CL');
 return students.filter(st=>st.active!==false&&(!passCourse.value||st.course===passCourse.value)&&(!passStatus.value||(passStatus.value==='yes')===!!st.lunchPassAuthorized)&&(!query||[st.name,st.rut,st.id].some(x=>String(x||'').toLocaleLowerCase('es-CL').includes(query))));
}
function passUpdate(ids,enabled){
 if(!settingsUnlocked)return;
 const targets=students.filter(st=>ids.includes(st.id)&&st.active!==false&&!!st.lunchPassAuthorized!==enabled);
 if(!targets.length){passFeedback.textContent='No hay autorizaciones que modificar.';return}
 if(!confirm((enabled?'Autorizar':'Desautorizar')+' pase de almuerzo para '+targets.length+' estudiante(s)?'))return;
 const previous=targets.map(st=>[st,st.lunchPassAuthorized]);
 targets.forEach(st=>{st.lunchPassAuthorized=enabled});
 if(!saveRoster()){previous.forEach(([st,old])=>{st.lunchPassAuthorized=old});passFeedback.textContent='No se pudieron guardar los cambios.';return}
 passSelected.clear();
 passFeedback.textContent=(enabled?'Autorizaciones activadas: ':'Autorizaciones desactivadas: ')+targets.length+'.';
 renderPassAdmin();
 if(typeof renderRoster==='function')renderRoster();
}
function renderPassAdmin(){
 const courses=[...new Set(students.filter(st=>st.active!==false).map(st=>st.course))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
 const oldCourse=passCourse.value;
 passCourse.replaceChildren(new Option('Todos los cursos',''));
 courses.forEach(c=>passCourse.add(new Option(c,c)));
 passCourse.value=courses.includes(oldCourse)?oldCourse:'';
 const visible=passFiltered(),active=students.filter(st=>st.active!==false);
 lunchAdmin.querySelector('#luf-pass-summary').textContent=active.filter(st=>st.lunchPassAuthorized).length+' autorizados de '+active.length+' estudiantes activos · '+visible.length+' resultados visibles';
 passRows.replaceChildren();
 for(const st of visible){
  const tr=document.createElement('tr');
  const tdCheck=document.createElement('td'),check=document.createElement('input');check.type='checkbox';check.checked=passSelected.has(st.id);check.setAttribute('aria-label','Seleccionar '+st.name);check.addEventListener('change',()=>{if(check.checked)passSelected.add(st.id);else passSelected.delete(st.id);passSelectionSummary()});tdCheck.append(check);tr.append(tdCheck);
  for(const value of [st.name,st.course,st.rut,st.lunchPassAuthorized?'Autorizado':'Sin autorización']){const td=document.createElement('td');td.textContent=value;tr.append(td)}
  const actionCell=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=st.lunchPassAuthorized?'Desautorizar':'Autorizar';button.addEventListener('click',()=>passUpdate([st.id],!st.lunchPassAuthorized));actionCell.append(button);tr.append(actionCell);passRows.append(tr);
 }
 passSelectionSummary();
}
function passSelectionSummary(){
 const visible=passFiltered();
 const selected=visible.filter(st=>passSelected.has(st.id)).length;
 lunchAdmin.querySelector('#luf-pass-selected-count').textContent=selected+' seleccionados';
 passSelectAll.checked=visible.length>0&&selected===visible.length;
 passSelectAll.indeterminate=selected>0&&selected<visible.length;
}
for(const control of [passSearch,passCourse,passStatus])control.addEventListener(control===passSearch?'input':'change',()=>{passSelected.clear();renderPassAdmin()});
passSelectAll.addEventListener('change',()=>{passFiltered().forEach(st=>{if(passSelectAll.checked)passSelected.add(st.id);else passSelected.delete(st.id)});renderPassAdmin()});
lunchAdmin.querySelector('#luf-pass-enable').addEventListener('click',()=>passUpdate([...passSelected],true));
lunchAdmin.querySelector('#luf-pass-disable').addEventListener('click',()=>passUpdate([...passSelected],false));

// Search and course filtering for existing early-departure authorizations.
const earlyTools=document.createElement('div');earlyTools.className='luf-early-admin-tools';
earlyTools.innerHTML='<label>Buscar estudiante<input id="luf-early-search" type="search" placeholder="Nombre, RUT o código"></label><label>Curso<select id="luf-early-course"><option value="">Todos los cursos</option></select></label><label>Estado<select id="luf-early-status"><option value="">Todos</option><option value="enabled">Con pase habilitado</option><option value="disabled">Sin pase habilitado</option></select></label><p id="luf-early-results" aria-live="polite"></p><div id="luf-early-list" class="luf-early-list"></div>';
const earlyTarget=document.getElementById('settings-early');
earlyTarget.append(earlyTools);
const earlySearch=earlyTools.querySelector('#luf-early-search'),earlyCourse=earlyTools.querySelector('#luf-early-course'),earlyStatus=earlyTools.querySelector('#luf-early-status');
function refreshEarlyTools(){
 const old=earlyCourse.value;
 const courses=[...new Set(students.filter(st=>st.active!==false).map(st=>st.course))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
 earlyCourse.replaceChildren(new Option('Todos los cursos',''));
 courses.forEach(course=>earlyCourse.add(new Option(course,course)));
 earlyCourse.value=courses.includes(old)?old:'';
 const query=earlySearch.value.trim().toLocaleLowerCase('es-CL');
 const filtered=students.filter(st=>{
  if(st.active===false||earlyCourse.value&&st.course!==earlyCourse.value)return false;
  if(query&&![st.name,st.rut,st.id].some(v=>String(v||'').toLocaleLowerCase('es-CL').includes(query)))return false;
  const p=earlyPasses[st.id],enabled=!!p&&p.active!==false&&p.days?.some(Boolean);
  return !earlyStatus.value||(earlyStatus.value==='enabled'?enabled:!enabled);
 });
 earlyTools.querySelector('#luf-early-results').textContent=filtered.length+' estudiantes encontrados';
 const list=earlyTools.querySelector('#luf-early-list');list.replaceChildren();
 for(const st of filtered){
  const p=earlyPasses[st.id],enabled=!!p&&p.active!==false&&p.days?.some(Boolean);
  const row=document.createElement('div');row.className='luf-early-list-row';
  const description=document.createElement('span');description.textContent=st.name+' · '+st.course+' · '+(enabled?'Pase habilitado':'Sin pase habilitado');
  const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Administrar pase';
  button.addEventListener('click',()=>{
   const select=document.getElementById('early-student');
   select.value=st.id;
   select.dispatchEvent(new Event('change',{bubbles:true}));
   earlyAdminDetails.open=true;
   earlyAdminDetails.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  row.append(description,button);list.append(row);
 }
}
for(const control of [earlySearch,earlyCourse,earlyStatus])control.addEventListener(control===earlySearch?'input':'change',refreshEarlyTools);
document.getElementById('early-save').addEventListener('click',()=>setTimeout(refreshEarlyTools,0));

configSection.id='settings-tardy';
const shell=document.createElement('div');shell.className='settings-shell';
const side=document.createElement('nav');side.className='settings-sidebar';side.setAttribute('aria-label','Configuración');
const content=document.createElement('div');content.className='settings-content';
const intro=settingsView.querySelector('.settings-intro');
settingsView.append(shell);shell.append(side,content);
content.append(intro);
for(const card of settingsCards){
 const target=document.getElementById(card.id);
 if(!target)continue;
 const button=document.createElement('button');button.type='button';button.className='settings-nav-item';button.textContent=card.icon+'  '+card.label;button.dataset.target=card.id;
 side.append(button);
 const heading=document.createElement('div');heading.className='settings-card-heading';
 heading.innerHTML='<span class="settings-card-icon" aria-hidden="true">'+card.icon+'</span><div><strong>'+card.label+'</strong><small>'+card.desc+'</small></div>';
 if(target.id==='student-admin'){target.querySelector('.admin-heading')?.before(heading)}
 else target.prepend(heading);
 target.classList.add('settings-section');
 content.append(target);
 button.addEventListener('click',()=>selectSettings(card.id));
}
function selectSettings(id){
 document.querySelectorAll('.settings-section').forEach(el=>el.hidden=el.id!==id);
 document.querySelectorAll('.settings-nav-item').forEach(btn=>{const active=btn.dataset.target===id;btn.classList.toggle('active',active);btn.setAttribute('aria-current',active?'page':'false')});
}
const oldSwitch=switchView;
switchView=function(name){oldSwitch(name);if(name==='settings'&&settingsUnlocked){renderPassAdmin();refreshEarlyTools();selectSettings(document.querySelector('.settings-nav-item.active')?.dataset.target||'settings-key')};}
selectSettings('settings-key');
const settingsOverview=document.createElement('div');settingsOverview.className='settings-overview';
const overviewTitle=document.createElement('h3');overviewTitle.textContent='Administración del sistema';
settingsOverview.append(overviewTitle);
const tiles=document.createElement('div');tiles.className='settings-tiles';
settingsOverview.append(tiles);
settingsCards.forEach(c=>{const btn=document.createElement('button');btn.type='button';btn.className='settings-tile';btn.innerHTML='<span class="settings-tile-icon">'+c.icon+'</span><strong>'+c.label+'</strong><small>'+c.desc+'</small>';btn.addEventListener('click',()=>selectSettings(c.id));tiles.append(btn)});
content.insertBefore(settingsOverview,intro.nextSibling);
const origSelect=selectSettings;
selectSettings=function(id){origSelect(id);settingsOverview.hidden=id!=='overview'};
const home=document.createElement('button');home.type='button';home.className='settings-nav-item';home.textContent='⌂  Inicio';home.addEventListener('click',()=>selectSettings('overview'));side.prepend(home);
selectSettings('overview');
settingsTab.addEventListener('click',()=>{if(settingsUnlocked)selectSettings('overview')});

