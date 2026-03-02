const express = require("express");
const router = express.Router();
const collaboratorController = require("../controllers/collaborator.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware");

// Obtener todos los cobradores
router.get(
  "/",
  verifyToken,
  verifyAdmin,
  collaboratorController.getAllCollaborators,
);

// Obtener detalles de un cobrador con sus clientes y créditos
router.get(
  "/:id",
  verifyToken,
  verifyAdmin,
  collaboratorController.getCollaboratorDetails,
);

// Crear cobrador
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  collaboratorController.createCollaborator,
);

// Habilitar/Deshabilitar cobrador
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  collaboratorController.toggleCollaborator,
);

module.exports = router;
