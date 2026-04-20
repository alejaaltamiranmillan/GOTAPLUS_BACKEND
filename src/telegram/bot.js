const { Telegraf } = require("telegraf");
const axios = require("axios");
const {
  crearClienteFlow,
  crearCreditoFlow,
  consultarClienteFlow,
  registrarPagoFlow,
  handleMessage,
  userState,
} = require("./handlers");
const { mainKeyboard, backKeyboard } = require("./keyboards");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);
const API_URL = process.env.API_URL || "http://localhost:5000";

// ==================== COMANDO START ====================
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || "Usuario";

  const welcomeMessage = `
👋 ¡Hola ${firstName}!

Bienvenido a *GotaPlus Bot* 🤖

Aquí puedes:
• 📋 Crear clientes
• 💳 Crear créditos  
• 🔍 Consultar información
• 💰 Registrar pagos

¿Qué deseas hacer?
  `;

  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    ...mainKeyboard,
  });
});

// ==================== ACCIONES DE BOTONES ====================

// Menú Principal
bot.action("menu_principal", async (ctx) => {
  await ctx.editMessageText("📌 *Menú Principal*\n\n¿Qué deseas hacer?", {
    parse_mode: "Markdown",
    ...mainKeyboard,
  });
  delete userState[ctx.from.id];
});

// Crear Cliente
bot.action("crear_cliente", async (ctx) => {
  await ctx.editMessageText("Iniciando flujo de creación de cliente...");
  await crearClienteFlow(ctx);
});

// Crear Crédito
bot.action("crear_credito", async (ctx) => {
  await ctx.editMessageText("Iniciando flujo de creación de crédito...");
  await crearCreditoFlow(ctx);
});

// Consultar Cliente
bot.action("consultar_cliente", async (ctx) => {
  await ctx.editMessageText("Iniciando consulta de cliente...");
  await consultarClienteFlow(ctx);
});

// Registrar Pago
bot.action("registrar_pago", async (ctx) => {
  await ctx.editMessageText("Iniciando registro de pago...");
  await registrarPagoFlow(ctx);
});

// Confirmación de Crear Cliente
bot.action("confirmar_crear_cliente_final", async (ctx) => {
  const state = userState[ctx.from.id];
  if (!state) {
    await ctx.reply("❌ Sesión expirada. Intenta de nuevo.", mainKeyboard);
    return;
  }

  try {
    // Llamar a la API para crear cliente
    const response = await axios.post(`${API_URL}/api/telegram/create-client`, {
      nombre: state.nombre,
      cedula: state.cedula,
      celular: state.celular,
      direccion: state.direccion,
    });

    if (response.data.success) {
      await ctx.editMessageText(
        "✅ *Cliente creado exitosamente!*\n\n" +
          `📋 ${state.nombre} ha sido registrado en MongoDB.\n\n` +
          "¿Qué deseas hacer ahora?",
        { parse_mode: "Markdown", ...mainKeyboard },
      );
    } else {
      throw new Error(response.data.error || "Error al crear cliente");
    }

    delete userState[ctx.from.id];
  } catch (error) {
    console.error("[ERROR] Error creando cliente:", error.message);
    await ctx.editMessageText(
      "❌ Error: " + (error.response?.data?.error || error.message),
      { parse_mode: "Markdown", ...mainKeyboard },
    );
    delete userState[ctx.from.id];
  }
});

// Confirmación de Crear Crédito
bot.action("confirmar_crear_credito_final", async (ctx) => {
  const state = userState[ctx.from.id];
  if (!state) {
    await ctx.reply("❌ Sesión expirada. Intenta de nuevo.", mainKeyboard);
    return;
  }

  try {
    // Llamar a la API para crear crédito
    const response = await axios.post(`${API_URL}/api/telegram/create-credit`, {
      cedula_cliente: state.cedula_cliente,
      montoPrestado: state.monto,
      fechaPago: state.fechaPago,
    });

    if (response.data.success) {
      await ctx.editMessageText(
        "✅ *Crédito creado exitosamente!*\n\n" +
          `💳 Monto Prestado: $${state.monto.toLocaleString()}\n` +
          `💵 Monto Total (30%): $${state.montoTotal.toLocaleString()}\n` +
          `📅 Fecha Pago: ${state.fechaPago}\n\n` +
          "¿Qué deseas hacer ahora?",
        { parse_mode: "Markdown", ...mainKeyboard },
      );
    } else {
      throw new Error(response.data.error || "Error al crear crédito");
    }

    delete userState[ctx.from.id];
  } catch (error) {
    console.error("[ERROR] Error creando crédito:", error.message);
    await ctx.editMessageText(
      "❌ Error: " + (error.response?.data?.error || error.message),
      { parse_mode: "Markdown", ...mainKeyboard },
    );
    delete userState[ctx.from.id];
  }
});

// Confirmación de Registrar Pago
bot.action("confirmar_registrar_pago_final", async (ctx) => {
  const state = userState[ctx.from.id];
  if (!state) {
    await ctx.reply("❌ Sesión expirada. Intenta de nuevo.", mainKeyboard);
    return;
  }

  try {
    // Llamar a la API para registrar pago
    const response = await axios.put(
      `${API_URL}/api/telegram/pay-credit/${state.creditoId}`,
      {},
    );

    if (response.data.success) {
      await ctx.editMessageText(
        "✅ *¡Pago Registrado Exitosamente!*\n\n" +
          `👤 Cliente: ${state.cliente_nombre}\n` +
          `💳 Monto Pagado: $${state.monto_pago.toLocaleString()}\n` +
          `📅 Fecha: ${new Date().toLocaleDateString()}\n\n` +
          "¿Qué deseas hacer ahora?",
        { parse_mode: "Markdown", ...mainKeyboard },
      );
    } else {
      throw new Error(response.data.error || "Error al registrar pago");
    }

    delete userState[ctx.from.id];
  } catch (error) {
    console.error("[ERROR] Error registrando pago:", error.message);
    await ctx.editMessageText(
      "❌ Error: " + (error.response?.data?.error || error.message),
      { parse_mode: "Markdown", ...mainKeyboard },
    );
    delete userState[ctx.from.id];
  }
});

// ==================== MENSAJES ====================
bot.on("text", handleMessage);

// ==================== ERROR HANDLER ====================
bot.catch((err, ctx) => {
  console.error("[ERROR] Error no manejado:", err);
  ctx.reply("❌ Ocurrió un error. Por favor intenta de nuevo.", mainKeyboard);
});

module.exports = bot;
