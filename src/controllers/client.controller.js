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
      tenant: req.user.tenant
    });

    if (!collaborator) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    const clients = await Client.find({
      cobrador: collaborator._id,
      tenant: req.user.tenant
    }).lean();

    for (let client of clients) {
      const creditoPendiente = await Credit.findOne({
        cliente: client._id,
        estado: "pendiente",
        tenant: req.user.tenant
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

    let cobradorId;

    if (req.user.role === "cobrador") {
      const collaborator = await Collaborator.findOne({
        user: req.user.id,
        tenant: req.user.tenant
      });

      if (!collaborator) {
        return res.status(400).json({ message: "Cobrador no encontrado" });
      }

      cobradorId = collaborator._id;
    } else {
      cobradorId = cobrador;
    }

    const newClient = new Client({
      nombre,
      cedula,
      direccion,
      celular,
      cobrador: cobradorId,
      tenant: req.user.tenant
    });

    await newClient.save();
    await newClient.populate("cobrador");

    res.status(201).json({
      message: "Cliente creado correctamente",
      client: newClient,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};