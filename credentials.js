'use strict';
// Prototype credential printing: QR library loads from a public CDN and needs internet.
const credentialSelection=new Set();
window.credentialSelection=credentialSelection;
function updateCredentialCount(){$('credential-count').textContent=credentialSelection.size+' estudiantes seleccionados'}
window.updateCredentialSelection=(id,checked)=>{if(checked)credentialSelection.add(id);else credentialSelection.delete(id);updateCredentialCount()};
window.refreshCredentialCourses=()=>{const select=$('credential-course'),previous=select.value;const courses=[...new Set(students.filter(s=>s.active!==false).map(s=>s.course))].sort((a,b)=>a.localeCompare(b,'es'));select.replaceChildren();const all=document.createElement('option');all.value='';all.textContent='Todos los cursos';select.append(all);for(const course of courses){const option=document.createElement('option');option.value=course;option.textContent=course;select.append(option)}select.value=courses.includes(previous)?previous:''};
$('credential-select-course').addEventListener('click',()=>{const course=$('credential-course').value;for(const student of students){if(student.active!==false&&(!course||student.course===course))credentialSelection.add(student.id)}renderRoster();updateCredentialCount()});
$('credential-clear').addEventListener('click',()=>{credentialSelection.clear();renderRoster();updateCredentialCount()});
$('credential-print').addEventListener('click',()=>{
 const chosen=students.filter(s=>s.active!==false&&credentialSelection.has(s.id));
 if(!chosen.length){$('admin-feedback').textContent='Selecciona al menos un estudiante activo.';return}
 if(typeof QRCode==='undefined'){$('admin-feedback').textContent='No se cargó el generador QR. Conéctate a internet y vuelve a abrir el sistema.';return}
 const area=document.createElement('div');area.id='credential-print-area';document.body.append(area);
 for(const student of chosen){const card=document.createElement('article');card.className='credential-card';const heading=document.createElement('div');heading.className='credential-heading';heading.textContent='LICEO LUIS URBINA FLORES';const subtitle=document.createElement('div');subtitle.className='credential-subtitle';subtitle.textContent='CREDENCIAL ESTUDIANTIL · DEMO';const qr=document.createElement('div');qr.className='credential-qr';const name=document.createElement('strong');name.className='credential-name';name.textContent=student.name;const course=document.createElement('div');course.className='credential-course';course.textContent=student.course;const id=document.createElement('div');id.className='credential-id';id.textContent=student.id;card.append(heading,subtitle,qr,name,course,id);area.append(card);new QRCode(qr,{text:student.id,width:156,height:156,correctLevel:QRCode.CorrectLevel.M})}
 $('admin-feedback').textContent='Se prepararon '+chosen.length+' credenciales. Elige Imprimir o Guardar como PDF.';
 const images=[...area.querySelectorAll('img')];Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve}))).then(()=>{window.print();setTimeout(()=>area.remove(),1200)});
});
window.refreshCredentialCourses();updateCredentialCount();
