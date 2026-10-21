module.exports = {
  // Configurable weights for scoring components (Phase 2: text 0.7, locationTime 0.3)
  weights: {
    text: 0.7,
    locationTime: 0.3,
    image: 0.0,
  },
  // Threshold above which a Match document is created
  matchThreshold: parseFloat(process.env.MATCH_THRESHOLD || '0.55'),
  // Strong match threshold for high confidence notification/badge
  highThreshold: parseFloat(process.env.HIGH_THRESHOLD || '0.75'),
  // Keep only the top 5 matches per post
  topMatchesLimit: 5,
  // Half-life / decay parameter for time difference: exp(-days / 3)
  timeDecayDays: 3,
  // A found post that predates the lost post by more than 14 days gets a score of 0
  maxPredateDays: 14,
};
