const Credit = require('../models/Credit');
const Client = require('../models/Client');
const Collaborator = require('../models/Collaborator');

// Crear crédito
exports.createCredit = async (req, res) => {
  try {
    const { cliente, montoPrestado } = req.body;

    // Verificar si cliente existe
    const client = await Client.findById(cliente);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Verificar si tiene crédito pendiente
    const creditoPendiente = await Credit.findOne({
      cliente,
      estado: 'pendiente'
    });

    if (creditoPendiente) {
      return res.status(400).json({
        message: "El cliente ya tiene un crédito pendiente"
      });
    }

    // Calcular 30%
    const montoTotal = montoPrestado * 1.3;

    // Crear crédito
    const newCredit = new Credit({
      montoPrestado,
      montoTotal,
      cliente,
      cobrador: client.cobrador
    });

    await newCredit.save();

    res.status(201).json({
      message: "Crédito creado correctamente",
      credit: newCredit
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener créditos por cliente
exports.getCreditsByClient = async (req, res) => {
  try {
    const credits = await Credit.find({
      cliente: req.params.clienteId
    })
    .populate('cliente')
    .populate('cobrador');

    res.json(credits);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Marcar crédito como pagado
exports.payCredit = async (req, res) => {
  try {
    const credit = await Credit.findById(req.params.creditId);

    if (!credit) {
      return res.status(404).json({ message: "Crédito no encontrado" });
    }

    credit.estado = 'pagado';
    credit.fechaPago = new Date();

    await credit.save();

    res.json({ message: "Crédito pagado correctamente", credit });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
