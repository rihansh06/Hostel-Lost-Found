const express = require('express');
const router = express.Router();
const wardenController = require('../controllers/wardenController');
const { protect, requireWarden } = require('../middleware/auth');

router.use(protect);
router.use(requireWarden);

router.get('/pending-users', wardenController.getPendingUsers);
router.patch('/users/:id/approve', wardenController.approveUser);
router.get('/posts', wardenController.getWardenPosts);

module.exports = router;
