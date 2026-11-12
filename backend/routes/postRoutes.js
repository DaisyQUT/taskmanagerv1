const express = require('express');
const { createPost } = require('../controllers/postController');
const { protect, requireRole, requireApproved } = require('../middleware/authMiddleware');

const router = express.Router();

// The exchange board is for approved members only (ALN-8 middleware). Admins are not graduates
// in the network, so requireRole('member') keeps them out even though requireApproved lets them pass.
router.use(protect, requireRole('member'), requireApproved);

router.post('/', createPost);

module.exports = router;
