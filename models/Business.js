const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
  },
  businessType: {
    type: String,
    enum: ['clinic', 'salon', 'hotel'],
    required: [true, 'Business type is required'],
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  availability: {
    days: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    },
    startTime: {
      type: String,
      default: '09:00',
    },
    endTime: {
      type: String,
      default: '18:00',
    },
    slotDuration: {
      type: Number, // in minutes
      default: 30,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'pending_renewal'],
    default: 'pending',
  },
  paymentReceipt: {
    type: String,
    default: '',
  },
  paymentAmount: {
    type: Number,
    default: 499,
  },
  subscriptionStart: {
    type: Date,
  },
  subscriptionEnd: {
    type: Date,
  },
  upiQrCode: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
