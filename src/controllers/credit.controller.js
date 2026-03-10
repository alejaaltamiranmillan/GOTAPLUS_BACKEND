const Credit = require("../models/Credit");
const Client = require("../models/Client");
const Collaborator = require("../models/Collaborator");

// Crear crédito
exports.createCredit = async (req, res) => {
  try {
    const { cliente, montoPrestado, montoTotal, fechaPago } = req.body;

    const client = await Client.findById(cliente);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const creditoPendiente = await Credit.findOne({