const User = require('../models/User');
const Post = require('../models/Post');
const Match = require('../models/Match');
const Hostel = require('../models/Hostel');
const scoringService = require('./scoringService');

// Get all unapproved resident accounts strictly inside the warden's hostel
const getPendingUsers = async (hostelId) => {
  const pendingUsers = await User.find({
    hostel: hostelId,
    approved: false,
    role: 'resident',
  })
    .select('name email room role approved createdAt')
    .sort({ createdAt: -1 });

  return pendingUsers;
};

// Approve a user account, strictly scoped to the warden's hostel
const approveUser = async (hostelId, userId) => {
  const user = await User.findOne({
    _id: userId,
    hostel: hostelId,
  }).select('-passwordHash');

  if (!user) {
    const error = new Error('User not found in your hostel');
    error.statusCode = 404;
    throw error;
  }

  user.approved = true;
  await user.save();

  return user;
};

// Wardens can see all posts in their hostel, including sensitive verification fields
const getWardenPosts = async (hostelId, query = {}) => {
  const filter = { hostel: hostelId };

  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const posts = await Post.find(filter)
    .populate('postedBy', 'name email room role')
    .sort({ createdAt: -1 });

  return posts;
};

// Warden admin debug inspection of a match's algorithmic score breakdown
const getMatchBreakdown = async (hostelId, matchId) => {
  const match = await Match.findOne({
    _id: matchId,
    hostel: hostelId,
  })
    .populate('lostPost')
    .populate('foundPost');

  if (!match) {
    const error = new Error('Match not found in your hostel');
    error.statusCode = 404;
    throw error;
  }

  const hostel = await Hostel.findById(hostelId);
  return scoringService.getDetailedScoreBreakdown(match.lostPost, match.foundPost, match, hostel);
};

module.exports = {
  getPendingUsers,
  approveUser,
  getWardenPosts,
  getMatchBreakdown,
};
