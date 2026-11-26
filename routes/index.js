'use strict';

const express = require('express');
const router  = express.Router();
const { buscarPorCedula } = require('../data/loader');

// Formatea un número como moneda colombiana: $1.234.567
function formatCOP(val) {
  const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (!val || isNaN(n) || n <= 0) return val || '';
  return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// GET / → Paso 1
router.get('/', (req, res) => {
  res.render('paso1', { title: 'Portal de pago — Paso 1 de 4', paso: 1 });
});

// POST /paso1
router.post('/paso1', (req, res) => {
  const { cedula, telefono } = req.body;
  if (!cedula || !telefono) {
    return res.render('paso1', {
      title: 'Portal de pago — Paso 1 de 4',
      paso: 1,
      error: 'Por favor completa todos los campos.',
    });
  }
  res.redirect(`/paso2?cedula=${encodeURIComponent(cedula)}`);
});

// GET /paso2
router.get('/paso2', (req, res) => {
  const cedula = req.query.cedula || '';
  const cliente = buscarPorCedula(cedula);

  res.render('paso2', {
    title: 'Portal de pago — Paso 2 de 4',
    paso: 2,
    paso2activo: true,
    cedula,
    nombreCliente: cliente ? String(cliente['NOMBRE'] || '').trim() : '',
    numProducto:   cliente ? String(cliente['OBLIGACION'] || '').trim() : '',
    valorPagar:    cliente ? String(Math.round(Number(cliente['SALDO TOTAL']) || 0)) : '',
  });
});

// POST /paso2
router.post('/paso2', (req, res) => {
  const { cedula, nombreCliente, numProducto, valorPagar, otroValor, terminos } = req.body;

  if (!nombreCliente || !numProducto || !valorPagar || !terminos) {
    return res.render('paso2', {
      title: 'Portal de pago — Paso 2 de 4',
      paso: 2,
      paso2activo: true,
      error: 'Por favor completa todos los campos y acepta los términos.',
      cedula,
      nombreCliente,
      numProducto,
      valorPagar,
      otroValor,
    });
  }

  const params = new URLSearchParams({ cedula, nombreCliente, numProducto, valorPagar, otroValor });
  res.redirect('/paso3?' + params.toString());
});

// GET /paso3
router.get('/paso3', (req, res) => {
  res.render('paso3', {
    title: 'Portal de pago — Paso 3 de 4',
    paso: 3,
    paso2activo: true,
    paso3activo: true,
    cedula:        req.query.cedula        || '',
    nombreCliente: req.query.nombreCliente || '',
    numProducto:   req.query.numProducto   || '',
    valorPagar:    formatCOP(req.query.valorPagar),
    otroValor:     formatCOP(req.query.otroValor),
  });
});

// POST /paso3
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

  res.render('confirmacion', {
    title: '¡Pago enviado!',
    nombreCliente, numProducto,
    valorPagar: formatCOP(valorPagar),
    otroValor:  formatCOP(otroValor),
    banco, correo,
  });
});

module.exports = router;