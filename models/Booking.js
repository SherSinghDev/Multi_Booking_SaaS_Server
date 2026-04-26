const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true,
  },
  customerEmail: {
    type: String,
    default: '',
    trim: true,
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: [true, 'Booking date is required'],
  },
  timeSlot: {
    type: String, // e.g. "09:00"
    required: [true, 'Time slot is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  notes: {
    type: String,
    default: '',
  },
  paymentReceipt: {
    type: String,
    default: '',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

// Compound index to prevent double booking
bookingSchema.index(
  { business: 1, date: 1, timeSlot: 1, service: 1 },
  { unique: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
