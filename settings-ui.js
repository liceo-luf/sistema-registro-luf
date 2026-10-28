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
