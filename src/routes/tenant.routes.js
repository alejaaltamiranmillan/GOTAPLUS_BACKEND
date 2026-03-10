const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenant.controller");
const { verifyToken, verifySuperAdmin } = require("../middleware/auth.middleware");

router.get("/", verifyToken, verifySuperAdmin, tenantController.getAllTenants);
router.post("/", verifyToken, verifySuperAdmin, tenantController.createTenant);
router.put("/:id", verifyToken, verifySuperAdmin, tenantController.toggleTenant);

module.exports = router;