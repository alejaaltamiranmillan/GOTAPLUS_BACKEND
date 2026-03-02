const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
connectDB();

const app = express();
const userRoutes = require("./routes/user.routes");
const collaboratorRoutes = require("./routes/collaborator.routes");
const clientRoutes = require("./routes/client.routes");
const creditRoutes = require("./routes/credit.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "https://gotaplus-backend.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API TU COBRADOR funcionando 🔥" });
});

module.exports = app;
