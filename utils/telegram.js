'use strict';

const https = require('https');

let cfg = null;
try { cfg = require('../data/telegram.json'); } catch (_) { /* notificaciones desactivadas */ }

// Hora Colombia
function horaActual() {
  return new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    hour12: false,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// Enviar mensaje a Telegram (fire-and-forget)
function enviar(texto) {
  if (!cfg) return;
  const body = JSON.stringify({ chat_id: cfg.chatId, text: texto, parse_mode: 'HTML' });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${cfg.token}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

// ── Rastreador de sesiones activas ────────────────────────────────────────────
// { cedula -> { paso, nombre, ultimaActividad } }
const sesiones = new Map();

function registrar(cedula, paso, nombre) {
  if (!cedula) return;
  sesiones.set(String(cedula), {
    paso,
    nombre: nombre || cedula,
    ultimaActividad: Date.now(),
  });
}

function completar(cedula) {
  sesiones.delete(String(cedula));
}

// Revisar cada minuto si alguien abandonó (sin actividad por 5 min)
setInterval(() => {
  const ahora = Date.now();
  for (const [cedula, s] of sesiones.entries()) {
    if (ahora - s.ultimaActividad > 5 * 60 * 1000) {
      enviar(
        `🔴 <b>Cliente abandonó el portal</b>\n` +
        `👤 ${s.nombre}\n` +
        `📍 Último paso: ${s.paso}\n` +
        `🕐 ${horaActual()}`
      );
      sesiones.delete(cedula);
    }
  }
}, 60 * 1000);

module.exports = { enviar, horaActual, registrar, completar };
