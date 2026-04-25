const User = require('../models/User');
const Business = require('../models/Business');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// GET /api/admin/stats — Global SaaS stats
exports.getGlobalStats = async (req, res) => {
  try {
    const [totalUsers, totalBusinesses, totalBookings, totalServices] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      Business.countDocuments(),
      Booking.countDocuments(),
      Service.countDocuments(),
    ]);

    // Calculate revenue (sum of all service prices for confirmed bookings)
    // For MVP, just getting some basic trends
    const recentUsers = await User.find({ role: 'admin' }).sort({ createdAt: -1 }).limit(5);

    res.json({
      totalUsers,
      totalBusinesses,
      totalBookings,
      totalServices,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users — List all registered admins
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/businesses — List all businesses across all users
exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/users/:id — Delete a user and all their data
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find all businesses owned by user
    const businesses = await Business.find({ owner: userId });
    const businessIds = businesses.map(b => b._id);

    // Delete everything related to these businesses
    await Promise.all([
      Booking.deleteMany({ business: { $in: businessIds } }),
      Service.deleteMany({ business: { $in: businessIds } }),
      Business.deleteMany({ owner: userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.json({ message: 'User and all associated data purged.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// PUT /api/admin/businesses/:id/status — Approve or Reject a business
exports.updateBusinessStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = { status };
    
    if (status === 'approved') {
      const now = new Date();
      updateData.subscriptionStart = now;
      updateData.subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }

    const business = await Business.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
