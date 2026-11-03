'use strict';
/* Unified presentation only. All registration and validation handlers remain in app.js. */
(function(){
 const $=id=>document.getElementById(id);
 const panel=document.querySelector('.workspace > .panel');
 const modulesNav=$('modules');
 const scanner=document.querySelector('.scanner-box');
 const form=$('movement-form');
 const withdrawal=$('withdrawal-entry');
 const historyHead=panel.querySelector('.history-head');
 const historyTable=$('history').closest('.table-wrap');
 const early=$('early-panel');
 if(!panel||!modulesNav||!scanner||!form)return;
 const layout=document.createElement('div');layout.className='luf-operation-layout';
 const left=document.createElement('section');left.className='luf-scan-card';
 const right=document.createElement('section');right.className='luf-activity-card';
 const tabs=document.createElement('div');tabs.className='luf-input-tabs';
 const qrTab=document.createElement('button');qrTab.type='button';qrTab.className='luf-input-tab active';qrTab.textContent='▣  Escanear QR';
 const searchTab=document.createElement('button');searchTab.type='button';searchTab.className='luf-input-tab';searchTab.textContent='⌕  Buscar estudiante';
 tabs.append(qrTab,searchTab);left.append(tabs);
 const qrPane=document.createElement('div');qrPane.className='luf-qr-pane';qrPane.append(scanner);
 const searchPane=document.createElement('div');searchPane.className='luf-search-pane';searchPane.hidden=true;searchPane.append(withdrawal,form);
 left.append(qrPane,searchPane);
 const recentTitle=document.createElement('div');recentTitle.className='luf-recent-heading';
 const recentName=document.createElement('h3');recentName.textContent='Últimos movimientos';
 const historyLink=document.createElement('button');historyLink.type='button';historyLink.className='luf-history-link';historyLink.textContent='Ver historial completo ↗';
 recentTitle.append(recentName,historyLink);
 right.append(recentTitle,historyTable,historyHead);
 layout.append(left,right);
 panel.insertBefore(layout,panel.querySelector('.history-head'));
 const exception=document.createElement('div');exception.className='luf-special-action';exception.hidden=true;
 const exceptionTitle=document.createElement('strong');const exceptionDesc=document.createElement('p');
 const exceptionBtn=document.createElement('button');exceptionBtn.type='button';exceptionBtn.className='secondary';exceptionBtn.textContent='Registrar manualmente +';
 exception.append(exceptionTitle,exceptionDesc,exceptionBtn);
 right.prepend(exception);
 const notice=document.createElement('div');notice.className='luf-module-notice';notice.setAttribute('role','note');
 panel.append(notice);
 const counter=document.createElement('section');counter.className='luf-side-counter';counter.innerHTML='<div class="luf-side-counter-head"><strong>Resumen de hoy</strong><span aria-hidden="true">▥</span></div><div class="luf-side-counter-body"><small>Movimientos registrados</small><strong id="luf-total-count">0</strong><small id="luf-counter-date"></small><div class="luf-count-grid"><div class="luf-count-item late"><span>Atrasos</span><b id="luf-late-count">0</b></div><div class="luf-count-item retire"><span>Retiros</span><b id="luf-retire-count">0</b></div><div class="luf-count-item passes"><span>Pases</span><b id="luf-pass-count">0</b></div><div class="luf-count-item other"><span>Otros</span><b id="luf-other-count">0</b></div></div><button type="button" id="luf-stat-link">Ver estadísticas ↗</button></div>';
 modulesNav.after(counter);
 const moduleNotes={
 atrasos:'Los atrasos se registran de acuerdo con los horarios y las reglas configuradas.',
 retiros:'El retiro requiere verificar al adulto responsable y registrar sus datos.',
 pases:'Los pases de almuerzo registran salida y posterior regreso.',
 temprano:'El retiro temprano requiere pase vigente. Las excepciones se autorizan manualmente.',
 ingreso:'El ingreso tarde se registra conforme al pase y su autorización.',
 almuerzo:'Registra la atención del servicio de alimentación.'
 };
 const manual={
 retiros:['Retiro con adulto responsable','Busca al estudiante para comprobar los datos del adulto que retira.'],
 temprano:['Salida excepcional','Busca al estudiante y registra el motivo obligatorio.'],
 atrasos:['Registro manual','Busca al estudiante para registrar el atraso.'],
 pases:['Registro manual','Busca al estudiante para registrar la salida o el regreso.'],
 ingreso:['Ingreso manual','Busca al estudiante para registrar su ingreso.'],
 almuerzo:['Registro manual','Busca al estudiante para registrar su almuerzo.']
 };
 function choosePane(name){
 const isSearch=name==='search';qrPane.hidden=isSearch;searchPane.hidden=!isSearch;
 qrTab.classList.toggle('active',!isSearch);searchTab.classList.toggle('active',isSearch);
 qrTab.setAttribute('aria-pressed',String(!isSearch));searchTab.setAttribute('aria-pressed',String(isSearch));
 if(isSearch){(current==='retiros'?$('withdrawal-rut'):$('student-search'))?.focus()}else if(current!=='retiros')$('scan-input')?.focus();
 }
 qrTab.addEventListener('click',()=>choosePane('qr'));searchTab.addEventListener('click',()=>choosePane('search'));
 exceptionBtn.addEventListener('click',()=>{choosePane('search');if(current==='temprano'){early.querySelectorAll('details')[1]?.setAttribute('open','');early.scrollIntoView({behavior:'smooth',block:'nearest'})}});
 historyLink.addEventListener('click',()=>{historyHead.scrollIntoView({behavior:'smooth',block:'start'});historyTable.classList.toggle('luf-history-expanded')});
 $('luf-stat-link').addEventListener('click',()=>{$('stats').hidden=!$('stats').hidden;if(!$('stats').hidden)$('stats').scrollIntoView({behavior:'smooth',block:'nearest'})});
 function refreshCounts(){
 const today=todayRecords().filter(r=>!r.annulled);
 const late=today.filter(r=>r.module==='atrasos').length;
 const retire=today.filter(r=>r.module==='retiros'||r.module==='temprano').length;
 const passes=today.filter(r=>r.module==='pases').length;
 $('luf-total-count').textContent=today.length;
 $('luf-late-count').textContent=late;$('luf-retire-count').textContent=retire;
 $('luf-pass-count').textContent=passes;$('luf-other-count').textContent=today.length-late-retire-passes;
 $('luf-counter-date').textContent=new Date().toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'});
 }
 function refreshView(){
 const module=modules.find(m=>m[0]===current);if(!module)return;
 recentName.textContent='Últimos registros de '+module[1].toLowerCase();
 notice.textContent='ⓘ  Importante     '+moduleNotes[current];
 exceptionTitle.textContent=manual[current][0];exceptionDesc.textContent=manual[current][1];
 exception.hidden=current!=='retiros'&&current!=='temprano';
 exceptionBtn.textContent=current==='temprano'?'Registrar salida excepcional +':'Buscar estudiante +';
 const isRetire=current==='retiros';
 qrTab.disabled=isRetire;qrTab.title=isRetire?'Este módulo utiliza búsqueda y verificación manual.':'';
 choosePane(isRetire?'search':'qr');
 if(early){early.classList.toggle('luf-early-extras',current==='temprano');if(current==='temprano')right.append(early)}
 refreshCounts();
 }
 const baseRender=render;
 render=function(){baseRender();refreshView()};
 const baseHistory=renderHistory;
 renderHistory=function(){baseHistory();refreshCounts()};
 const baseStats=renderStats;
 renderStats=function(){baseStats();refreshCounts()};
 refreshView();
})();
