const express = require("express");
const router = express.Router();
const Credit = require("../models/Credit");
const Client = require("../models/Client");
const authMiddleware = require("../middlewares/authMiddleware");

/* ==============================
   CREAR CRÉDITO
============================== */

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { cliente, montoPrestado, montoTotal } = req.body;

    // Verificar que no tenga crédito pendiente
    const creditoPendiente = await Credit.findOne({
      cliente,
      estado: "pendiente"
    });

    if (creditoPendiente) {
      return res.status(400).json({
        message: "El cliente ya tiene un crédito pendiente"
      });
    }

    const nuevoCredito = new Credit({
      cliente,
      cobrador: req.user.id,
      montoPrestado,
      montoTotal,
      fechaPrestamo: new Date(),
      estado: "pendiente"
    });

    await nuevoCredito.save();

    res.json({
      message: "Crédito creado correctamente",
      credito: nuevoCredito
    });

  } catch (error) {
    res.status(500).json({ message: "Error creando crédito" });
  }
});

/* ==============================
   CONSULTAR CRÉDITOS DE CLIENTE
============================== */

router.get("/cliente/:id", authMiddleware, async (req, res) => {
  try {
    const creditos = await Credit.find({
      cliente: req.params.id
    }).sort({ createdAt: -1 });

    res.json(creditos);

  } catch (error) {
    res.status(500).json({ message: "Error obteniendo créditos" });
  }
});

/* ==============================
   MARCAR COMO PAGADO
============================== */

router.put("/pagar/:id", authMiddleware, async (req, res) => {
  try {
    await Credit.findByIdAndUpdate(req.params.id, {
      estado: "pagado",
      fechaPago: new Date()
    });

    res.json({ message: "Crédito marcado como pagado" });

  } catch (error) {
    res.status(500).json({ message: "Error actualizando crédito" });
  }
});

module.exports = router;