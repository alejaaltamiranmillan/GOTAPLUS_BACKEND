const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const userRoutes = require("./routes/user.routes");
const collaboratorRoutes = require("./routes/collaborator.routes");
const clientRoutes = require("./routes/client.routes");
const creditRoutes = require("./routes/credit.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const tenantRoutes = require("./routes/tenant.routes");
const initRoutes = require("./routes/init.routes");
const telegramRoutes = require("./routes/telegram.routes");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://gotaplus-frontend.vercel.app",
    "https://gotaplusfrontend.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware para asegurar conexión a MongoDB en cada request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("[ERROR] MongoDB connection failed:", error.message);
    next();
  }
});

app.use("/api/init", initRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/telegram", telegramRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API TU COBRADOR funcionando 🔥" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

module.exports = app;
