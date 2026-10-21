const mongoose = require('mongoose');
const Post = require('../models/Post');
const Match = require('../models/Match');
const Hostel = require('../models/Hostel');
const config = require('../config/scoring');
const embeddingService = require('./embeddingService');
const imageEmbeddingService = require('./imageEmbeddingService');
const scoringService = require('./scoringService');
const notificationService = require('./notificationService');

// In-memory retry queue for posts whose embeddings failed on creation
let retryQueue = [];
let isProcessingQueue = false;
let queueTimeoutId = null;

/**
 * Enqueue a post for background embedding retry
 */
const enqueueRetry = (postId, attempt = 1) => {
  if (process.env.NODE_ENV === 'test') {
    // In test environment, skip background setTimeout retries
    return;
  }

  if (attempt > 5) {
    console.warn(`[MatchingService] Max retry attempts exceeded for post ${postId}`);
    return;
  }
  console.log(`[MatchingService] Enqueuing post ${postId} for embedding retry (attempt ${attempt})`);
  retryQueue.push({ postId, attempt, nextRetryAt: Date.now() + attempt * 5000 });

  if (!isProcessingQueue) {
    scheduleQueueProcessor();
  }
};

const scheduleQueueProcessor = () => {
  if (process.env.NODE_ENV === 'test') return;

  isProcessingQueue = true;
  queueTimeoutId = setTimeout(async () => {
    if (mongoose.connection.readyState !== 1) {
      isProcessingQueue = false;
      return;
    }

    const now = Date.now();
    const readyItems = retryQueue.filter((item) => item.nextRetryAt <= now);

    for (const item of readyItems) {
      const idx = retryQueue.indexOf(item);
      if (idx !== -1) retryQueue.splice(idx, 1);

      try {
        await processPostEmbeddingAndMatching(item.postId);
      } catch (err) {
        console.warn(`[MatchingService] Retry failed for post ${item.postId}:`, err.message);
        enqueueRetry(item.postId, item.attempt + 1);
      }
    }

    if (retryQueue.length > 0) {
      scheduleQueueProcessor();
    } else {
      isProcessingQueue = false;
    }
  }, 3000);

  if (queueTimeoutId && typeof queueTimeoutId.unref === 'function') {
    queueTimeoutId.unref();
  }
};

const clearRetryQueue = () => {
  retryQueue = [];
  isProcessingQueue = false;
  if (queueTimeoutId) {
    clearTimeout(queueTimeoutId);
    queueTimeoutId = null;
  }
};

/**
 * Computes embedding and updates Match documents for a given post
 */
const processPostEmbeddingAndMatching = async (postId) => {
  if (mongoose.connection.readyState !== 1) return;

  const post = await Post.findById(postId);
  if (!post) return;

  // 1. Generate text embedding if not already present
  if (!post.textEmbedding || post.textEmbedding.length === 0) {
    try {
      const embedding = await embeddingService.getPostTextEmbedding(post);
      post.textEmbedding = embedding;
      await post.save();
      console.log(`[MatchingService] Generated text embedding for post ${post._id}`);
    } catch (err) {
      console.warn(`[MatchingService] Embedding generation failed for post ${post._id}:`, err.message);
      enqueueRetry(post._id);
      return; // Stop matching until embedding succeeds
    }
  }

  // 2. Generate image embedding if post has images and embedding is missing
  if (post.images && post.images.length > 0 && (!post.imageEmbedding || post.imageEmbedding.length === 0)) {
    try {
      const imgEmbedding = await imageEmbeddingService.getImageEmbedding(post.images[0]);
      if (imgEmbedding && imgEmbedding.length > 0) {
        post.imageEmbedding = imgEmbedding;
        await post.save();
        console.log(`[MatchingService] Generated visual feature embedding for post ${post._id}`);
      }
    } catch (imgErr) {
      console.warn(`[MatchingService] Image embedding skipped for post ${post._id}:`, imgErr.message);
    }
  }

  // 3. Perform pairwise matching against opposite type posts
  await findAndSaveMatches(post);
};

/**
 * Compares post with all open opposite-type posts in the same hostel
 */
const findAndSaveMatches = async (post) => {
  if (!post.textEmbedding || post.textEmbedding.length === 0) {
    return [];
  }

  const hostel = await Hostel.findById(post.hostel);
  const oppositeType = post.type === 'lost' ? 'found' : 'lost';

  // Category compatible: same category or 'other'
  const categoryFilter =
    post.category === 'other'
      ? {}
      : { category: { $in: [post.category, 'other'] } };

  const candidates = await Post.find({
    hostel: post.hostel,
    type: oppositeType,
    status: 'open',
    _id: { $ne: post._id },
    textEmbedding: { $exists: true, $ne: [] },
    ...categoryFilter,
  });

  const createdMatches = [];

  for (const candidate of candidates) {
    const lostPost = post.type === 'lost' ? post : candidate;
    const foundPost = post.type === 'found' ? post : candidate;

    const scores = scoringService.computeFinalScore(lostPost, foundPost, hostel);

    if (scores.finalScore >= config.matchThreshold) {
      // Upsert match document with unique compound key
      const matchDoc = await Match.findOneAndUpdate(
        {
          lostPost: lostPost._id,
          foundPost: foundPost._id,
        },
        {
          hostel: post.hostel,
          lostPost: lostPost._id,
          foundPost: foundPost._id,
          textScore: scores.textScore,
          imageScore: scores.imageScore,
          locationTimeScore: scores.locationTimeScore,
          finalScore: scores.finalScore,
          status: 'suggested',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Real-time notification for strong matches (finalScore >= HIGH_THRESHOLD)
      if (scores.finalScore >= config.highThreshold && !matchDoc.notifiedAt) {
        matchDoc.notifiedAt = new Date();
        await matchDoc.save();

        if (lostPost.postedBy) {
          notificationService.createAndEmitNotification({
            userId: lostPost.postedBy,
            type: 'strong_match',
            message: `High confidence match (${Math.round(scores.finalScore * 100)}%) found for your item: "${lostPost.title}"`,
            link: `/posts/${lostPost._id}`,
          });
        }
        if (foundPost.postedBy) {
          notificationService.createAndEmitNotification({
            userId: foundPost.postedBy,
            type: 'strong_match',
            message: `High confidence match (${Math.round(scores.finalScore * 100)}%) found for your item: "${foundPost.title}"`,
            link: `/posts/${foundPost._id}`,
          });
        }
      }

      createdMatches.push(matchDoc);
    }
  }

  // Enforce rule: Keep only the top 5 matches per post
  await pruneTopMatches(post._id);

  return createdMatches;
};

/**
 * Keeps only the top 5 matches by finalScore for a post
 */
const pruneTopMatches = async (postId) => {
  const allMatches = await Match.find({
    $or: [{ lostPost: postId }, { foundPost: postId }],
  }).sort({ finalScore: -1 });

  if (allMatches.length > config.topMatchesLimit) {
    const toRemove = allMatches.slice(config.topMatchesLimit);
    const idsToRemove = toRemove.map((m) => m._id);
    await Match.deleteMany({ _id: { $in: idsToRemove } });
  }
};

/**
 * Generate human-readable match reason based on score components
 */
const getMatchReason = (textScore, locationTimeScore, finalScore, imageScore = 0) => {
  if (imageScore >= 0.70 && textScore >= 0.60) {
    return 'Matching photo features and strong description similarity';
  }
  if (textScore >= 0.75 && locationTimeScore >= 0.75) {
    return 'High description similarity & matching location';
  }
  if (textScore >= 0.70) {
    return 'Very similar item description';
  }
  if (locationTimeScore >= 0.80) {
    return 'Reported at the same hostel spot in close timeframe';
  }
  if (textScore >= 0.55 && locationTimeScore >= 0.50) {
    return 'Matching item details and nearby hostel location';
  }
  return 'Possible match based on item description and spot';
};

/**
 * Fetch top matches for a post, including opposite item details and scores
 */
const getMatchesForPost = async (postId, hostelId) => {
  const matches = await Match.find({
    hostel: hostelId,
    $or: [{ lostPost: postId }, { foundPost: postId }],
  })
    .populate({
      path: 'lostPost',
      select: 'title description category spot happenedAt images status postedBy',
      populate: { path: 'postedBy', select: 'name room email' },
    })
    .populate({
      path: 'foundPost',
      select: 'title description category spot happenedAt images status postedBy verificationQuestions',
      populate: { path: 'postedBy', select: 'name room email' },
    })
    .sort({ finalScore: -1 })
    .limit(config.topMatchesLimit);

  // Format matches from the perspective of the current post
  return matches.map((m) => {
    const isCurrentPostLost = m.lostPost._id.toString() === postId.toString();
    const oppositePost = isCurrentPostLost ? m.foundPost : m.lostPost;

    // Confidence badge: High, Medium, Low
    let confidence = 'Low';
    if (m.finalScore >= config.highThreshold) {
      confidence = 'High';
    } else if (m.finalScore >= 0.60) {
      confidence = 'Medium';
    }

    return {
      matchId: m._id,
      finalScore: m.finalScore,
      textScore: m.textScore,
      imageScore: m.imageScore,
      locationTimeScore: m.locationTimeScore,
      confidence,
      reason: getMatchReason(m.textScore, m.locationTimeScore, m.finalScore, m.imageScore),
      status: m.status,
      oppositePost,
    };
  });
};

module.exports = {
  processPostEmbeddingAndMatching,
  findAndSaveMatches,
  getMatchesForPost,
  getMatchReason,
  enqueueRetry,
  clearRetryQueue,
};
