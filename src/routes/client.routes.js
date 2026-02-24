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

// Obtener clientes del cobrador autenticado
router.get('/mis-clientes', verifyToken, async (req, res) => {
  try {
    const Client = require('../models/Client');
    const Credit = require('../models/Credit');

    // Obtener clientes como POJOs para poder mutarlos
    const clients = await Client.find({ cobrador: req.user.id }).lean();

    // Para cada cliente, verificar si tiene un crédito pendiente
    for (let client of clients) {
      const creditoPendiente = await Credit.findOne({
        cliente: client._id,
        estado: 'pendiente'
      });

      client.tieneDeuda = creditoPendiente ? true : false;
    }

    // Responder con la lista de clientes incluyendo la propiedad 'tieneDeuda'
    res.json(clients);

  } catch (error) {
    console.error('Error obteniendo mis-clientes:', error);
    res.status(500).json({ message: 'Error obteniendo clientes' });
  }
});

module.exports = router;