const Client = require("../models/Client");
const Collaborator = require("../models/Collaborator");

// Obtener todos los clientes del cobrador autenticado
exports.getAllClients = async (req, res) => {
  try {
    const Collaborator = require("../models/Collaborator");
    const Credit = require("../models/Credit");

    // Encontrar el collaborator asociado al usuario autenticado
    const collaborator = await Collaborator.findOne({ user: req.user.id });

    if (!collaborator) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    // Obtener clientes del cobrador
    const clients = await Client.find({ cobrador: collaborator._id }).lean();

    // Para cada cliente, verificar si tiene un crédito pendiente
    for (let client of clients) {
      const creditoPendiente = await Credit.findOne({
        cliente: client._id,
        estado: "pendiente",
      });

      client.tieneDeuda = creditoPendiente ? true : false;
    }

    res.json(clients);
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res
      .status(500)
      .json({ message: "Error obteniendo clientes", error: error.message });
  }
};

// Crear cliente
exports.createClient = async (req, res) => {
  try {
    const { nombre, cedula, direccion, celular, cobrador } = req.body;

    let cobradorId;

    // Si es cobrador, se asigna automáticamente
    if (req.user.role === "cobrador") {
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
      cobrador: cobradorId,
    });

    await newClient.save();

    res.status(201).json({
      message: "Cliente creado correctamente",
      client: newClient,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
