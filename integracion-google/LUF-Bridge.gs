/**
 * Servidor HTMLService para conectar GitHub Pages sin CORS.
 * Añadir al proyecto Apps Script que contiene LUF-Central.gs.
 * El control de acceso real se realiza en lufCentralDispatch_.
 */
function lufBridgePage() {
  return HtmlService.createHtmlOutputFromFile('LUF-Bridge')
    .setTitle('LUF - conexión institucional')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function lufBridgeCall(idToken, action, payload) {
  const allowed=['session','students','studentPhoto','saveStudent','savePhoto','movements','saveMovement'];
  if (!allowed.includes(action)) throw new Error('Acción no permitida');
  return lufCentralDispatch_(idToken,action,payload||{});
}
/**
 * IMPORTANTE: Apps Script admite una única función doGet por proyecto.
 * Si ya existe doGet, integrar allí la rama ?luf_bridge=1,
 * sin declarar una segunda función.
 *
 * Ejemplo:
 * if (e && e.parameter && e.parameter.luf_bridge === '1')
 *   return lufBridgePage();
 */
