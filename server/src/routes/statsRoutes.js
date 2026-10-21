const express = require('express');
const { protect, requireWarden } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

const router = express.Router();

router.use(protect);
router.use(requireWarden);

router.get('/', statsController.getStats);

module.exports = router;
