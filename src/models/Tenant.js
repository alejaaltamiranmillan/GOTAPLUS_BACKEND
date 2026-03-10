const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    codigo: { type: String, required: true, unique: true, uppercase: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);