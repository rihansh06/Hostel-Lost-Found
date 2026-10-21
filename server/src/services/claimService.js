const Claim = require('../models/Claim');
const Post = require('../models/Post');
const User = require('../models/User');
const notificationService = require('./notificationService');

/**
 * Submit an ownership claim on a found item
 */
const submitClaim = async (postId, answers, claimantUser) => {
  // 1. Scoped to claimant's hostel
  const post = await Post.findOne({
    _id: postId,
    hostel: claimantUser.hostel,
  }).populate('postedBy', 'name room email');

  if (!post) {
    const error = new Error('Post not found in your hostel');
    error.statusCode = 404;
    throw error;
  }

  // 2. Only found posts can be claimed
  if (post.type !== 'found') {
    const error = new Error('Only found items can be claimed');
    error.statusCode = 400;
    throw error;
  }

  // 3. Cannot claim your own post
  if (post.postedBy._id.toString() === claimantUser._id.toString()) {
    const error = new Error('You cannot claim an item that you posted');
    error.statusCode = 400;
    throw error;
  }

  // 4. Check claim strikes: blocked after 3 strikes
  const freshUser = await User.findById(claimantUser._id);
  if (freshUser.claimStrikes >= 3) {
    const error = new Error(
      'Your claiming privileges are suspended due to 3 claim strikes. Please contact your hostel warden.'
    );
    error.statusCode = 403;
    throw error;
  }

  // 5. Rate limit: max 3 claims per user per 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentClaimsCount = await Claim.countDocuments({
    claimant: claimantUser._id,
    createdAt: { $gte: twentyFourHoursAgo },
  });

  if (recentClaimsCount >= 3) {
    const error = new Error('Daily claim limit reached (maximum 3 claims per 24 hours)');
    error.statusCode = 429;
    throw error;
  }

  // 6. Validate answers structure
  if (!Array.isArray(answers) || answers.length === 0) {
    const error = new Error('Please provide answers to the verification questions');
    error.statusCode = 400;
    throw error;
  }

  // 7. Create Claim
  const claim = await Claim.create({
    post: post._id,
    claimant: claimantUser._id,
    answers: answers.map((a) => ({
      question: (a.question || '').trim(),
      answer: (a.answer || '').trim(),
    })),
    status: 'pending',
  });

  // 8. Update post status to claim_pending
  post.status = 'claim_pending';
  await post.save();

  // 9. Real-time notification to finder
  await notificationService.createAndEmitNotification({
    userId: post.postedBy._id,
    type: 'claim_received',
    message: `${claimantUser.name} submitted an ownership claim for: "${post.title}"`,
    link: `/posts/${post._id}`,
  });

  return claim;
};

/**
 * Finder or warden approves or rejects a claim
 */
const reviewClaim = async (claimId, status, reviewNote, reviewerUser) => {
  if (!['approved', 'rejected'].includes(status)) {
    const error = new Error("Status must be either 'approved' or 'rejected'");
    error.statusCode = 400;
    throw error;
  }

  const claim = await Claim.findById(claimId)
    .populate({
      path: 'post',
      populate: { path: 'postedBy', select: 'name room email hostel' },
    })
    .populate('claimant', 'name room email claimStrikes hostel');

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  // Hostel scoping
  if (claim.post.hostel.toString() !== reviewerUser.hostel.toString()) {
    const error = new Error('Claim does not belong to your hostel');
    error.statusCode = 403;
    throw error;
  }

  // Only the finder or a warden can review
  const isFinder = claim.post.postedBy._id.toString() === reviewerUser._id.toString();
  const isWarden = reviewerUser.role === 'warden';

  if (!isFinder && !isWarden) {
    const error = new Error('Only the finder or a hostel warden can review this claim');
    error.statusCode = 403;
    throw error;
  }

  if (claim.status !== 'pending') {
    const error = new Error(`This claim has already been ${claim.status}`);
    error.statusCode = 400;
    throw error;
  }

  const post = await Post.findById(claim.post._id);

  if (status === 'approved') {
    claim.status = 'approved';
    claim.reviewedBy = reviewerUser._id;
    claim.reviewNote = reviewNote ? reviewNote.trim() : 'Claim verified and approved';
    await claim.save();

    // Mark post as returned
    post.status = 'returned';
    await post.save();

    // Reject any other pending claims on this post
    await Claim.updateMany(
      { post: post._id, _id: { $ne: claim._id }, status: 'pending' },
      {
        status: 'rejected',
        reviewedBy: reviewerUser._id,
        reviewNote: 'Item was returned to another verified claimant',
      }
    );

    // Notify claimant: they now see the finder's room
    await notificationService.createAndEmitNotification({
      userId: claim.claimant._id,
      type: 'claim_approved',
      message: `Your claim for "${post.title}" was APPROVED! Handover contact: ${claim.post.postedBy.name} (Room ${claim.post.postedBy.room}).`,
      link: `/posts/${post._id}`,
    });

    // If a warden approved it, notify finder as well
    if (isWarden && !isFinder) {
      await notificationService.createAndEmitNotification({
        userId: claim.post.postedBy._id,
        type: 'claim_approved_by_warden',
        message: `Warden approved claim on "${post.title}". Claimant: ${claim.claimant.name} (Room ${claim.claimant.room}).`,
        link: `/posts/${post._id}`,
      });
    }
  } else {
    // Rejection flow
    claim.status = 'rejected';
    claim.reviewedBy = reviewerUser._id;
    claim.reviewNote = reviewNote ? reviewNote.trim() : 'Answers did not match verification criteria';
    await claim.save();

    // Post reverts back to "open"
    post.status = 'open';
    await post.save();

    // Increment claimant's claimStrikes by 1
    const claimantUserDoc = await User.findById(claim.claimant._id);
    claimantUserDoc.claimStrikes = (claimantUserDoc.claimStrikes || 0) + 1;
    await claimantUserDoc.save();

    // Notify claimant of rejection and strikes count
    const strikeMsg =
      claimantUserDoc.claimStrikes >= 3
        ? ' You have reached 3 strikes and claiming is now suspended.'
        : ` (Strike ${claimantUserDoc.claimStrikes}/3)`;

    await notificationService.createAndEmitNotification({
      userId: claim.claimant._id,
      type: 'claim_rejected',
      message: `Your claim for "${post.title}" was rejected.${strikeMsg}`,
      link: `/posts/${post._id}`,
    });
  }

  return claim;
};

/**
 * Get current user's submitted claims
 */
const getMyClaims = async (userId) => {
  const claims = await Claim.find({ claimant: userId })
    .populate({
      path: 'post',
      select: 'title description spot category images status postedBy',
      populate: { path: 'postedBy', select: 'name room email' },
    })
    .sort({ createdAt: -1 });

  return claims.map((c) => {
    const cObj = c.toObject();
    // Handover room details visible only when approved
    if (cObj.status !== 'approved' && cObj.post?.postedBy) {
      delete cObj.post.postedBy.room;
      delete cObj.post.postedBy.email;
    }
    return cObj;
  });
};

/**
 * Get all claims submitted on a specific post (Finder or Warden only)
 */
const getPostClaims = async (postId, user) => {
  const post = await Post.findOne({ _id: postId, hostel: user.hostel });
  if (!post) {
    const error = new Error('Post not found in your hostel');
    error.statusCode = 404;
    throw error;
  }

  const isFinder = post.postedBy.toString() === user._id.toString();
  const isWarden = user.role === 'warden';

  if (!isFinder && !isWarden) {
    const error = new Error('Only the item finder or a warden can view claims for this post');
    error.statusCode = 403;
    throw error;
  }

  const claims = await Claim.find({ post: postId })
    .populate('claimant', 'name room email claimStrikes')
    .populate('reviewedBy', 'name role')
    .sort({ createdAt: -1 });

  return {
    postTitle: post.title,
    hiddenDetails: post.hiddenDetails,
    verificationQuestions: post.verificationQuestions,
    postStatus: post.status,
    claims,
  };
};

/**
 * Warden reset strikes for a resident (accepts user ID or email)
 */
const resetUserStrikes = async (hostelId, target) => {
  const query = { hostel: hostelId };
  if (typeof target === 'string' && target.includes('@')) {
    query.email = target.toLowerCase().trim();
  } else {
    query._id = target;
  }

  const user = await User.findOne(query);
  if (!user) {
    const error = new Error('Resident not found in your hostel');
    error.statusCode = 404;
    throw error;
  }

  user.claimStrikes = 0;
  await user.save();

  // Notify resident
  await notificationService.createAndEmitNotification({
    userId: user._id,
    type: 'strikes_reset',
    message: 'Your hostel warden has reset your claim strikes. You can now claim items again.',
  });

  return { message: `Claim strikes reset to 0 for ${user.name}`, user };
};

module.exports = {
  submitClaim,
  reviewClaim,
  getMyClaims,
  getPostClaims,
  resetUserStrikes,
};
