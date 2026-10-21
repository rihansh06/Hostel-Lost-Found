const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/spots', postController.getSpots);

module.exports = router;
