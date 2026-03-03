const Credit = require("../models/Credit");
const Client = require("../models/Client");
const Collaborator = require("../models/Collaborator");

// Crear crédito
exports.createCredit = async (req, res) => {
  try {
    const { cliente, montoPrestado, montoTotal, fechaPago } = req.body;

    // Verificar si cliente existe
    const client = await Client.findById(cliente);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Verificar si tiene crédito pendiente
    const creditoPendiente = await Credit.findOne({
      cliente,
      estado: "pendiente",
    });

    if (creditoPendiente) {
      return res.status(400).json({
        message: "El cliente ya tiene un crédito pendiente",
      });
    }

    // Usar montoTotal proporcionado o calcular 30%
    const totalFinal = montoTotal || montoPrestado * 1.3;

    // Crear crédito
    const newCredit = new Credit({
      montoPrestado,
      montoTotal: totalFinal,
      cliente,
      cobrador: client.cobrador,
      fechaPago: fechaPago || undefined,
    });

    await newCredit.save();

    // Poblar antes de enviar
    await newCredit.populate("cliente");
    await newCredit.populate("cobrador");

    res.status(201).json({
      message: "Crédito creado correctamente",
      credit: newCredit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los créditos del cobrador autenticado o todos si es admin
exports.getAllCredits = async (req, res) => {
  try {
    const Collaborator = require("../models/Collaborator");
    const User = require("../models/User");

    // Obtener el role del usuario autenticado
    const user = await User.findById(req.user.id);

    let credits;

    if (user.role === "admin") {
      // Si es admin, obtener todos los créditos
      credits = await Credit.find()
        .populate("cliente")
        .populate("cobrador")
        .sort({ createdAt: -1 });
    } else {
      // Si es cobrador, obtener solo sus créditos
      const collaborator = await Collaborator.findOne({ user: req.user.id });

      if (!collaborator) {
        return res.status(404).json({ message: "Colaborador no encontrado" });
      }

      credits = await Credit.find({
        cobrador: collaborator._id,
      })
        .populate("cliente")
        .populate("cobrador")
        .sort({ createdAt: -1 });
    }

    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener créditos por cliente
exports.getCreditsByClient = async (req, res) => {
  try {
    const credits = await Credit.find({
      cliente: req.params.clienteId,
    })
      .populate("cliente")
      .populate("cobrador");

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

// Actualizar crédito (para cambiar estado)
exports.updateCredit = async (req, res) => {
  try {
    const { estado } = req.body;
    const credit = await Credit.findByIdAndUpdate(
      req.params.creditId,
      { estado, fechaPago: estado === "pagado" ? new Date() : undefined },
      { new: true },
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
