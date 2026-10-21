const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const Hostel = require('../models/Hostel');
const matchingService = require('./matchingService');

// Helper to sanitize post object for response based on user permission
const sanitizePost = (post, user) => {
  const postObj = post.toObject ? post.toObject() : { ...post };

  const isOwner =
    user &&
    (postObj.postedBy?._id
      ? postObj.postedBy._id.toString() === user._id.toString()
      : postObj.postedBy?.toString() === user._id.toString());
  const isWarden = user && user.role === 'warden';

  // Rule: hiddenDetails is NEVER returned to anyone except the poster and wardens
  if (!isOwner && !isWarden) {
    delete postObj.hiddenDetails;
  }

  // Residents viewing found posts only see the questions, never hidden details
  return postObj;
};

const createPost = async (postData, files, user) => {
  const images = files && files.length > 0 ? files.map((f) => `/uploads/${f.filename}`) : [];

  let verificationQuestions = [];
  if (postData.verificationQuestions) {
    if (typeof postData.verificationQuestions === 'string') {
      try {
        verificationQuestions = JSON.parse(postData.verificationQuestions);
      } catch {
        verificationQuestions = [postData.verificationQuestions];
      }
    } else if (Array.isArray(postData.verificationQuestions)) {
      verificationQuestions = postData.verificationQuestions;
    }
  }

  // Filter out blank questions and enforce max 3
  verificationQuestions = verificationQuestions
    .map((q) => (typeof q === 'string' ? q.trim() : ''))
    .filter((q) => q.length > 0)
    .slice(0, 3);

  const post = await Post.create({
    hostel: user.hostel,
    type: postData.type,
    title: postData.title.trim(),
    description: postData.description.trim(),
    category: postData.category,
    spot: postData.spot.trim(),
    happenedAt: postData.happenedAt ? new Date(postData.happenedAt) : new Date(),
    images,
    // Sensitive verification fields only allowed on "found" posts
    hiddenDetails: postData.type === 'found' ? postData.hiddenDetails?.trim() || null : null,
    verificationQuestions: postData.type === 'found' ? verificationQuestions : [],
    status: 'open',
    postedBy: user._id,
  });

  // Asynchronously trigger embedding generation and candidate matching
  // Handled with retry queue so post creation never fails because of embedding
  matchingService.processPostEmbeddingAndMatching(post._id).catch((err) => {
    console.warn(`[PostService] Matching error for post ${post._id}:`, err.message);
  });

  const populatedPost = await Post.findById(post._id).populate('postedBy', 'name room email');
  return sanitizePost(populatedPost, user);
};

const getPosts = async (queryParams, user) => {
  const { type, category, spot, status, q, page = 1, limit = 12 } = queryParams;

  // Enforce hostel scoping on every query
  const query = { hostel: user.hostel };

  if (type) query.type = type;
  if (category) query.category = category;
  if (spot) query.spot = spot;
  if (status) {
    query.status = status;
  }

  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    query.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const total = await Post.countDocuments(query);

  const posts = await Post.find(query)
    .populate('postedBy', 'name room email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const sanitizedPosts = posts.map((p) => sanitizePost(p, user));

  return {
    posts: sanitizedPosts,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

const getPostById = async (postId, user) => {
  // Enforce hostel scoping: a post from another hostel cannot be read
  const post = await Post.findOne({
    _id: postId,
    hostel: user.hostel,
  }).populate('postedBy', 'name room email');

  if (!post) {
    const error = new Error('Post not found in your hostel');
    error.statusCode = 404;
    throw error;
  }

  return sanitizePost(post, user);
};

const markReturned = async (postId, user) => {
  // Scoped to user's hostel
  const post = await Post.findOne({
    _id: postId,
    hostel: user.hostel,
  });

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = post.postedBy.toString() === user._id.toString();
  const isWarden = user.role === 'warden';

  if (!isOwner && !isWarden) {
    const error = new Error('Only the author or a warden can mark this item as returned');
    error.statusCode = 403;
    throw error;
  }

  post.status = 'returned';
  await post.save();

  const populated = await Post.findById(post._id).populate('postedBy', 'name room email');
  return sanitizePost(populated, user);
};

const deletePost = async (postId, user) => {
  // Scoped to user's hostel
  const post = await Post.findOne({
    _id: postId,
    hostel: user.hostel,
  });

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = post.postedBy.toString() === user._id.toString();
  const isWarden = user.role === 'warden';

  if (!isOwner && !isWarden) {
    const error = new Error('Only the author or a warden can delete this post');
    error.statusCode = 403;
    throw error;
  }

  // Clean up uploaded files locally
  if (post.images && post.images.length > 0) {
    for (const imgUrl of post.images) {
      try {
        const filename = path.basename(imgUrl);
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Failed to delete image file:', err.message);
      }
    }
  }

  await Post.deleteOne({ _id: postId });
  return { message: 'Post deleted successfully' };
};

const getSpots = async (hostelId) => {
  const hostel = await Hostel.findById(hostelId).select('spots name');
  if (!hostel) {
    const error = new Error('Hostel not found');
    error.statusCode = 404;
    throw error;
  }
  return hostel.spots || [];
};

const getPostMatches = async (postId, user) => {
  // Ensure post belongs to user's hostel
  const post = await Post.findOne({ _id: postId, hostel: user.hostel });
  if (!post) {
    const error = new Error('Post not found in your hostel');
    error.statusCode = 404;
    throw error;
  }
  return matchingService.getMatchesForPost(postId, user.hostel);
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  markReturned,
  deletePost,
  getSpots,
  getPostMatches,
};
