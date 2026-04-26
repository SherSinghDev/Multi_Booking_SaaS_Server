const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingStats,
  getAvailableSlots,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const upload = require('../middleware/upload');

// Public routes
router.post('/', upload.single('paymentReceipt'), createBooking);
router.get('/available-slots', getAvailableSlots);

// Protected routes
router.get('/:businessId', protect, getBookings);
router.get('/:businessId/stats', protect, getBookingStats);
router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;
