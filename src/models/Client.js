const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cedula: { type: String, required: true },
  direccion: { type: String, required: true },
  celular: { type: String, required: true },
  cobrador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaborator',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
}, { timestamps: true });

// Cédula única por tenant (no global)
clientSchema.index({ cedula: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);