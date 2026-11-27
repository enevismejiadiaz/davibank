'use strict';

const https = require('https');

let cfg = null;
try { cfg = require('../data/telegram.json'); } catch (_) {}

function horaActual() {
  return new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    hour12: false,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// Llamada HTTP a la API de Telegram (fire-and-forget)
function _llamar(path, payload) {
  if (!cfg) return;
  const body = JSON.stringify(payload);
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${cfg.token}${path}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

// Igual pero captura la respuesta para obtener message_id
function _llamarConRespuesta(path, payload, cb) {
  if (!cfg) return;
  const body = JSON.stringify(payload);
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${cfg.token}${path}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try { const j = JSON.parse(data); if (j.ok && cb) cb(j.result.message_id); } catch (_) {}
    });
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

// ── Sesiones activas ──────────────────────────────────────────────────────────
// cedula → { paso, nombre, ultimaActividad, messageId }
const sesiones = new Map();

function registrar(cedula, paso, nombre) {
  if (!cedula) return;
  const prev = sesiones.get(String(cedula)) || {};
  sesiones.set(String(cedula), {
    paso,
    nombre: nombre || cedula,
    ultimaActividad: Date.now(),
    messageId: prev.messageId, // conservar el id del mensaje existente
  });
}

function completar(cedula) {
  sesiones.delete(String(cedula));
}

// Envía un mensaje nuevo (primer contacto) o edita el existente del cliente
function notificar(cedula, texto, esNuevo) {
  if (!cfg) return;
  const sesion  = sesiones.get(String(cedula));
  const msgId   = (sesion && !esNuevo) ? sesion.messageId : null;

  if (msgId) {
    // Editar el mensaje ya enviado → sin spam en el grupo
    _llamar('/editMessageText', {
      chat_id:    cfg.chatId,
      message_id: msgId,
      text:       texto,
      parse_mode: 'HTML',
    });
  } else {
    // Primer mensaje: enviar y guardar el message_id
    _llamarConRespuesta('/sendMessage', {
      chat_id:    cfg.chatId,
      text:       texto,
      parse_mode: 'HTML',
    }, (id) => {
      const s = sesiones.get(String(cedula));
      if (s) s.messageId = id;
    });
  }
}

// Detectar abandono cada minuto (sin actividad por 5 min)
setInterval(() => {
  const ahora = Date.now();
  for (const [cedula, s] of sesiones.entries()) {
    if (ahora - s.ultimaActividad > 5 * 60 * 1000) {
      const texto =
        `🔴 <b>Cliente abandonó el portal</b>\n` +
        `👤 ${s.nombre}\n` +
        `📍 Último paso: ${s.paso}\n` +
        `🕐 ${horaActual()}`;
      if (s.messageId) {
        _llamar('/editMessageText', { chat_id: cfg.chatId, message_id: s.messageId, text: texto, parse_mode: 'HTML' });
      } else {
        _llamar('/sendMessage', { chat_id: cfg.chatId, text: texto, parse_mode: 'HTML' });
      }
      sesiones.delete(cedula);
    }
  }
}, 60 * 1000);

module.exports = { notificar, horaActual, registrar, completar };
