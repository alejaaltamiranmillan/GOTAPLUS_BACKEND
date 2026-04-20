const express = require("express");
const bot = require("../telegram/bot");
const Client = require("../models/Client");
const Credit = require("../models/Credit");
const Tenant = require("../models/Tenant");

const router = express.Router();

// Webhook para Telegram
router.post("/webhook", async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
    res.status(200).send("OK");
  } catch (error) {
    console.error("[ERROR] Error en webhook de Telegram:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check del bot
router.get("/health", (req, res) => {
  res.json({ status: "Telegram bot is running" });
});

// ==================== ENDPOINTS ESPECIALES PARA BOT ====================

// Crear cliente desde Telegram (sin autenticación JWT)
router.post("/create-client", async (req, res) => {
  try {
    const { nombre, cedula, celular, direccion } = req.body;

    // Validar datos
    if (!nombre || !cedula || !celular || !direccion) {
      return res.status(400).json({
        error: "Faltan campos: nombre, cedula, celular, direccion",
      });
    }

    // Obtener el primer tenant (para desarrollo)
    let tenant = await Tenant.findOne();
    if (!tenant) {
      return res.status(400).json({ error: "No hay tenant configurado" });
    }

    // Obtener el primer cobrador del tenant
    const Collaborator = require("../models/Collaborator");
    let cobrador = await Collaborator.findOne({ tenant: tenant._id });
    if (!cobrador) {
      return res.status(400).json({
        error: "No hay cobrador configurado en el tenant",
      });
    }

    // Crear cliente
    const nuevoCliente = new Client({
      nombre,
      cedula,
      celular,
      direccion,
      cobrador: cobrador._id,
      tenant: tenant._id,
    });

    await nuevoCliente.save();

    res.json({
      success: true,
      message: "Cliente creado exitosamente",
      cliente: nuevoCliente,
    });
  } catch (error) {
    console.error("[ERROR] Error creando cliente:", error);
    res.status(500).json({ error: error.message });
  }
});

// Crear crédito desde Telegram
router.post("/create-credit", async (req, res) => {
  try {
    const { cedula_cliente, montoPrestado, fechaPago } = req.body;

    if (!cedula_cliente || !montoPrestado || !fechaPago) {
      return res.status(400).json({
        error: "Faltan campos: cedula_cliente, montoPrestado, fechaPago",
      });
    }

    // Obtener tenant
    let tenant = await Tenant.findOne();
    if (!tenant) {
      return res.status(400).json({ error: "No hay tenant configurado" });
    }

    // Buscar cliente por cédula
    const cliente = await Client.findOne({
      cedula: cedula_cliente,
      tenant: tenant._id,
    });

    if (!cliente) {
      return res.status(404).json({
        error: `Cliente con cédula ${cedula_cliente} no encontrado`,
      });
    }

    // Calcular monto total (30% extra)
    const montoTotal = montoPrestado * 1.3;

    // Crear crédito
    const nuevoCredito = new Credit({
      cliente: cliente._id,
      montoPrestado,
      montoTotal,
      fechaPago,
      cobrador: cliente.cobrador,
      tenant: tenant._id,
      estado: "pendiente",
    });

    await nuevoCredito.save();

    res.json({
      success: true,
      message: "Crédito creado exitosamente",
      credito: nuevoCredito,
    });
  } catch (error) {
    console.error("[ERROR] Error creando crédito:", error);
    res.status(500).json({ error: error.message });
  }
});

// Consultar cliente por cédula
router.get("/client/:cedula", async (req, res) => {
  try {
    const { cedula } = req.params;

    // Obtener tenant
    let tenant = await Tenant.findOne();
    if (!tenant) {
      return res.status(400).json({ error: "No hay tenant configurado" });
    }

    // Buscar cliente
    const cliente = await Client.findOne({
      cedula,
      tenant: tenant._id,
    }).populate("cobrador", "nombre cedula");

    if (!cliente) {
      return res.status(404).json({
        error: `Cliente con cédula ${cedula} no encontrado`,
      });
    }

    // Obtener créditos del cliente
    const creditos = await Credit.find({
      cliente: cliente._id,
      tenant: tenant._id,
    });

    res.json({
      cliente,
      creditos,
    });
  } catch (error) {
    console.error("[ERROR] Error consultando cliente:", error);
    res.status(500).json({ error: error.message });
  }
});

// Registrar pago (marcar crédito como pagado)
router.put("/pay-credit/:creditoId", async (req, res) => {
  try {
    const { creditoId } = req.params;

    const credito = await Credit.findByIdAndUpdate(
      creditoId,
      { estado: "pagado", fechaPago: new Date() },
      { new: true },
    );

    if (!credito) {
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    res.json({
      success: true,
      message: "Pago registrado exitosamente",
      credito,
    });
  } catch (error) {
    console.error("[ERROR] Error registrando pago:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
