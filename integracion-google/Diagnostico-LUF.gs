/**
 * Pruebas de diagnóstico de la integración LUF.
 * Copiar a un archivo independiente del proyecto Apps Script institucional.
 * No modifica estudiantes, movimientos ni fotografías.
 * Ejecutar diagnosticarIntegracionLUF desde el editor.
 */
function diagnosticarIntegracionLUF() {
  const checks = [];
  const check = (name, fn) => {
    try { checks.push({name, ok:true, detail:String(fn())}); }
    catch (e) { checks.push({name, ok:false, detail:String(e.message || e)}); }
  };
  check('Propiedad planilla', () => lufCfg_('LUF_SPREADSHEET_ID') ? 'Configurada' : 'Ausente');
  check('Propiedad OAuth', () => lufCfg_('LUF_GOOGLE_CLIENT_ID') ? 'Configurada' : 'Ausente');
  check('Propiedad fotos', () => lufCfg_('LUF_PHOTO_FOLDER_ID') ? 'Configurada' : 'Ausente');
  check('Acceso a carpeta privada', () => DriveApp.getFolderById(lufCfg_('LUF_PHOTO_FOLDER_ID')).getName());
  check('Estructura estudiantes', () => {
    const expected=['ID','RUT','NOMBRE','CURSO','ACTIVO','QR','FOTO_ID','FOTO_URL'];
    const sh=lufSheet_('ESTUDIANTES');
    const actual=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),expected.length)).getValues()[0].map(String);
    const missing=expected.filter(x=>!actual.includes(x));
    if(missing.length) throw new Error('Columnas faltantes: '+missing.join(', '));
    return 'Columnas necesarias presentes';
  });
  check('Estructura funcionarios', () => {
    const expected=['EMAIL','NOMBRE','ROL','ACTIVO'];
    const sh=lufSheet_('FUNCIONARIOS');
    const actual=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    const missing=expected.filter(x=>!actual.includes(x));
    if(missing.length) throw new Error('Columnas faltantes: '+missing.join(', '));
    return 'Columnas necesarias presentes';
  });
  check('Estructura movimientos', () => {
    const expected=['ID','FECHA_HORA','MODULO','ESTUDIANTE_ID','TIPO','MOTIVO','FUNCIONARIO','DETALLE_JSON'];
    const sh=lufSheet_('MOVIMIENTOS');
    const actual=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),expected.length)).getValues()[0].map(String);
    if(expected.some((x,i)=>x!==actual[i]))
      throw new Error('Encabezados actuales: '+actual.join(' | ')+'. No migrar automáticamente.');
    return 'Compatible con el registro central';
  });
  check('Lectura de estudiantes', () => lufStudents_().length+' registros legibles');
  const result={ok:checks.every(x=>x.ok),checks};
  Logger.log(JSON.stringify(result,null,2));
  return result;
}
