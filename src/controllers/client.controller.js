const Client = require('../models/Client');
const Collaborator = require('../models/Collaborator');

// Crear cliente
exports.createClient = async (req, res) => {
  try {
    const { nombre, cedula, direccion, celular, cobrador } = req.body;

    let cobradorId;

    // Si es cobrador, se asigna automáticamente
    if (req.user.role === 'cobrador') {

      const collaborator = await Collaborator.findOne({ user: req.user.id });

      if (!collaborator) {
        return res.status(400).json({ message: "Cobrador no encontrado" });
      }

      cobradorId = collaborator._id;

    } else {
      // Si es admin, debe enviar ID del cobrador
      cobradorId = cobrador;
    }

    const newClient = new Client({
      nombre,
      cedula,
      direccion,
      celular,
      cobrador: cobradorId
    });

    await newClient.save();

    res.status(201).json({
      message: "Cliente creado correctamente",
      client: newClient
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
