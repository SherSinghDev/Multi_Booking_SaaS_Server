const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['service', 'room', 'slot'],
    required: [true, 'Service type is required'],
  },
  price: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // in minutes — for appointments/slots
    default: 30,
  },
  description: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  paymentMode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
