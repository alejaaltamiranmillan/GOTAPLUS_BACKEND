const mongoose = require("mongoose");

const collaboratorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    celular: { type: String, required: true },
    direccion: { type: String, required: true },
    cedula: { type: String, required: true },
    activo: { type: Boolean, default: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true
    }
  },
  { timestamps: true }
);

// Cédula única por tenant
collaboratorSchema.index({ cedula: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model("Collaborator", collaboratorSchema);