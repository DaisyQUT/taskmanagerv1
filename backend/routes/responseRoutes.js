const express = require('express');
const { acceptResponse, declineResponse } = require('../controllers/responseController');
const { protect, requireRole, requireApproved } = require('../middleware/authMiddleware');

const router = express.Router();

// Same access rule as the posts routes: approved members only.
router.use(protect, requireRole('member'), requireApproved);

router.patch('/:id/accept', acceptResponse);
router.patch('/:id/decline', declineResponse);

module.exports = router;
