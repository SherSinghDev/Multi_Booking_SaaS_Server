const express = require('express');
const router = express.Router();
const {
  createService,
  getServices,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createService);
router.get('/:businessId', getServices);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
