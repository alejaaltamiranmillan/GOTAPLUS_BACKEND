const express = require("express");
const bot = require("../telegram/bot");

const router = express.Router();

// Webhook para Telegram
router.post("/webhook", async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
    res.status(200).send("OK");
  } catch (error) {
    console.error("[ERROR] Error en webhook de Telegram:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check del bot
router.get("/health", (req, res) => {
  res.json({ status: "Telegram bot is running" });
});

module.exports = router;
