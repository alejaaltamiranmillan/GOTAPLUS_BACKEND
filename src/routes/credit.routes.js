const express = require('express');
const router = express.Router();
const creditController = require('../controllers/credit.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Crear crédito
router.post('/', verifyToken, creditController.createCredit);

// Obtener créditos de un cliente
router.get('/cliente/:clienteId', verifyToken, creditController.getCreditsByClient);

// Marcar crédito como pagado
router.put('/pagar/:creditId', verifyToken, creditController.payCredit);

module.exports = router;
