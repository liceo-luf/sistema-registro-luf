'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const login=document.getElementById('luf-login'),app=document.getElementById('app'),form=document.getElementById('luf-login-form'),email=document.getElementById('luf-login-email'),feedback=document.getElementById('luf-login-feedback');
 const sessionKey='luf-central-user-v1';
 function showApp(user){window.LUF_USER=user;sessionStorage.setItem(sessionKey,JSON.stringify(user));login.hidden=true;app.hidden=false;document.body.classList.add('luf-authenticated')}
 async function validate(address){feedback.textContent='Verificando acceso…';const result=await window.LUF_API.post('login',{email:address});if(!result.ok)throw new Error(result.error||'Acceso no autorizado');showApp(result.user)}
 form.addEventListener('submit',async e=>{e.preventDefault();const address=email.value.trim().toLowerCase();if(!address.endsWith('@liceoluf.com')){feedback.textContent='Debes utilizar tu correo institucional @liceoluf.com.';return}try{await validate(address)}catch(err){feedback.textContent=err.message||'No fue posible validar el acceso.'}});
 try{const saved=JSON.parse(sessionStorage.getItem(sessionKey)||'null');if(saved?.email)validate(saved.email).catch(()=>sessionStorage.removeItem(sessionKey))}catch{sessionStorage.removeItem(sessionKey)}
});
