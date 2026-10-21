const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/mine', claimController.getMyClaims);
router.patch('/:id', claimController.reviewClaim);

module.exports = router;
