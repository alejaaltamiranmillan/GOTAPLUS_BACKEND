const app = require("./src/app");
const connectDB = require("./src/config/db");
const { startBotPolling, setupWebhook } = require("./src/telegram/setup");

// Pre-conectar a la base de datos en startup
connectDB().catch((err) => {
  console.error(
    "[ERROR] Failed to connect to MongoDB on startup:",
    err.message,
  );
  // No detener el servidor, dejar que intente conectar en cada request
});

// Iniciar Telegram Bot
if (process.env.NODE_ENV === "production") {
  // En producción (Vercel), usar webhook
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (webhookUrl) {
    setupWebhook(webhookUrl).catch((err) => {
      console.error("[ERROR] Failed to setup Telegram webhook:", err.message);
    });
  } else {
    console.warn(
      "[WARN] TELEGRAM_WEBHOOK_URL no configurada. Bot sin webhook.",
    );
  }
} else {
  // En desarrollo, usar polling
  startBotPolling().catch((err) => {
    console.error("[ERROR] Failed to start Telegram bot:", err.message);
  });
}

// Escuchar en puerto en desarrollo
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n✅ API Server corriendo en http://localhost:${PORT}`);
    console.log(`📱 Telegram Bot conectado y listo para recibir mensajes\n`);
  });
}

module.exports = app;
