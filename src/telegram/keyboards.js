const { Markup } = require("telegraf");

// Teclado principal
const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback("📋 Crear Cliente", "crear_cliente")],
  [Markup.button.callback("💳 Crear Crédito", "crear_credito")],
  [Markup.button.callback("🔍 Consultar Cliente", "consultar_cliente")],
  [Markup.button.callback("💰 Registrar Pago", "registrar_pago")],
]);

// Teclado para confirmar
const confirmKeyboard = (action) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("✅ Confirmar", `confirmar_${action}`),
      Markup.button.callback("❌ Cancelar", "menu_principal"),
    ],
  ]);

// Teclado para volver al menú
const backKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback("🔙 Volver al Menú", "menu_principal")],
]);

// Teclado de pago
const paymentMethodKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback("Pago Total", "pago_total"),
    Markup.button.callback("Pago Parcial", "pago_parcial"),
  ],
  [Markup.button.callback("🔙 Cancelar", "menu_principal")],
]);

module.exports = {
  mainKeyboard,
  confirmKeyboard,
  backKeyboard,
  paymentMethodKeyboard,
};
