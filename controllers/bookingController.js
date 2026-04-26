const Booking = require('../models/Booking');
const Business = require('../models/Business');
const Service = require('../models/Service');

// Helper: Generate time slots for a business
const generateTimeSlots = (startTime, endTime, slotDuration) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + slotDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    currentMinutes += slotDuration;
  }

  return slots;
};

// POST /api/bookings — Create a booking (public, no auth)
exports.createBooking = async (req, res) => {
  try {
    const { businessId, serviceId, customerName, customerPhone, customerEmail, date, timeSlot, notes } = req.body;

    // Verify business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check day availability
    const bookingDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[bookingDate.getDay()];

    if (!business.availability.days.includes(dayName)) {
      return res.status(400).json({ message: `Business is closed on ${dayName}` });
    }

    // Check if slot is valid
    const allSlots = generateTimeSlots(
      business.availability.startTime,
      business.availability.endTime,
      business.availability.slotDuration
    );

    if (!allSlots.includes(timeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot' });
    }

    // Check double booking
    const existingBooking = await Booking.findOne({
      business: businessId,
      service: serviceId,
      date,
      timeSlot,
      status: { $ne: 'cancelled' },
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }

    const booking = await Booking.create({
      business: businessId,
      service: serviceId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      timeSlot,
      notes,
      paymentReceipt: req.file ? `/uploads/${req.file.filename}` : '',
    });

    const populated = await Booking.findById(booking._id).populate('service');

    res.status(201).json(populated);
  } catch (error) {
    // Handle duplicate key error from compound index
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/:businessId — Get all bookings for a business (auth required)
exports.getBookings = async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { date, status } = req.query;
    const filter = { business: req.params.businessId };

    if (date) filter.date = date;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('service')
      .sort({ date: -1, timeSlot: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/:businessId/stats — Get booking stats
exports.getBookingStats = async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const today = new Date().toISOString().split('T')[0];

    const totalBookings = await Booking.countDocuments({
      business: req.params.businessId,
    });

    const todayBookings = await Booking.countDocuments({
      business: req.params.businessId,
      date: today,
    });

    const pendingBookings = await Booking.countDocuments({
      business: req.params.businessId,
      status: 'pending',
    });

    const confirmedBookings = await Booking.countDocuments({
      business: req.params.businessId,
      status: 'confirmed',
    });

    res.json({
      totalBookings,
      todayBookings,
      pendingBookings,
      confirmedBookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/available-slots — Get available slots for a date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { businessId, serviceId, date } = req.query;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check day availability
    const bookingDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[bookingDate.getDay()];

    if (!business.availability.days.includes(dayName)) {
      return res.json({ slots: [], message: `Business is closed on ${dayName}` });
    }

    // Generate all slots
    const allSlots = generateTimeSlots(
      business.availability.startTime,
      business.availability.endTime,
      business.availability.slotDuration
    );

    // Get booked slots for this date and service
    const bookedSlots = await Booking.find({
      business: businessId,
      service: serviceId,
      date,
      status: { $ne: 'cancelled' },
    }).select('timeSlot');

    const bookedTimeSlots = bookedSlots.map((b) => b.timeSlot);

    // Filter available slots
    const availableSlots = allSlots.map((slot) => ({
      time: slot,
      available: !bookedTimeSlots.includes(slot),
    }));

    res.json({ slots: availableSlots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/bookings/:id/status — Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('business');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.status) booking.status = req.body.status;
    if (req.body.paymentStatus) booking.paymentStatus = req.body.paymentStatus;
    await booking.save();

    const updated = await Booking.findById(req.params.id).populate('service');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
