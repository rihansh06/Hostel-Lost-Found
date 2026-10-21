const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const claimController = require('../controllers/claimController');
const { protect } = require('../middleware/auth');
const { uploadPostImages } = require('../middleware/upload');
const { createPostSchema, filterPostsSchema, validateBody, validateQuery } = require('../utils/validators');

router.use(protect);

router.post(
  '/',
  uploadPostImages,
  validateBody(createPostSchema),
  postController.createPost
);

router.get(
  '/',
  validateQuery(filterPostsSchema),
  postController.getPosts
);

router.get('/:id', postController.getPostById);
router.get('/:id/matches', postController.getPostMatches);
router.post('/:id/claims', claimController.submitClaim);
router.get('/:id/claims', claimController.getPostClaims);
router.patch('/:id/returned', postController.markReturned);
router.delete('/:id', postController.deletePost);

module.exports = router;
