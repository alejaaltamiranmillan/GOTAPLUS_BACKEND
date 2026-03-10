const Collaborator = require("../models/Collaborator");
const User = require("../models/User");
const Client = require("../models/Client");
const Credit = require("../models/Credit");
const bcrypt = require("bcryptjs");

exports.getAllCollaborators = async (req, res) => {
  try {
    const collaborators = await Collaborator.find({ tenant: req.user.tenant })
      .populate("user", "username role")
      .sort({ createdAt: -1 });

    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCollaboratorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const collaborator = await Collaborator.findOne({
      _id: id,
      tenant: req.user.tenant
    }).populate("user", "username role");

    if (!collaborator) {
      return res.status(404).json({ message: "Cobrador no encontrado" });
    }

    const clients = await Client.find({ cobrador: id, tenant: req.user.tenant });
    const credits = await Credit.find({ cobrador: id, tenant: req.user.tenant })
      .populate("cliente")
      .sort({ createdAt: -1 });

    res.json({ collaborator, clients, credits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCollaborator = async (req, res) => {
  try {
    const { nombre, celular, direccion, cedula, username, password } = req.body;

    const userExists = await User.findOne({ username, tenant: req.user.tenant });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: "cobrador",
      tenant: req.user.tenant
    });
    await newUser.save();

    const newCollaborator = new Collaborator({
      nombre,
      celular,
      direccion,
      cedula,
      activo: true,
      user: newUser._id,
      tenant: req.user.tenant
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

exports.toggleCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const collaborator = await Collaborator.findOneAndUpdate(
      { _id: id, tenant: req.user.tenant },
      { activo },
      { new: true }
    ).populate("user", "username role");

    if (!collaborator) {
      return res.status(404).json({ message: "Cobrador no encontrado" });
    }

    res.json({
      message: collaborator.activo ? "Cobrador habilitado" : "Cobrador deshabilitado",
      collaborator,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};