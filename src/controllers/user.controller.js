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
      { expiresIn: "1d" },
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

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password, codigo } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({
        message: "Usuario y contraseña son requeridos",
      });
    }

    // SUPERADMIN: login sin código
    if (!codigo) {
      const user = await User.findOne({ username, role: "superadmin" });
      if (!user) {
        return res.status(400).json({ message: "Usuario no encontrado" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Contraseña incorrecta" });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, tenant: null },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      return res.json({
        message: "Login exitoso",
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      });
    }

    // ADMIN: login con código de empresa
    const tenant = await Tenant.findOne({
      codigo: codigo.toUpperCase(),
      activo: true,
    });
    if (!tenant) {
      return res.status(400).json({
        message: "Código de empresa inválido o inactivo",
      });
    }

    const user = await User.findOne({
      username,
      tenant: tenant._id,
      role: "admin",
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Usuario no encontrado en esta empresa" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, tenant: tenant._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: tenant._id,
        empresa: tenant.nombre,
      },
    });
  } catch (error) {
    console.error("Error en loginAdmin:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.loginCobrador = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({
        message: "Usuario y contraseña son requeridos",
      });
    }

    // Buscar cobrador sin tenant
    let user = await User.findOne({
      username,
      role: "cobrador",
      tenant: null,
    });

    // Si no existe sin tenant, busca en cualquier tenant (cobrador creado por admin)
    if (!user) {
      user = await User.findOne({
        username,
        role: "cobrador",
      });
    }

    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    // Obtener datos del tenant si existe
    let empresaNombre = null;
    if (user.tenant) {
      const tenant = await Tenant.findById(user.tenant);
      empresaNombre = tenant?.nombre;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, tenant: user.tenant },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: user.tenant,
        empresa: empresaNombre,
      },
    });
  } catch (error) {
    console.error("Error en loginCobrador:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password, codigo } = req.body;

    // Login superadmin sin código
    if (!codigo) {
      const user = await User.findOne({ username, role: "superadmin" });
      if (!user)
        return res.status(400).json({ message: "Usuario no encontrado" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Contraseña incorrecta" });

      const token = jwt.sign(
        { id: user._id, role: user.role, tenant: null },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      return res.json({
        message: "Login exitoso",
        token,
        user: { id: user._id, username: user.username, role: user.role },
      });
    }

    // Login cobrador sin código de empresa (busca automáticamente su tenant)
    if (codigo === "none") {
      // Primero busca cobrador sin tenant
      let user = await User.findOne({
        username,
        role: "cobrador",
        tenant: null,
      });

      // Si no existe, busca en cualquier tenant (para cobradores creados por admin)
      if (!user) {
        user = await User.findOne({ username, role: "cobrador" });
      }

      if (!user)
        return res.status(400).json({ message: "Usuario no encontrado" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Contraseña incorrecta" });

      const token = jwt.sign(
        { id: user._id, role: user.role, tenant: user.tenant },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      return res.json({
        message: "Login exitoso",
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          tenant: user.tenant,
        },
      });
    }

    // Login admin o cobrador con código de empresa
    const tenant = await Tenant.findOne({
      codigo: codigo.toUpperCase(),
      activo: true,
    });
    if (!tenant)
      return res
        .status(400)
        .json({ message: "Código de empresa inválido o inactivo" });

    const user = await User.findOne({ username, tenant: tenant._id });
    if (!user)
      return res.status(400).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user._id, role: user.role, tenant: tenant._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: tenant._id,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear admin para un tenant
exports.createAdmin = async (req, res) => {
  try {
    const { tenantCode, username, password } = req.body;

    if (!tenantCode || !username || !password) {
      return res.status(400).json({
        message: "Código de empresa, usuario y contraseña son requeridos",
      });
    }

    // Buscar el tenant
    const tenant = await Tenant.findOne({
      codigo: tenantCode.toUpperCase(),
      activo: true,
    });
    if (!tenant) {
      return res
        .status(400)
        .json({ message: "Empresa no encontrada o inactiva" });
    }

    // Verificar que el username no exista en ese tenant
    const userExists = await User.findOne({
      username: username,
      tenant: tenant._id,
    });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "El usuario ya existe en esta empresa" });
    }

    // Crear admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      username,
      password: hashedPassword,
      role: "admin",
      tenant: tenant._id,
    });
    await newAdmin.save();

    res.status(201).json({
      message: "Admin creado exitosamente",
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        role: newAdmin.role,
        empresa: tenant.nombre,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
