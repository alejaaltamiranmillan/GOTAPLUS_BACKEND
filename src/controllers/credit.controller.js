const Credit = require("../models/Credit");
const Client = require("../models/Client");
const Collaborator = require("../models/Collaborator");

exports.createCredit = async (req, res) => {
  try {
    const { cliente, montoPrestado, montoTotal, fechaPago } = req.body;

    // Validar campos requeridos
    if (!cliente || !montoPrestado) {
      return res.status(400).json({ 
        message: "Cliente y monto prestado son requeridos" 
      });
    }

    // Validar que el usuario tiene un tenant
    if (!req.user.tenant) {
      return res.status(400).json({ message: "Usuario sin empresa asignada" });
    }

    // Buscar cliente
    const client = await Client.findOne({
      _id: cliente,
      tenant: req.user.tenant
    });
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Verificar que no haya crédito pendiente
    const creditoPendiente = await Credit.findOne({
      cliente,
      estado: "pendiente",
      tenant: req.user.tenant
    });

    if (creditoPendiente) {
      return res.status(400).json({
        message: "El cliente ya tiene un crédito pendiente",
      });
    }

    // Calcular monto total si no se proporciona
    const totalFinal = montoTotal || montoPrestado * 1.3;

    // Crear crédito
    const newCredit = new Credit({
      montoPrestado,
      montoTotal: totalFinal,
      cliente,
      cobrador: client.cobrador,
      fechaPago: fechaPago || undefined,
      tenant: req.user.tenant
    });

    await newCredit.save();
    await newCredit.populate("cliente");
    await newCredit.populate("cobrador");

    res.status(201).json({
      message: "Crédito creado correctamente",
      credit: newCredit,
    });
  } catch (error) {
    console.error("Error en createCredit:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCredits = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const credits = await Credit.find({ tenant: req.user.tenant })
        .populate("cliente")
        .populate("cobrador")
        .sort({ createdAt: -1 });
      return res.json(credits);
    }

    const collaborator = await Collaborator.findOne({
      user: req.user.id,
      tenant: req.user.tenant
    });

    if (!collaborator) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    const credits = await Credit.find({
      cobrador: collaborator._id,
      tenant: req.user.tenant
    })
      .populate("cliente")
      .populate("cobrador")
      .sort({ createdAt: -1 });

    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCreditsByClient = async (req, res) => {
  try {
    const credits = await Credit.find({
      cliente: req.params.clienteId,
      tenant: req.user.tenant
    })
      .populate("cliente")
      .populate("cobrador");

    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.payCredit = async (req, res) => {
  try {
    const credit = await Credit.findOne({
      _id: req.params.creditId,
      tenant: req.user.tenant
    });

    if (!credit) {
      return res.status(404).json({ message: "Crédito no encontrado" });
    }

    credit.estado = "pagado";
    credit.fechaPago = new Date();

    await credit.save();
    await credit.populate("cliente");
    await credit.populate("cobrador");

    res.json({ message: "Crédito pagado correctamente", credit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCredit = async (req, res) => {
  try {
    const { estado } = req.body;
    const credit = await Credit.findOneAndUpdate(
      { _id: req.params.creditId, tenant: req.user.tenant },
      { estado, fechaPago: estado === "pagado" ? new Date() : undefined },
      { new: true }
    )
      .populate("cliente")
      .populate("cobrador");

    if (!credit) {
      return res.status(404).json({ message: "Crédito no encontrado" });
    }

    res.json({ message: "Crédito actualizado", credit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};