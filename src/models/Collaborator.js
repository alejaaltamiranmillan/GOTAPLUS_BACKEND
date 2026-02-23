const mongoose = require('mongoose');

const collaboratorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  celular: { type: String, required: true },
  direccion: { type: String, required: true },
  cedula: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Collaborator', collaboratorSchema);
