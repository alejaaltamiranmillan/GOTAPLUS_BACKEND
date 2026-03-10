const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Collaborator = require("../models/Collaborator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerCobrador = async (req, res) => {
  try {
    const { nombre, cedula, celular, direccion, username, password } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: "cobrador",
      tenant: null,
    });
    await newUser.save();

    const newCollaborator = new Collaborator({
      nombre,
      cedula,
      celular,
      direccion,
      activo: true,
      user: newUser._id,
      tenant: null,
    });
    await newCollaborator.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, tenant: null },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Cuenta creada correctamente",
      token,
      user: { id: newUser._id, username: newUser.username, role: newUser.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password, codigo } = req.body;

    // Login superadmin sin código
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
        user: { id: user._id, username: user.username, role: user.role },
      });
    }

    // Login cobrador sin código de empresa
    if (codigo === "none") {
      const user = await User.findOne({ username, role: "cobrador", tenant: null });
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
        user: { id: user._id, username: user.username, role: user.role },
      });
    }

    // Login admin o cobrador con código de empresa
    const tenant = await Tenant.findOne({ codigo: codigo.toUpperCase(), activo: true });
    if (!tenant) return res.status(400).json({ message: "Código de empresa inválido o inactivo" });

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
      user: { id: user._id, username: user.username, role: user.role, tenant: tenant._id },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};