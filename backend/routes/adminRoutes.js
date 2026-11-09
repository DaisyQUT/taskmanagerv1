const express = require('express');
const { getPendingApplications } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Applied to every route in this file, so new admin endpoints are protected by default.
router.use(protect, requireRole('admin'));

router.get('/verifications', getPendingApplications);

module.exports = router;
