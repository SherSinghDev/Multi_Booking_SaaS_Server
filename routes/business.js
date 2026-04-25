const express = require('express');
const router = express.Router();
const {
  createBusiness,
  getMyBusinesses,
  getBusinessBySlug,
  updateBusiness,
  deleteBusiness,
  renewBusiness,
} = require('../controllers/businessController');
const { protect } = require('../middleware/auth');

const upload = require('../middleware/upload');

router.post('/', protect, upload.single('paymentReceipt'), createBusiness);
router.get('/my', protect, getMyBusinesses);
router.get('/:slug', getBusinessBySlug);
router.put('/:id', protect, updateBusiness);
router.post('/:id/renew', protect, upload.single('paymentReceipt'), renewBusiness);
router.delete('/:id', protect, deleteBusiness);

module.exports = router;
