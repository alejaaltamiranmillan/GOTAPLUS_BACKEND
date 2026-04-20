const app = require("./src/app");
const connectDB = require("./src/config/db");
const { startBotPolling } = require("./src/telegram/setup");

// Pre-conectar a la base de datos en startup
connectDB().catch((err) => {
  console.error(
    "[ERROR] Failed to connect to MongoDB on startup:",
    err.message,
  );
  // No detener el servidor, dejar que intente conectar en cada request
});

// Iniciar Telegram Bot
if (process.env.NODE_ENV !== "production") {
  // En desarrollo, usar polling
  startBotPolling().catch((err) => {
    console.error("[ERROR] Failed to start Telegram bot:", err.message);
  });
}

module.exports = app;
