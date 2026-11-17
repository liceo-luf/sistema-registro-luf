/**
 * LUF - API central (preparación, NO PUBLICAR sin configurar OAuth).
 * Archivo de referencia para el proyecto Apps Script institucional existente.
 * No reemplaza Código.gs del sistema anterior.
 *
 * Propiedades del script obligatorias:
 *   LUF_SPREADSHEET_ID: ID de la planilla institucional
 *   LUF_GOOGLE_CLIENT_ID: ID de cliente OAuth Web de Google
 *   LUF_PHOTO_FOLDER_ID: ID de carpeta privada de fotografías
 *
 * Identidad: verifica token ID emitido por Google contra tokeninfo,
 * comprueba audiencia, dominio y cuenta activa en FUNCIONARIOS.
 * Nunca confía en un email enviado por el navegador.
 */
const LUF_CENTRAL = Object.freeze({
  domain: 'liceoluf.com',
  maxPhotoBytes: 3 * 1024 * 1024
});
function lufCfg_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error('Falta configurar ' + key);
  return value;
}
function lufDb_() {
  return SpreadsheetApp.openById(lufCfg_('LUF_SPREADSHEET_ID'));
}
function lufSheet_(name) {
  const sheet = lufDb_().getSheetByName(name);
  if (!sheet) throw new Error('Falta hoja ' + name);
  return sheet;
}
function lufRows_(name) {
  const values = lufSheet_(name).getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values[0].map(String);
  return values.slice(1).map((values, i) => {
    const row = {_row:i+2};
    header.forEach((key,j) => row[key] = values[j]);
    return row;
  }).filter(row => lufText_(row[header[0]]) && lufText_(row[header[0]]) !== header[0]);
}
function lufText_(x) { return String(x == null ? '' : x).trim(); }
function lufYes_(x) { return x === true || ['true','1','si','sí','activo'].includes(lufText_(x).toLowerCase()); }
function lufIdentity_(idToken) {
  if (!idToken || typeof idToken !== 'string' || idToken.length > 6000) throw new Error('Sesión no válida');
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {muteHttpExceptions:true});
  if (response.getResponseCode() !== 200) throw new Error('Inicia sesión nuevamente con Google');
  const claim = JSON.parse(response.getContentText());
  if (claim.aud !== lufCfg_('LUF_GOOGLE_CLIENT_ID')) throw new Error('Cliente no autorizado');
  if (!['accounts.google.com','https://accounts.google.com'].includes(claim.iss)) throw new Error('Emisor inválido');
  if (Number(claim.exp) * 1000 <= Date.now()) throw new Error('Sesión vencida');
  const email = lufText_(claim.email).toLowerCase();
  if (claim.email_verified !== 'true' && claim.email_verified !== true) throw new Error('Correo no verificado');
  if (!email.endsWith('@' + LUF_CENTRAL.domain) || claim.hd !== LUF_CENTRAL.domain) throw new Error('Usa tu cuenta institucional');
  const user = lufRows_('FUNCIONARIOS').find(r => lufText_(r.EMAIL).toLowerCase() === email && lufYes_(r.ACTIVO));
  if (!user) throw new Error('Funcionario no autorizado');
  return {email, name:lufText_(user.NOMBRE), role:lufText_(user.ROL).toUpperCase()};
}
function lufAdmin_(user) {
  if (user.role !== 'ADMIN') throw new Error('Se requiere rol ADMIN');
}
function lufAudit_(user, action, id) {
  lufSheet_('AUDITORIA').appendRow([new Date(),user.email,action,'ESTUDIANTE',id,'']);
}
function lufStudents_() {
  return lufRows_('ESTUDIANTES').filter(r => lufText_(r.ID) && lufText_(r.RUT) && lufText_(r.NOMBRE)).map(r => ({
    id:lufText_(r.ID), rut:lufText_(r.RUT), name:lufText_(r.NOMBRE),
    course:lufText_(r.CURSO), active:lufYes_(r.ACTIVO),
    qr:lufText_(r.QR)||lufText_(r.ID),
    hasPhoto:!!lufText_(r.FOTO_ID)
  }));
}
function lufStudent_(id) {
  return lufRows_('ESTUDIANTES').find(r => lufText_(r.ID) === lufText_(id));
}
function lufPhoto_(studentId) {
  const row = lufStudent_(studentId);
  if (!row || !row.FOTO_ID) return {photo:''};
  const file = DriveApp.getFileById(lufText_(row.FOTO_ID));
  if (file.getParents().hasNext()) {
    let ok = false;
    const parents = file.getParents();
    while (parents.hasNext()) if (parents.next().getId() === lufCfg_('LUF_PHOTO_FOLDER_ID')) ok = true;
    if (!ok) throw new Error('Fotografía fuera de carpeta institucional');
  } else throw new Error('Fotografía sin carpeta');
  const blob = file.getBlob();
  if (blob.getBytes().length > LUF_CENTRAL.maxPhotoBytes) throw new Error('Fotografía demasiado grande');
  return {photo:'data:'+blob.getContentType()+';base64,'+Utilities.base64Encode(blob.getBytes())};
}
function lufSavePhoto_(user, studentId, dataUrl) {
  lufAdmin_(user);
  const row = lufStudent_(studentId);
  if (!row) throw new Error('Estudiante no encontrado');
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl||''));
  if (!match) throw new Error('Formato de imagen no válido');
  const bytes = Utilities.base64Decode(match[2]);
  if (!bytes.length || bytes.length > LUF_CENTRAL.maxPhotoBytes) throw new Error('Máximo 3 MB');
  const folder = DriveApp.getFolderById(lufCfg_('LUF_PHOTO_FOLDER_ID'));
  const ext = { 'image/jpeg':'.jpg', 'image/png':'.png', 'image/webp':'.webp' }[match[1]];
  const file = folder.createFile(Utilities.newBlob(bytes,match[1],lufText_(studentId)+ext));
  const sheet = lufSheet_('ESTUDIANTES');
  const header = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  let col = header.indexOf('FOTO_ID')+1;
  if (!col) { col=sheet.getLastColumn()+1; sheet.getRange(1,col).setValue('FOTO_ID'); }
  const oldId = lufText_(row.FOTO_ID);
  sheet.getRange(row._row,col).setValue(file.getId());
  lufAudit_(user,'SUBIR_FOTO',studentId);
  if (oldId && oldId !== file.getId()) {
    try { const old = DriveApp.getFileById(oldId); const parents=old.getParents(); while(parents.hasNext()) if(parents.next().getId()===folder.getId()) old.setTrashed(true); } catch(e) {}
  }
  return {ok:true};
}
function lufSaveStudent_(user, data) {
  lufAdmin_(user);
  data = data || {};
  const name=lufText_(data.name), course=lufText_(data.course), rut=lufText_(data.rut);
  if (!name || !course || !rut) throw new Error('Nombre, curso y RUT obligatorios');
  if ([name,course,rut].some(v => v.length > 180)) throw new Error('Datos demasiado extensos');
  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet=lufSheet_('ESTUDIANTES');
    const current=lufRows_('ESTUDIANTES');
    const requestedId=lufText_(data.id);
    const duplicate=current.find(r=>lufText_(r.RUT).toLowerCase()===rut.toLowerCase() && lufText_(r.ID)!==requestedId);
    if (duplicate) throw new Error('RUT ya registrado');
    const found=requestedId && current.find(r=>lufText_(r.ID)===requestedId);
    if (requestedId && !found) throw new Error('No se puede editar un estudiante inexistente');
    const id=requestedId||'LUF-'+Utilities.getUuid().slice(0,8).toUpperCase();
    const row=[id,rut,name,course,data.active!==false,lufText_(data.qr)||id];
    if (found) sheet.getRange(found._row,1,1,6).setValues([row]);
    else sheet.appendRow(row);
    lufAudit_(user,'GUARDAR_ESTUDIANTE',id);
    return {ok:true,id};
  } finally {
    lock.releaseLock();
  }
}
/**
 * NOTA DE DESPLIEGUE: Apps Script ContentService no ofrece un control
 * CORS general para peticiones autenticadas desde GitHub Pages.
 * Este código define operaciones seguras, pero no se debe conectar
 * directamente mediante fetch desde GitHub hasta elegir un transporte
 * compatible (por ejemplo un proxy autenticado o alojar la interfaz
 * en el mismo origen de Apps Script).
 */
function lufCentralDispatch_(idToken, action, payload) {
  const user=lufIdentity_(idToken);
  payload=payload||{};
  switch(action) {
    case 'session': return {ok:true,user};
    case 'students': return {ok:true,students:lufStudents_()};
    case 'studentPhoto': return {ok:true,...lufPhoto_(payload.studentId)};
    case 'saveStudent': return lufSaveStudent_(user,payload.student||{});
    case 'savePhoto': return lufSavePhoto_(user,payload.studentId,payload.dataUrl);
    default: throw new Error('Acción no permitida');
  }
}
