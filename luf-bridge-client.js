/* LUF bridge transport for a separately deployed Apps Script HTMLService web app.
 * Does not enable production mode or store tokens. Must be configured and
 * authenticated by the hosting application before use.
 */
(function(global){
  'use strict';
  const CHANNEL='luf-bridge-v1';
  const ACTIONS=new Set(['session','students','studentPhoto','saveStudent','savePhoto','movements','saveMovement']);
  function createLUFBridge(url, getIdToken) {
    if (typeof getIdToken!=='function') throw new Error('Falta proveedor de sesión');
    const endpoint=new URL(url);
    if (endpoint.protocol!=='https:' || !/^(script\.google\.com|script\.googleusercontent\.com)$/.test(endpoint.hostname))
      throw new Error('Origen de Apps Script no válido');
    const nonce=global.crypto.randomUUID();
    const trustedOrigins=new Set(['https://script.google.com','https://script.googleusercontent.com']);
    let verifiedOrigin=null;
    const iframe=document.createElement('iframe');
    iframe.hidden=true;
    iframe.title='Conexión institucional LUF';
    iframe.referrerPolicy='no-referrer';
    iframe.src=endpoint.href;
    const pending=new Map();
    let ready=false;
    let destroyed=false;
    const onMessage=(event)=>{
      if (event.source!==iframe.contentWindow || !trustedOrigins.has(event.origin)) return;
      const msg=event.data;
      if (!msg || msg.channel!==CHANNEL) return;
      if (msg.type==='ready' && msg.nonce===nonce) {verifiedOrigin=event.origin;ready=true;return;}
      if (event.origin!==verifiedOrigin) return;
      if (msg.type==='response' && pending.has(msg.requestId)) {
        const item=pending.get(msg.requestId);pending.delete(msg.requestId);
        clearTimeout(item.timer);
        msg.ok?item.resolve(msg.result):item.reject(new Error(msg.error||'Error del servidor'));
      }
    };
    global.addEventListener('message',onMessage);
    iframe.addEventListener('load',()=>{
      if (!destroyed) iframe.contentWindow.postMessage({channel:CHANNEL,type:'connect',nonce},'*');
    });
    document.body.appendChild(iframe);
    async function call(action,payload={}) {
      if (destroyed) throw new Error('Conexión cerrada');
      if (!ACTIONS.has(action)) throw new Error('Acción no permitida');
      const token=await getIdToken();
      if (!token) throw new Error('Inicia sesión institucional');
      const start=Date.now();
      while(!ready && Date.now()-start<10000) await new Promise(resolve=>setTimeout(resolve,100));
      if (!ready) throw new Error('No se pudo establecer conexión con Apps Script');
      const requestId=global.crypto.randomUUID();
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{pending.delete(requestId);reject(new Error('Tiempo de espera agotado'));},30000);
        pending.set(requestId,{resolve,reject,timer});
        iframe.contentWindow.postMessage({channel:CHANNEL,type:'call',requestId,idToken:token,action,payload},verifiedOrigin);
      });
    }
    return {call,destroy(){
      destroyed=true;global.removeEventListener('message',onMessage);iframe.remove();
      for(const item of pending.values()){clearTimeout(item.timer);item.reject(new Error('Conexión cerrada'));}
      pending.clear();
    }};
  }
  global.createLUFBridge=createLUFBridge;
})(window);
