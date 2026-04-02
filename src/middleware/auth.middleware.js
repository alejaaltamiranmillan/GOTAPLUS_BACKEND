const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.error("ERROR: Token no proporcionado");
      return res.status(401).json({ message: "Token requerido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DEBUG: Token decodificado:", decoded);
    req.user = decoded;
    return next();

  } catch (error) {
    console.error("ERROR en verifyToken:", error.message);
    return res.status(401).json({ message: "Token inválido", error: error.message });
  }
};

exports.verifyAdmin = (req, res, next) => {
  if (!req.user) {
    console.error("ERROR: req.user no existe en verifyAdmin");
    return res.status(401).json({ message: "Usuario no autenticado" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Acceso solo para admin" });
  }
  return next();
};

exports.verifySuperAdmin = (req, res, next) => {
  if (!req.user) {
    console.error("ERROR: req.user no existe en verifySuperAdmin");
    return res.status(401).json({ message: "Usuario no autenticado" });
  }
  
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: "Acceso solo para superadmin" });
  }
  return next();
};