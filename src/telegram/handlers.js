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
    // Llamar al nuevo endpoint de Telegram
    const response = await axios.get(
      `${API_URL}/api/telegram/client/${cedula}`,
    );

    const { cliente, creditos } = response.data;

    if (!cliente) {
      await ctx.reply(
        `❌ No se encontró cliente con cédula: ${cedula}`,
        backKeyboard,
      );
      delete userState[ctx.from.id];
      return;
    }

    let creditosInfo = "📭 Sin créditos registrados";
    if (creditos && creditos.length > 0) {
      creditosInfo = creditos
        .map(
          (c, i) =>
            `${i + 1}. $${c.montoPrestado.toLocaleString()} - Pagar: ${c.fechaPago} (${c.estado})`,
        )
        .join("\n");
    }

    const info = `
👤 *Información del Cliente:*
• Nombre: ${cliente.nombre}
• Cédula: ${cliente.cedula}
• Celular: ${cliente.celular}
• Dirección: ${cliente.direccion}

💳 *Créditos:*
${creditosInfo}
    `;

    await ctx.reply(info, { parse_mode: "Markdown", ...backKeyboard });
    delete userState[ctx.from.id];
  } catch (error) {
    console.error("[ERROR] Error consultando cliente:", error);
    const errorMsg = error.response?.data?.error || error.message;
    await ctx.reply(`❌ ${errorMsg}`, backKeyboard);
    delete userState[ctx.from.id];
  }
};

// ==================== HELPERS REGISTRAR PAGO ====================
const handleRegistrarPago = async (ctx, state, text) => {
  const userId = ctx.from.id;

  if (state.step === 1) {
    // Paso 1: Obtener cédula del cliente
    userState[userId].cedula_pago = text;
    userState[userId].step = 2;

    await ctx.reply("📋 Buscando créditos pendientes del cliente...");

    // Buscar cliente
    try {
      const clientResponse = await axios.get(
        `${API_URL}/api/telegram/client/${text}`,
      );
      const { cliente, creditos } = clientResponse.data;

      if (!creditos || creditos.length === 0) {
        await ctx.reply(
          "❌ Este cliente no tiene créditos pendientes.",
          backKeyboard,
        );
        delete userState[userId];
        return;
      }

      // Guardar créditos pendientes
      const creditosPendientes = creditos.filter(
        (c) => c.estado === "pendiente",
      );
      if (creditosPendientes.length === 0) {
        await ctx.reply(
          "✅ Este cliente ya pagó todos sus créditos.",
          backKeyboard,
        );
        delete userState[userId];
        return;
      }

      userState[userId].creditos = creditosPendientes;
      userState[userId].cliente_nombre = cliente.nombre;

      // Mostrar opciones de créditos
      let mensaje = `👤 Cliente: ${cliente.nombre}\n\n💳 *Créditos Pendientes:*\n\n`;
      creditosPendientes.forEach((c, i) => {
        mensaje += `${i + 1}. Monto: $${c.montoPrestado.toLocaleString()}\n   Fecha: ${c.fechaPago}\n\n`;
      });
      mensaje += "Escribe el número del crédito a pagar:";

      await ctx.reply(mensaje, { parse_mode: "Markdown" });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      await ctx.reply(`❌ Error: ${errorMsg}`, backKeyboard);
      delete userState[userId];
    }
  } else if (state.step === 2) {
    // Paso 2: Seleccionar crédito
    const indiceCredito = parseInt(text) - 1;
    const creditos = userState[userId].creditos;

    if (
      isNaN(indiceCredito) ||
      indiceCredito < 0 ||
      indiceCredito >= creditos.length
    ) {
      await ctx.reply("❌ Por favor ingresa un número válido.");
      return;
    }

    const creditoSeleccionado = creditos[indiceCredito];
    userState[userId].creditoId = creditoSeleccionado._id;
    userState[userId].monto_pago = creditoSeleccionado.montoPrestado;
    userState[userId].step = 3;

    const resumen = `
✅ *Crédito Seleccionado:*
• Monto: $${creditoSeleccionado.montoPrestado.toLocaleString()}
• Total a Pagar: $${creditoSeleccionado.montoTotal.toLocaleString()}
• Fecha: ${creditoSeleccionado.fechaPago}

¿Confirmar pago?
    `;

    await ctx.reply(resumen, {
      parse_mode: "Markdown",
      ...confirmKeyboard("registrar_pago_final"),
    });
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
