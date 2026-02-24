const express = require("express");
const router = express.Router();
const Client = require("../models/Client");
const Credit = require("../models/Credit");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/resumen", authMiddleware, async (req, res) => {
  try {
    const cobradorId = req.user.id;

    // Total clientes
    const totalClientes = await Client.countDocuments({
      cobrador: cobradorId
    });

    // Créditos pendientes del cobrador
    const creditosPendientes = await Credit.find({
      cobrador: cobradorId,
      estado: "pendiente"
    });

    let totalPrestado = 0;
    let totalGanancia = 0;

    creditosPendientes.forEach(c => {
      totalPrestado += c.montoPrestado;
      totalGanancia += c.montoTotal - c.montoPrestado;
    });

    // Clientes con deuda (distintos)
    const clientesConDeuda = new Set(
      creditosPendientes.map(c => c.cliente.toString())
    ).size;

    res.json({
      totalClientes,
      clientesConDeuda,
      totalPrestado,
      totalGanancia
    });

  } catch (error) {
    res.status(500).json({ message: "Error generando resumen" });
  }
});

module.exports = router;