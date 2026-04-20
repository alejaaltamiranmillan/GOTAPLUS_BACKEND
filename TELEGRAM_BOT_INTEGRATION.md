# Integración de Bot de Telegram - GotaPlus

## 📋 Descripción General

El bot de Telegram ha sido integrado al backend de GotaPlus, permitiendo que los usuarios realicen las siguientes operaciones directamente desde Telegram:

- ✅ Crear cliente
- ✅ Crear crédito
- ✅ Consultar información de cliente
- ✅ Registrar pago de deuda

## 🚀 Configuración

### Variables de Entorno (.env)

Asegúrate de que el archivo `.env` en `GOTAPLUS_BACKEND/` contenga:

```env
TELEGRAM_TOKEN=8544070409:AAFgYu7y9-2hRDcDsUulej0_VPF_nqtyQ_s
API_URL=http://localhost:5000
```

### Instalación de Dependencias

```bash
npm install
npm install telegraf
npm install axios
```

## 📁 Estructura de Archivos

```
src/telegram/
├── bot.js           # Inicialización del bot y handlers principales
├── handlers.js      # Lógica de cada flujo (crear cliente, crédito, etc)
├── keyboards.js     # Definición de teclados inline (botones)
└── setup.js         # Configuración de webhook y polling
```

## 🔧 Componentes Principales

### 1. **bot.js** - Inicialización del Bot

- Crea la instancia de Telegraf con el token
- Define comandos: `/start`, `/help`
- Define handlers para botones (callback queries)
- Maneja errores globales

### 2. **keyboards.js** - Teclados Inline

- `mainKeyboard()` - Menú principal con 4 opciones
- `confirmKeyboard()` - Botones de Confirmar/Cancelar
- `backKeyboard()` - Botón para volver
- `paymentMethodKeyboard()` - Métodos de pago

### 3. **handlers.js** - Lógica de Flujos

Cada función gestiona un flujo conversacional:

#### Crear Cliente

```
/start → Seleccionar "Crear Cliente" → Ingresar datos → Confirmar → Crear en BD
```

#### Crear Crédito

```
Seleccionar "Crear Crédito" → Seleccionar cliente → Ingresar monto y fechas → Crear en BD
```

#### Consultar Cliente

```
Seleccionar "Consultar Cliente" → Ingresar cédula → Ver datos y créditos
```

#### Registrar Pago

```
Seleccionar "Registrar Pago" → Seleccionar crédito → Marcar como pagado
```

### 4. **setup.js** - Configuración

- `startBotPolling()` - Inicia bot en polling (desarrollo)
- `setupWebhook()` - Configura webhook (producción)

## 🌐 Modos de Funcionamiento

### Modo Polling (Desarrollo)

```javascript
// En server.js (por defecto en desarrollo)
if (process.env.NODE_ENV !== "production") {
  startBotPolling();
}
```

El bot consulta continuamente a Telegram por nuevos mensajes.

### Modo Webhook (Producción)

```
Telegram → POST /api/telegram/webhook → Handler → Respuesta
```

## 📲 Cómo Usar el Bot

1. **Buscar el bot en Telegram:**
   - Busca: `@GotaPlusCobradorBot` (o el nombre que configuraste con BotFather)

2. **Comando Inicial:**
   - `/start` - Muestra el menú principal

3. **Botones Principales:**
   ```
   ➕ Crear Cliente
   💳 Crear Crédito
   🔍 Consultar Cliente
   💰 Registrar Pago
   ```

## 🔗 Rutas API

### Webhook de Telegram

```
POST /api/telegram/webhook
```

Recibe actualizaciones de Telegram.

### Health Check

```
GET /api/telegram/health
```

Verifica que el bot esté ejecutándose.

## 🔐 Seguridad

- El token de Telegram se almacena en `.env` (no se versionea)
- Las llamadas a la API backend incluyen autorización JWT
- Los datos se validan antes de crear/actualizar
- Las sesiones de usuario se almacenan en memoria (usuario ID de Telegram)

## 📊 Flujo de Datos

```
Usuario Telegram
     ↓
Telegram API (Cloud)
     ↓
Webhook/Polling → bot.js
     ↓
handlers.js (Procesa comando)
     ↓
axios → API Backend
     ↓
MongoDB (Almacena datos)
     ↓
Respuesta → Usuario
```

## 🛠 Desarrollo Local

### Iniciar el servidor:

```bash
npm start
```

### En otra terminal, probar el bot:

```bash
# Abre Telegram y envía un mensaje al bot
# El servidor mostrará logs en la consola
```

### Ver logs:

```
[INFO] Iniciando Telegram bot en polling...
[INFO] ✅ Telegram bot iniciado correctamente
```

## ⚠️ Limitaciones Actuales

1. **Sesión en Memoria** - Si el servidor reinicia, se pierden las sesiones activas
2. **Polling Lento** - En producción, usar webhook es más eficiente
3. **Sin autenticación** - Cualquier usuario con el bot token puede interactuar
4. **Datos Tenant** - El bot necesita saber el tenant del usuario (actualmente usa el primero)

## 📈 Mejoras Futuras

- [ ] Persistencia de sesiones en Redis
- [ ] Validación completa de entrada de usuario
- [ ] Notificaciones de pagos vencidos
- [ ] Reportes de cobro por Telegram
- [ ] Integración con pagos móviles (Tigo Money, etc)
- [ ] Autenticación con número de teléfono
- [ ] Historial de transacciones

## 🐛 Troubleshooting

### El bot no responde

```
1. Verificar que TELEGRAM_TOKEN sea correcto
2. Verificar que "npm start" está corriendo
3. Revisar logs en la consola
4. Verificar conexión a MongoDB
```

### Error: Cannot find module

```
npm install telegraf axios
```

### Webhook no recibe mensajes

```
1. Verificar URL de webhook en setup.js
2. Usar ngrok para exponer servidor local
3. Cambiar a webhook mode en setup.js
```

## 📝 Notas Técnicas

- **Framework**: Telegraf (wrapper de Telegram Bot API)
- **HTTP Client**: Axios (para llamadas a API backend)
- **State Management**: `ctx.session` (en memoria)
- **Parsing**: Markdown para mensajes del bot

## 📞 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.
