/**
 * ============================================================
 * app.js — Punto de entrada del servidor
 * ============================================================
 * Proyecto  : Portal de Pago DAVIbank
 * Versión   : 1.0.0
 * Fecha     : 2026-11-25
 * Autor     : Equipo de Desarrollo DAVIbank
 *
 * Descripción:
 *   Servidor Express que sirve el portal de pago de dos pasos.
 *   Usa Handlebars como motor de plantillas y archivos estáticos
 *   en /public para logos SVG y estilos.
 *
 * Rutas registradas:
 *   GET  /          → Paso 1 (cédula + teléfono)
 *   GET  /paso2     → Paso 2 (detalles del pago)
 *   POST /paso1     → Recibe datos del Paso 1 (demo, sin BD)
 *   POST /paso2     → Recibe datos del Paso 2 (demo, sin BD)
 *
 * Para ejecutar:
 *   npm install
 *   npm start          (producción)
 *   npm run dev        (desarrollo con nodemon)
 * ============================================================
 */

'use strict';

const express    = require('express');
const { engine } = require('express-handlebars');
const path       = require('path');
const routes     = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Motor de plantillas ────────────────────────────────────
// Handlebars con extensión .hbs y layout principal 'main'
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middlewares ────────────────────────────────────────────
// Parsear cuerpos de formularios HTML (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));
// Parsear JSON (para peticiones de API futuras)
app.use(express.json());
// Servir archivos estáticos desde /public (logos SVG, CSS adicional)
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rutas ──────────────────────────────────────────────────
app.use('/', routes);

// ─── Manejo de errores 404 ──────────────────────────────────
app.use((req, res) => {
  res.status(404).send('<h2>404 — Página no encontrada</h2>');
});

// ─── Inicio del servidor ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Portal de Pago DAVIbank corriendo en http://localhost:${PORT}`);
});

module.exports = app;
