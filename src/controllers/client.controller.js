const Client = require("../models/Client");
const Collaborator = require("../models/Collaborator");

exports.getAllClientsAdmin = async (req, res) => {
  try {
    const clients = await Client.find({ tenant: req.user.tenant })
      .populate("cobrador")
      .sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const Credit = require("../models/Credit");

    const collaborator = await Collaborator.findOne({
      user: req.user.id,
      tenant: req.user.tenant,
    });

    if (!collaborator) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    const clients = await Client.find({
      cobrador: collaborator._id,
      tenant: req.user.tenant,
    }).lean();

    for (let client of clients) {
      const creditoPendiente = await Credit.findOne({
        cliente: client._id,
        estado: "pendiente",
        tenant: req.user.tenant,
      });
      client.tieneDeuda = creditoPendiente ? true : false;
    }

    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { nombre, cedula, direccion, celular, cobrador } = req.body;

    // Validar que todos los campos requeridos existan
    if (!nombre || !cedula || !direccion || !celular) {
      return res.status(400).json({
        message: "Nombre, cédula, dirección y celular son requeridos",
      });
    }

    // Validar que el usuario tiene un tenant
    if (!req.user.tenant) {
      return res.status(400).json({ message: "Usuario sin empresa asignada" });
    }

    let cobradorId;

    if (req.user.role === "cobrador") {
      // Si es cobrador, obtiene su propio ID de colaborador
      const collaborator = await Collaborator.findOne({
        user: req.user.id,
        tenant: req.user.tenant,
      });

      if (!collaborator) {
        return res.status(400).json({ message: "Cobrador no encontrado" });
      }

      cobradorId = collaborator._id;
    } else {
      // Si es admin, usa el cobrador enviado en el request
      if (!cobrador) {
        return res.status(400).json({ message: "Cobrador requerido" });
      }
      cobradorId = cobrador;
    }

    // Validar que el cobrador existe y pertenece a este tenant
    const cobradorExists = await Collaborator.findOne({
      _id: cobradorId,
      tenant: req.user.tenant,
    });

    if (!cobradorExists) {
      return res
        .status(404)
        .json({ message: "Cobrador no encontrado en esta empresa" });
    }

    // Validar que la cédula no exista en este tenant
    const clienteExists = await Client.findOne({
      cedula: cedula,
      tenant: req.user.tenant,
    });

    if (clienteExists) {
      return res
        .status(400)
        .json({ message: "Cliente con esta cédula ya existe" });
    }

    // Crear el cliente
    const newClient = new Client({
      nombre,
      cedula,
      direccion,
      celular,
      cobrador: cobradorId,
      tenant: req.user.tenant,
    });

    await newClient.save();
    await newClient.populate("cobrador");

    res.status(201).json({
      message: "Cliente creado correctamente",
      client: newClient,
    });
  } catch (error) {
    console.error("Error en createClient:", error);
    res.status(500).json({ error: error.message });
  }
};
