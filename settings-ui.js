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
function switchView(name){
 const config=name==='settings';
 document.body.classList.toggle('settings-open',config);
 settingsView.hidden=!config;
 registerTab.classList.toggle('active',!config);
 settingsTab.classList.toggle('active',config);
 if(config){settingsTab.setAttribute('aria-current','page');registerTab.removeAttribute('aria-current');}
 else{registerTab.setAttribute('aria-current','page');settingsTab.removeAttribute('aria-current');}
 if(config&&typeof renderRoster==='function')renderRoster();
}
registerTab.addEventListener('click',()=>switchView('register'));
settingsTab.addEventListener('click',()=>switchView('settings'));
switchView('register');
// Approved visual layout: configuration menu with dedicated sections.
const settingsCards=[
 {id:'settings-key',label:'Clave administrativa',icon:'🔐',desc:'Crear o cambiar la clave de administración.'},
 {id:'student-admin',label:'Estudiantes',icon:'👥',desc:'Nómina, cursos y credenciales QR.'},
 {id:'settings-early',label:'Retiro temprano',icon:'🏃',desc:'Autorizaciones por día, vigencia e importación.'},
 {id:'settings-tardy',label:'Horarios y atrasos',icon:'🕒',desc:'Jornada, tolerancia y alertas.'}
];
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
switchView=function(name){oldSwitch(name);if(name==='settings')selectSettings(document.querySelector('.settings-nav-item.active')?.dataset.target||'settings-key')};
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
settingsTab.addEventListener('click',()=>selectSettings('overview'));

