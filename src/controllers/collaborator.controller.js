const Collaborator = require("../models/Collaborator");
const User = require("../models/User");
const Client = require("../models/Client");
const Credit = require("../models/Credit");
const bcrypt = require("bcryptjs");

// Obtener todos los cobradores
exports.getAllCollaborators = async (req, res) => {
  try {
    const collaborators = await Collaborator.find()
      .populate("user", "username role")
      .sort({ createdAt: -1 });

    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener cobrador con sus clientes y créditos
exports.getCollaboratorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const collaborator = await Collaborator.findById(id).populate(
      "user",
      "username role",
    );

    if (!collaborator) {
      return res.status(404).json({ message: "Cobrador no encontrado" });
    }

    const clients = await Client.find({ cobrador: id });
    const credits = await Credit.find({ cobrador: id })
      .populate("cliente")
      .sort({ createdAt: -1 });

    res.json({
      collaborator,
      clients,
      credits,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear cobrador (solo admin)
exports.createCollaborator = async (req, res) => {
  try {
    const { nombre, celular, direccion, cedula, username, password } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Crear usuario con rol cobrador
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: "cobrador",
    });

    await newUser.save();

    // Crear colaborador
    const newCollaborator = new Collaborator({
      nombre,
      celular,
      direccion,
      cedula,
      activo: true,
      user: newUser._id,
    });

    await newCollaborator.save();

    res.status(201).json({
      message: "Cobrador creado correctamente",
      collaborator: newCollaborator,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Habilitar/Deshabilitar cobrador
exports.toggleCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const collaborator = await Collaborator.findByIdAndUpdate(
      id,
      { activo },
      { new: true },
    ).populate("user", "username role");

    if (!collaborator) {
      return res.status(404).json({ message: "Cobrador no encontrado" });
    }

    res.json({
      message: collaborator.activo
        ? "Cobrador habilitado"
        : "Cobrador deshabilitado",
      collaborator,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
