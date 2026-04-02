const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  verifyToken,
  verifySuperAdmin,
} = require("../middleware/auth.middleware");

router.post("/login", userController.login);
router.post("/register/cobrador", userController.registerCobrador);
router.post(
  "/create-admin",
  verifyToken,
  verifySuperAdmin,
  userController.createAdmin,
);

module.exports = router;
