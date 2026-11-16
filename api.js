'use strict';
const LUF_API_URL='https://script.google.com/a/macros/liceoluf.com/s/AKfycby0Vm6PjJUbq153t5XpHgk5veq11GbOZcMTaD0TWdIgjWX0w48pO6T-3nHCE8e0IFaz/exec';
const LUF_API={url:LUF_API_URL,async ping(){const r=await fetch(LUF_API_URL+'?action=ping',{credentials:'include'});if(!r.ok)throw new Error('API HTTP '+r.status);return r.json()},async post(action,payload={}){const r=await fetch(LUF_API_URL,{method:'POST',credentials:'include',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...payload})});if(!r.ok)throw new Error('API HTTP '+r.status);return r.json()}};
window.LUF_API=LUF_API;
