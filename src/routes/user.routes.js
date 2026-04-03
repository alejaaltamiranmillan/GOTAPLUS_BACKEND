const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  verifyToken,
  verifySuperAdmin,
} = require("../middleware/auth.middleware");

// Auth endpoints - Separados por tipo de usuario
router.post("/login/admin", userController.loginAdmin);
router.post("/login/cobrador", userController.loginCobrador);

// Legacy endpoint (mantener para compatibilidad)
router.post("/login", userController.login);

// Register
router.post("/register/cobrador", userController.registerCobrador);

// Admin creation
router.post(
  "/create-admin",
  verifyToken,
  verifySuperAdmin,
  userController.createAdmin,
);

module.exports = router;
