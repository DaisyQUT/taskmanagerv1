const express = require('express');
const { createPost, listPosts, getPost, respondToPost, listMyPosts, getOverview } = require('../controllers/postController');
const { protect, requireRole, requireApproved } = require('../middleware/authMiddleware');

const router = express.Router();

// ALN-21 (R3): the overview is the one board route pending members may use. It is declared before
// router.use() below, so it answers first and the approved-only check never runs for it.
router.get('/overview', protect, requireRole('member'), getOverview);

// The exchange board is for approved members only (ALN-8 middleware). Admins are not graduates
// in the network, so requireRole('member') keeps them out even though requireApproved lets them pass.
router.use(protect, requireRole('member'), requireApproved);

router.get('/', listPosts);
router.post('/', createPost);
// '/mine' must come before '/:id', otherwise Express would read "mine" as a post id.
router.get('/mine', listMyPosts);
router.get('/:id', getPost);
router.post('/:id/responses', respondToPost);

module.exports = router;
