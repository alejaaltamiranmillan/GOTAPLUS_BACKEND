const Tenant = require("../models/Tenant");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Obtener todos los tenants
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear tenant
exports.createTenant = async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      return res
        .status(400)
        .json({ message: "Nombre y código son requeridos" });
    }

    // Verificar que el código no exista
    const tenantExists = await Tenant.findOne({ codigo: codigo.toUpperCase() });
    if (tenantExists) {
      return res
        .status(400)
        .json({ message: "El código de empresa ya existe" });
    }

    // Crear tenant
    const newTenant = new Tenant({ nombre, codigo });
    await newTenant.save();

    res.status(201).json({
      message: "Empresa creada correctamente",
      tenant: newTenant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Habilitar/Deshabilitar tenant
exports.toggleTenant = async (req, res) => {
  try {
    const { activo } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { activo },
      { new: true },
    );

    if (!tenant) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    res.json({
      message: tenant.activo ? "Empresa habilitada" : "Empresa deshabilitada",
      tenant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
