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
  // Bound to [0, 1] for text similarity
  return Math.max(0, Math.min(1, similarity));
};

/**
 * Adjacency mapping helper between common hostel spots
 */
const DEFAULT_SPOT_ADJACENCY = {
  'Mess / Dining Hall': ['Common Room'],
  'Common Room': ['Mess / Dining Hall', '1st Floor Corridor'],
  '1st Floor Corridor': ['Common Room', 'Laundry Room'],
  'Library / Study Area': ['1st Floor Corridor'],
  'Gym & Sports Complex': ['Common Room'],
  'Laundry Room': ['1st Floor Corridor'],
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
    } else {
      const adjacentSpots = DEFAULT_SPOT_ADJACENCY[lostSpot] || [];
      const isAdjacent = adjacentSpots.some(
        (adj) => adj.toLowerCase() === foundSpot.toLowerCase()
      );
      if (isAdjacent) {
        locScore = 0.5;
      }
    }
  }

  const score = locScore * timeDecay;
  return Number(Math.max(0, Math.min(1, score)).toFixed(4));
};

/**
 * Computes weighted final match score between a lost post and a found post
 */
const computeFinalScore = (lostPost, foundPost, hostel = null) => {
  // Ensure lost and found posts are ordered correctly
  const lost = lostPost.type === 'lost' ? lostPost : foundPost;
  const found = foundPost.type === 'found' ? foundPost : lostPost;

  // 1. Text Similarity Score
  const textScore = cosineSimilarity(lost.textEmbedding, found.textEmbedding);

  // 2. Location-Time Score
  const locTimeScore = locationTimeScore(lost, found, hostel);

  // 3. Image Score (Phase 3 optional, 0.0 for now)
  const imageScore = 0;

  // 4. Weighted Final Score
  const weights = config.weights;
  const finalScore = Number(
    (textScore * weights.text + locTimeScore * weights.locationTime).toFixed(4)
  );

  return {
    textScore: Number(textScore.toFixed(4)),
    imageScore,
    locationTimeScore: locTimeScore,
    finalScore,
  };
};

module.exports = {
  cosineSimilarity,
  locationTimeScore,
  computeFinalScore,
};
