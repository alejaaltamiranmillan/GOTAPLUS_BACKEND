const axios = require("axios");
const {
  mainKeyboard,
  confirmKeyboard,
  backKeyboard,
  paymentMethodKeyboard,
} = require("./keyboards");

const API_URL = process.env.API_URL || "http://localhost:5000";

// Estado temporal del usuario
const userState = {};

// ==================== CREAR CLIENTE ====================
const crearClienteFlow = async (ctx) => {
  userState[ctx.from.id] = { action: "crear_cliente", step: 1 };

  await ctx.reply(
    "📋 *Crear Cliente*\n\n¿Cuál es el nombre completo del cliente?",
    { parse_mode: "Markdown" },
  );
};

// ==================== CREAR CRÉDITO ====================
const crearCreditoFlow = async (ctx) => {
  userState[ctx.from.id] = { action: "crear_credito", step: 1 };

  await ctx.reply("💳 *Crear Crédito*\n\n¿Cuál es la cédula del cliente?", {
    parse_mode: "Markdown",
  });
};

// ==================== CONSULTAR CLIENTE ====================
const consultarClienteFlow = async (ctx) => {
  userState[ctx.from.id] = { action: "consultar_cliente", step: 1 };

  await ctx.reply(
    "🔍 *Consultar Cliente*\n\n¿Cuál es la cédula del cliente a consultar?",
    { parse_mode: "Markdown" },
  );
};

// ==================== REGISTRAR PAGO ====================
const registrarPagoFlow = async (ctx) => {
  userState[ctx.from.id] = { action: "registrar_pago", step: 1 };

  await ctx.reply(
    "💰 *Registrar Pago*\n\n¿Cuál es la cédula del cliente que va a realizar el pago?",
    { parse_mode: "Markdown" },
  );
};

// ==================== PROCESAR RESPUESTAS ====================
const handleMessage = async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  if (!userState[userId]) {
    await ctx.reply(
      "❌ Por favor selecciona una opción del menú.",
      mainKeyboard,
    );
    return;
  }

  const state = userState[userId];

  try {
    if (state.action === "crear_cliente") {
      await handleCrearCliente(ctx, state, text);
    } else if (state.action === "crear_credito") {
      await handleCrearCredito(ctx, state, text);
    } else if (state.action === "consultar_cliente") {
      await handleConsultarCliente(ctx, state, text);
    } else if (state.action === "registrar_pago") {
      await handleRegistrarPago(ctx, state, text);
    }
  } catch (error) {
    console.error("[ERROR] Error en handleMessage:", error);
    await ctx.reply(
      "❌ Error procesando tu solicitud. Intenta de nuevo.",
      mainKeyboard,
    );
    delete userState[userId];
  }
};

// ==================== HELPERS CREAR CLIENTE ====================
const handleCrearCliente = async (ctx, state, text) => {
  const userId = ctx.from.id;

  if (state.step === 1) {
    userState[userId].nombre = text;
    userState[userId].step = 2;
    await ctx.reply("¿Cuál es la cédula?");
  } else if (state.step === 2) {
    userState[userId].cedula = text;
    userState[userId].step = 3;
    await ctx.reply("¿Cuál es el número de celular?");
  } else if (state.step === 3) {
    userState[userId].celular = text;
    userState[userId].step = 4;
    await ctx.reply("¿Cuál es la dirección?");
  } else if (state.step === 4) {
    userState[userId].direccion = text;

    const summary = `
📋 *Resumen del Cliente:*
• Nombre: ${userState[userId].nombre}
• Cédula: ${userState[userId].cedula}
• Celular: ${userState[userId].celular}
• Dirección: ${userState[userId].direccion}

¿Confirmar la creación?
    `;

    await ctx.reply(summary, {
      parse_mode: "Markdown",
      ...confirmKeyboard("crear_cliente_final"),
    });
  }
};

// ==================== HELPERS CREAR CRÉDITO ====================
const handleCrearCredito = async (ctx, state, text) => {
  const userId = ctx.from.id;

  if (state.step === 1) {
    userState[userId].cedula_cliente = text;
    userState[userId].step = 2;
    await ctx.reply("¿Cuál es el monto a prestar?");
  } else if (state.step === 2) {
    userState[userId].monto = parseFloat(text);
    if (isNaN(userState[userId].monto)) {
      await ctx.reply("❌ Por favor ingresa un número válido.");
      return;
    }

    const montoTotal = userState[userId].monto * 1.3;
    userState[userId].montoTotal = montoTotal;
    userState[userId].step = 3;

    await ctx.reply("¿Cuál es la fecha de pago? (DD/MM/YYYY)");
  } else if (state.step === 3) {
    userState[userId].fechaPago = text;

    const summary = `
💳 *Resumen del Crédito:*
• Cédula Cliente: ${userState[userId].cedula_cliente}
• Monto Prestado: $${userState[userId].monto.toLocaleString()}
• Monto Total (30%): $${userState[userId].montoTotal.toLocaleString()}
• Fecha Pago: ${userState[userId].fechaPago}

¿Confirmar la creación?
    `;

    await ctx.reply(summary, {
      parse_mode: "Markdown",
      ...confirmKeyboard("crear_credito_final"),
    });
  }
};

// ==================== HELPERS CONSULTAR CLIENTE ====================
const handleConsultarCliente = async (ctx, state, text) => {
  const cedula = text;

  try {
    // Aquí harías la llamada a tu API
    const response = await axios.get(`${API_URL}/api/clients`, {
      headers: {
        Authorization: `Bearer ${process.env.TELEGRAM_API_TOKEN}`,
      },
    });

    const cliente = response.data.find((c) => c.cedula === cedula);

    if (!cliente) {
      await ctx.reply(
        `❌ No se encontró cliente con cédula: ${cedula}`,
        backKeyboard,
      );
      delete userState[ctx.from.id];
      return;
    }

    const info = `
👤 *Información del Cliente:*
• Nombre: ${cliente.nombre}
• Cédula: ${cliente.cedula}
• Celular: ${cliente.celular}
• Dirección: ${cliente.direccion}
• Cliente desde: ${new Date(cliente.createdAt).toLocaleDateString()}
    `;

    await ctx.reply(info, { parse_mode: "Markdown", ...backKeyboard });
    delete userState[ctx.from.id];
  } catch (error) {
    console.error("[ERROR] Error consultando cliente:", error);
    await ctx.reply("❌ Error al consultar cliente.", backKeyboard);
    delete userState[ctx.from.id];
  }
};

// ==================== HELPERS REGISTRAR PAGO ====================
const handleRegistrarPago = async (ctx, state, text) => {
  const userId = ctx.from.id;

  if (state.step === 1) {
    userState[userId].cedula_pago = text;
    userState[userId].step = 2;

    await ctx.reply("¿Cuál es el monto del pago?");
  } else if (state.step === 2) {
    userState[userId].monto_pago = parseFloat(text);
    if (isNaN(userState[userId].monto_pago)) {
      await ctx.reply("❌ Por favor ingresa un número válido.");
      return;
    }

    userState[userId].step = 3;
    await ctx.reply("Selecciona tipo de pago:", paymentMethodKeyboard);
  }
};

module.exports = {
  crearClienteFlow,
  crearCreditoFlow,
  consultarClienteFlow,
  registrarPagoFlow,
  handleMessage,
  userState,
};
