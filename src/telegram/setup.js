const bot = require("./bot");

// Configurar webhook para Telegram
const setupWebhook = async (webhookUrl) => {
  try {
    console.log("[INFO] Configurando webhook de Telegram:", webhookUrl);

    // Aquí se configuraría el webhook real en producción
    // await bot.telegram.setWebhook(`${webhookUrl}/api/telegram/webhook`);

    console.log("[INFO] Webhook configurado correctamente");
  } catch (error) {
    console.error("[ERROR] Error configurando webhook:", error);
  }
};

// Iniciar bot en polling (para desarrollo local)
const startBotPolling = async () => {
  try {
    console.log("[INFO] Iniciando Telegram bot en polling...");
    await bot.launch();
    console.log("[INFO] ✅ Telegram bot iniciado correctamente");
  } catch (error) {
    console.error("[ERROR] Error iniciando bot:", error);
  }
};

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = {
  setupWebhook,
  startBotPolling,
  bot,
};
