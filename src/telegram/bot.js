const { Telegraf } = require("telegraf");
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
    // TODO: Llamar a la API para crear cliente
    const clienteData = {
      nombre: state.nombre,
      cedula: state.cedula,
      celular: state.celular,
      direccion: state.direccion,
    };

    console.log("[INFO] Cliente a crear:", clienteData);

    await ctx.editMessageText(
      "✅ *Cliente creado exitosamente!*\n\n" +
        `📋 ${state.nombre} ha sido registrado.\n\n` +
        "¿Qué deseas hacer ahora?",
      { parse_mode: "Markdown", ...mainKeyboard },
    );

    delete userState[ctx.from.id];
  } catch (error) {
    console.error("[ERROR] Error creando cliente:", error);
    await ctx.reply(
      "❌ Error al crear cliente. Intenta de nuevo.",
      mainKeyboard,
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
    // TODO: Llamar a la API para crear crédito
    const creditoData = {
      cedula_cliente: state.cedula_cliente,
      montoPrestado: state.monto,
      montoTotal: state.montoTotal,
      fechaPago: state.fechaPago,
    };

    console.log("[INFO] Crédito a crear:", creditoData);

    await ctx.editMessageText(
      "✅ *Crédito creado exitosamente!*\n\n" +
        `💳 Monto: $${state.montoTotal.toLocaleString()}\n` +
        `📅 Pago: ${state.fechaPago}\n\n` +
        "¿Qué deseas hacer ahora?",
      { parse_mode: "Markdown", ...mainKeyboard },
    );

    delete userState[ctx.from.id];
  } catch (error) {
    console.error("[ERROR] Error creando crédito:", error);
    await ctx.reply(
      "❌ Error al crear crédito. Intenta de nuevo.",
      mainKeyboard,
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
