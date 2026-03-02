const express = require("express");
const router = express.Router();
const creditController = require("../controllers/credit.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Obtener todos los créditos del cobrador
router.get("/", verifyToken, creditController.getAllCredits);

// Crear crédito
router.post("/", verifyToken, creditController.createCredit);

// Obtener créditos de un cliente
router.get(
  "/cliente/:clienteId",
  verifyToken,
  creditController.getCreditsByClient,
);

// Actualizar crédito (cambiar estado)
router.put("/:creditId", verifyToken, creditController.updateCredit);

// Marcar crédito como pagado (ruta alternativa)
router.put("/pagar/:creditId", verifyToken, creditController.payCredit);

module.exports = router;
