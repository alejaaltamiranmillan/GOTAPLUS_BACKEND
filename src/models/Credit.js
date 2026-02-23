const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  fechaPrestamo: {
    type: Date,
    default: Date.now
  },
  fechaPago: {
    type: Date
  },
  montoPrestado: {
    type: Number,
    required: true
  },
  montoTotal: {
    type: Number,
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  cobrador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaborator',
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'pagado'],
    default: 'pendiente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Credit', creditSchema);
