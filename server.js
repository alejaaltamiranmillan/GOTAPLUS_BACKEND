const app = require("./src/app");
const connectDB = require("./src/config/db");

// Pre-conectar a la base de datos en startup
connectDB().catch((err) => {
  console.error(
    "[ERROR] Failed to connect to MongoDB on startup:",
    err.message,
  );
  // No detener el servidor, dejar que intente conectar en cada request
});

module.exports = app;
