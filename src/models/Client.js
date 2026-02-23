const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cedula: { type: String, required: true, unique: true },
  direccion: { type: String, required: true },
  celular: { type: String, required: true },
  cobrador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaborator',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
