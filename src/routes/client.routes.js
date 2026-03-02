const express = require("express");
const router = express.Router();
const clientController = require("../controllers/client.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Obtener todos los clientes del cobrador autenticado
router.get("/", verifyToken, clientController.getAllClients);

// Crear cliente (admin o cobrador)
router.post("/", verifyToken, clientController.createClient);

module.exports = router;
