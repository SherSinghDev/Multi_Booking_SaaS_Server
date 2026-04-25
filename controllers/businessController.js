const Business = require('../models/Business');

// POST /api/business — Create a business
exports.createBusiness = async (req, res) => {
  try {
    const { businessName, businessType, slug, description, phone, address, availability } = req.body;

    // Check slug uniqueness
    const existing = await Business.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Slug already taken. Choose a different one.' });
    }

    let parsedAvailability = availability;
    if (typeof availability === 'string') {
      try {
        parsedAvailability = JSON.parse(availability);
      } catch (e) {
        // Keep as is or handle error
      }
    }

    const business = await Business.create({
      owner: req.user._id,
      businessName,
      businessType,
      slug: slug.toLowerCase(),
      description,
      phone,
      address,
      availability: parsedAvailability,
      paymentReceipt: req.file ? `/uploads/${req.file.filename}` : '',
      status: 'pending', // Explicitly set to pending
    });

    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/business/my — Get all businesses for logged-in user
exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user._id }).sort({ createdAt: -1 });
    
    // Auto-check for expiry
    const now = new Date();
    const updatedBusinesses = await Promise.all(businesses.map(async (biz) => {
      if (biz.status === 'approved' && biz.subscriptionEnd && biz.subscriptionEnd < now) {
        biz.status = 'expired';
        await biz.save();
      }
      return biz;
    }));

    res.json(updatedBusinesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/business/:slug — Public route to get business by slug
exports.getBusinessBySlug = async (req, res) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Auto-check for expiry
    const now = new Date();
    if (business.status === 'approved' && business.subscriptionEnd && business.subscriptionEnd < now) {
      business.status = 'expired';
      await business.save();
    }

    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/business/:id — Update business
exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check ownership
    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Business.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/business/:id — Delete business
exports.deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Business.findByIdAndDelete(req.params.id);
    res.json({ message: 'Business deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// POST /api/business/:id/renew — Submit renewal request
exports.renewBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    if (business.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    if (!req.file) {
      return res.status(400).json({ message: 'New payment receipt is required for renewal' });
    }

    business.paymentReceipt = `/uploads/${req.file.filename}`;
    business.status = 'pending_renewal';
    await business.save();

    res.json({ message: 'Renewal request submitted', business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
