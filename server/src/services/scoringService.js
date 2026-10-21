const config = require('../config/scoring');

/**
 * Computes standard Cosine Similarity between two numeric vectors
 */
const cosineSimilarity = (a, b) => {
  if (!a || !b || !Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
};

/**
 * Default fallback adjacency mapping between common hostel spots
 */
const DEFAULT_SPOT_ADJACENCY = {
  'Mess / Dining Hall': ['Common Room'],
  'Common Room': ['Mess / Dining Hall', '1st Floor Corridor'],
  '1st Floor Corridor': ['Common Room', 'Laundry Room', 'Library / Study Area'],
  'Library / Study Area': ['1st Floor Corridor'],
  'Gym & Sports Complex': ['Common Room'],
  'Laundry Room': ['1st Floor Corridor'],
};

/**
 * Checks whether spotB is adjacent to spotA using hostel definition or defaults
 */
const areSpotsAdjacent = (spotA, spotB, hostel = null) => {
  if (!spotA || !spotB) return false;
  const sA = spotA.trim().toLowerCase();
  const sB = spotB.trim().toLowerCase();

  // 1. Check hostel model's custom spotAdjacency map if available
  if (hostel && hostel.spotAdjacency) {
    const adjMap = hostel.spotAdjacency instanceof Map
      ? Object.fromEntries(hostel.spotAdjacency)
      : hostel.spotAdjacency;

    for (const [key, neighbors] of Object.entries(adjMap)) {
      if (key.trim().toLowerCase() === sA && Array.isArray(neighbors)) {
        if (neighbors.some((n) => (n || '').trim().toLowerCase() === sB)) {
          return true;
        }
      }
    }
  }

  // 2. Check default fallback adjacency
  for (const [key, neighbors] of Object.entries(DEFAULT_SPOT_ADJACENCY)) {
    if (key.trim().toLowerCase() === sA && Array.isArray(neighbors)) {
      if (neighbors.some((n) => (n || '').trim().toLowerCase() === sB)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Calculates location and time compatibility score:
 * - 1.0 for identical spot
 * - 0.5 for adjacent spot in the hostel
 * - 0.2 for other spots in the same hostel
 * - Time decay: exp(-abs(days) / 3)
 * - Rule: If a found post predates the lost post by > 14 days, score is strictly 0
 */
const locationTimeScore = (lostPost, foundPost, hostel = null) => {
  if (!lostPost || !foundPost) return 0;

  const lostDate = new Date(lostPost.happenedAt || lostPost.createdAt || Date.now());
  const foundDate = new Date(foundPost.happenedAt || foundPost.createdAt || Date.now());

  const diffMs = foundDate.getTime() - lostDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Critical rule: If found item was found > 14 days BEFORE the item was reported lost, impossible match
  if (diffDays < -config.maxPredateDays) {
    return 0;
  }

  // Absolute difference in days for exponential decay
  const absDays = Math.abs(diffDays);
  const timeDecay = Math.exp(-absDays / config.timeDecayDays);

  // Location component
  const lostSpot = (lostPost.spot || '').trim();
  const foundSpot = (foundPost.spot || '').trim();

  let locScore = 0.2; // Baseline score for being in the same hostel
  if (lostSpot && foundSpot) {
    if (lostSpot.toLowerCase() === foundSpot.toLowerCase()) {
      locScore = 1.0;
    } else if (areSpotsAdjacent(lostSpot, foundSpot, hostel)) {
      locScore = 0.5;
    }
  }

  const score = locScore * timeDecay;
  return Number(Math.max(0, Math.min(1, score)).toFixed(4));
};

/**
 * Computes weighted final match score between a lost post and a found post.
 *
 * Weight Redistribution:
 * - If both posts have image embeddings:
 *   weights: { text: 0.5, image: 0.3, locationTime: 0.2 }
 * - If either/both lack image embeddings:
 *   redistributed weights: { text: ~0.7143, locationTime: ~0.2857 }
 */
const computeFinalScore = (lostPost, foundPost, hostel = null) => {
  const lost = lostPost.type === 'lost' ? lostPost : foundPost;
  const found = foundPost.type === 'found' ? foundPost : lostPost;

  // 1. Text Similarity Score
  const textScore = cosineSimilarity(lost.textEmbedding, found.textEmbedding);

  // 2. Location-Time Score
  const locTimeScore = locationTimeScore(lost, found, hostel);

  // 3. Image Score
  const hasLostImage = Array.isArray(lost.imageEmbedding) && lost.imageEmbedding.length > 0;
  const hasFoundImage = Array.isArray(found.imageEmbedding) && found.imageEmbedding.length > 0;
  const hasBothImages = hasLostImage && hasFoundImage;

  let imageScore = 0;
  let finalScore = 0;
  let weightsUsed = {};

  if (hasBothImages) {
    imageScore = cosineSimilarity(lost.imageEmbedding, found.imageEmbedding);
    const { text, image, locationTime } = config.weights;
    finalScore = (textScore * text) + (imageScore * image) + (locTimeScore * locationTime);
    weightsUsed = {
      text,
      image,
      locationTime,
      redistributed: false,
    };
  } else {
    // Redistribute the 0.3 image weight proportionally between text and locationTime
    const { text, locationTime } = config.fallbackWeights;
    finalScore = (textScore * text) + (locTimeScore * locationTime);
    weightsUsed = {
      text,
      image: 0.0,
      locationTime,
      redistributed: true,
    };
  }

  return {
    textScore: Number(textScore.toFixed(4)),
    imageScore: Number(imageScore.toFixed(4)),
    hasBothImages,
    locationTimeScore: locTimeScore,
    finalScore: Number(Math.max(0, Math.min(1, finalScore)).toFixed(4)),
    weightsUsed,
  };
};

/**
 * Detailed score breakdown helper for Warden Admin/Debug inspection
 */
const getDetailedScoreBreakdown = (lostPost, foundPost, match = null, hostel = null) => {
  const lost = lostPost.type === 'lost' ? lostPost : foundPost;
  const found = foundPost.type === 'found' ? foundPost : lostPost;

  const lostDate = new Date(lost.happenedAt || lost.createdAt || Date.now());
  const foundDate = new Date(found.happenedAt || found.createdAt || Date.now());
  const diffDays = Number(((foundDate.getTime() - lostDate.getTime()) / (1000 * 60 * 60 * 24)).toFixed(2));
  const isPredateDisqualified = diffDays < -config.maxPredateDays;

  const lostSpot = (lost.spot || '').trim();
  const foundSpot = (found.spot || '').trim();
  const isSameSpot = lostSpot.toLowerCase() === foundSpot.toLowerCase();
  const isAdjacentSpot = !isSameSpot && areSpotsAdjacent(lostSpot, foundSpot, hostel);

  const locScore = isSameSpot ? 1.0 : isAdjacentSpot ? 0.5 : 0.2;
  const timeDecay = isPredateDisqualified ? 0 : Number(Math.exp(-Math.abs(diffDays) / config.timeDecayDays).toFixed(4));

  const scoreResult = computeFinalScore(lost, found, hostel);

  return {
    matchId: match?._id || null,
    lostPost: {
      id: lost._id,
      title: lost.title,
      category: lost.category,
      spot: lost.spot,
      happenedAt: lostDate,
      hasImages: Array.isArray(lost.images) && lost.images.length > 0,
      hasImageEmbedding: Array.isArray(lost.imageEmbedding) && lost.imageEmbedding.length > 0,
    },
    foundPost: {
      id: found._id,
      title: found.title,
      category: found.category,
      spot: found.spot,
      happenedAt: foundDate,
      hasImages: Array.isArray(found.images) && found.images.length > 0,
      hasImageEmbedding: Array.isArray(found.imageEmbedding) && found.imageEmbedding.length > 0,
    },
    scoringBreakdown: {
      textScore: scoreResult.textScore,
      imageScore: scoreResult.imageScore,
      hasBothImages: scoreResult.hasBothImages,
      locationTimeScore: {
        score: scoreResult.locationTimeScore,
        baseLocationScore: locScore,
        spotRelation: isSameSpot ? 'Identical' : isAdjacentSpot ? 'Adjacent' : 'Same Hostel',
        diffDays,
        timeDecayFactor: timeDecay,
        isPredateDisqualified,
      },
      weightsApplied: scoreResult.weightsUsed,
      finalScore: scoreResult.finalScore,
      threshold: config.matchThreshold,
      isAboveThreshold: scoreResult.finalScore >= config.matchThreshold,
      confidenceBadge:
        scoreResult.finalScore >= config.highThreshold
          ? 'High'
          : scoreResult.finalScore >= 0.60
          ? 'Medium'
          : 'Low',
    },
  };
};

module.exports = {
  cosineSimilarity,
  locationTimeScore,
  areSpotsAdjacent,
  computeFinalScore,
  getDetailedScoreBreakdown,
  DEFAULT_SPOT_ADJACENCY,
};
