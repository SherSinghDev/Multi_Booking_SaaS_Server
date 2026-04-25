const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middleware/auth');
const { 
  getGlobalStats, 
  getAllUsers, 
  getAllBusinesses, 
  deleteUser,
  updateBusinessStatus
} = require('../controllers/adminController');

// All routes here are protected and require super-admin role
router.use(protect);
router.use(authorizeAdmin);

router.get('/stats', getGlobalStats);
router.get('/users', getAllUsers);
router.get('/businesses', getAllBusinesses);
router.delete('/users/:id', deleteUser);
router.put('/businesses/:id/status', updateBusinessStatus);

module.exports = router;
