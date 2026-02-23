const Collaborator = require('../models/Collaborator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Crear cobrador (solo admin)
exports.createCollaborator = async (req, res) => {
  try {
    const { nombre, celular, direccion, cedula, username, password } = req.body;

    // Crear usuario con rol cobrador
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: 'cobrador'
    });

    await newUser.save();

    // Crear colaborador
    const newCollaborator = new Collaborator({
      nombre,
      celular,
      direccion,
      cedula,
      user: newUser._id
    });

    await newCollaborator.save();

    res.status(201).json({
      message: "Cobrador creado correctamente",
      collaborator: newCollaborator
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
