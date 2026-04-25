const Service = require('../models/Service');
const Business = require('../models/Business');

// POST /api/services — Create a service
exports.createService = async (req, res) => {
  try {
    const { businessId, name, type, price, duration, description } = req.body;

    // Verify business ownership
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const service = await Service.create({
      business: businessId,
      name,
      type,
      price,
      duration,
      description,
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/services/:businessId — Get all services for a business
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({
      business: req.params.businessId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/services/:id — Update a service
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('business');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/services/:id — Delete a service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('business');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
