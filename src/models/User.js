const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'cobrador'],
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null // null para superadmin
  }
}, { timestamps: true });

// Username único por tenant (no global)
userSchema.index({ username: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);