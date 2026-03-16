const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Tenant = require("../models/Tenant");

/**
 * POST /api/init/create-admin
 * Endpoint para crear usuarios iniciales (SuperAdmin + Admin)
 * Solo funciona si no existen usuarios aún
 */
router.post("/create-admin", async (req, res) => {
  try {
    // Verificar si ya existe un superadmin
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });

    if (existingSuperAdmin) {
      return res.status(400).json({
        message: "Ya existen usuarios en el sistema",
        superadmin: existingSuperAdmin.username,
      });
    }

    // Crear SuperAdmin
    const hashedPasswordSuperAdmin = await bcrypt.hash("admin123", 10);
    const superAdmin = new User({
      username: "superadmin",
      password: hashedPasswordSuperAdmin,
      role: "superadmin",
      tenant: null,
    });
    await superAdmin.save();

    // Crear Tenant
    let tenant = await Tenant.findOne({ codigo: "DEMO001" });
    if (!tenant) {
      tenant = new Tenant({
        nombre: "GotaPlus Demo",
        codigo: "DEMO001",
        activo: true,
      });
      await tenant.save();
    }

    // Crear Admin
    const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);
    const admin = new User({
      username: "admin_demo",
      password: hashedPasswordAdmin,
      role: "admin",
      tenant: tenant._id,
    });
    await admin.save();

    res.status(201).json({
      message: "Usuarios creados exitosamente",
      superadmin: {
        username: "superadmin",
        password: "admin123",
      },
      admin: {
        username: "admin_demo",
        password: "admin123",
        empresa: "DEMO001",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
