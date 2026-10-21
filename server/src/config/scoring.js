/**
 * Scoring Configuration & Weight Allocation
 *
 * Primary Weights:
 * - text: 0.5 (Cosine similarity of dense text embeddings via Xenova/all-MiniLM-L6-v2)
 * - image: 0.3 (Cosine similarity of visual feature embeddings via Xenova/clip-vit-base-patch32)
 * - locationTime: 0.2 (Hostel spot adjacency and exponential time difference decay)
 *
 * Weight Redistribution Rule:
 * When both posts have uploaded images, the full [0.5, 0.3, 0.2] weights are applied.
 * When either or both posts do not have images, the 0.3 image weight is redistributed
 * proportionally between text and locationTime:
 *   - textWeight = 0.5 / (0.5 + 0.2) = 0.5 / 0.7 ≈ 0.7143 (71.4%)
 *   - locationTimeWeight = 0.2 / (0.5 + 0.2) = 0.2 / 0.7 ≈ 0.2857 (28.6%)
 */
module.exports = {
  // Baseline component weights when image data is available on both items
  weights: {
    text: 0.5,
    image: 0.3,
    locationTime: 0.2,
  },

  // Fallback redistributed weights when image data is unavailable
  fallbackWeights: {
    text: Number((0.5 / 0.7).toFixed(4)), // ~0.7143
    locationTime: Number((0.2 / 0.7).toFixed(4)), // ~0.2857
  },

  // Threshold above which a Match document is created (default 0.55)
  matchThreshold: parseFloat(process.env.MATCH_THRESHOLD || '0.55'),

  // Threshold for "High" confidence matches (used for real-time notifications in Phase 4)
  highThreshold: parseFloat(process.env.HIGH_THRESHOLD || '0.75'),

  // Keep only the top 5 matches per post
  topMatchesLimit: 5,

  // Half-life / decay parameter for time difference: exp(-days / 3)
  timeDecayDays: 3,

  // A found post that predates the lost post by more than 14 days gets a score of 0
  maxPredateDays: 14,
};
