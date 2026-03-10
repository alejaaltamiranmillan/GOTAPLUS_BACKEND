const User = require("../models/User");
const Tenant = require("../models/Tenant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { username, password, codigo } = req.body;

    // Si es superadmin no necesita código
    if (!codigo) {
      const user = await User.findOne({ username, role: "superadmin" });
      if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

      const token = jwt.sign(
        { id: user._id, role: user.role, tenant: null },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login exitoso",
        token,
        user: { id: user._id, username: user.username, role: user.role }
      });
    }

    // Verificar tenant
    const tenant = await Tenant.findOne({ codigo: codigo.toUpperCase(), activo: true });
    if (!tenant) return res.status(400).json({ message: "Código de empresa inválido o inactivo" });

    // Buscar usuario dentro del tenant
    const user = await User.findOne({ username, tenant: tenant._id });
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user._id, role: user.role, tenant: tenant._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: { id: user._id, username: user.username, role: user.role, tenant: tenant._id }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
  res.status(403).json({ message: "Registro no permitido directamente" });
};