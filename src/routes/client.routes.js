const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Crear cliente (admin o cobrador)
router.post('/', verifyToken, clientController.createClient);

// Traer clientes por cobrador
router.get('/cobrador/:cobradorId', verifyToken, async (req, res) => {
  const Client = require('../models/Client');

  const clients = await Client.find({
    cobrador: req.params.cobradorId
  }).populate('cobrador');

  res.json(clients);
});

module.exports = router;
