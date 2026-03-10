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
      tenant: null
    });
    await newUser.save();

    const Collaborator = require("../models/Collaborator");
    const newCollaborator = new Collaborator({
      nombre,
      cedula,
      celular,
      direccion,
      activo: true,
      user: newUser._id,
      tenant: null
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
      user: { id: newUser._id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};