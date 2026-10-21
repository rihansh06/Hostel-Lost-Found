const express = require('express');
const router = express.Router();
const wardenController = require('../controllers/wardenController');
const claimController = require('../controllers/claimController');
const { protect, requireWarden } = require('../middleware/auth');

router.use(protect);
router.use(requireWarden);

router.get('/pending-users', wardenController.getPendingUsers);
router.patch('/users/:id/approve', wardenController.approveUser);
router.patch('/users/:id/reset-strikes', claimController.resetUserStrikes);
router.get('/posts', wardenController.getWardenPosts);
router.get('/matches/:id/breakdown', wardenController.getMatchBreakdown);

module.exports = router;
