const Post = require('../models/Post');
const Match = require('../models/Match');

/**
 * Computes administrative metrics for a hostel
 * @param {string|mongoose.Types.ObjectId} hostelId
 */
const getHostelStats = async (hostelId) => {
  // Aggregate counts strictly scoped to the hostel
  const [
    itemsPosted,
    itemsReturned,
    itemsLost,
    itemsFound,
    itemsOpen,
    itemsClaimPending,
    itemsExpired,
    totalMatches,
  ] = await Promise.all([
    Post.countDocuments({ hostel: hostelId }),
    Post.countDocuments({ hostel: hostelId, status: 'returned' }),
    Post.countDocuments({ hostel: hostelId, type: 'lost' }),
    Post.countDocuments({ hostel: hostelId, type: 'found' }),
    Post.countDocuments({ hostel: hostelId, status: 'open' }),
    Post.countDocuments({ hostel: hostelId, status: 'claim_pending' }),
    Post.countDocuments({ hostel: hostelId, status: 'expired' }),
    Match.countDocuments({ hostel: hostelId }),
  ]);

  // Return rate percentage
  const returnRate = itemsPosted > 0 ? Number(((itemsReturned / itemsPosted) * 100).toFixed(1)) : 0;

  // Average time to return for returned posts (from createdAt to updatedAt)
  const returnedPosts = await Post.find(
    { hostel: hostelId, status: 'returned' },
    { createdAt: 1, updatedAt: 1 }
  );

  let averageTimeToReturnHours = 0;
  let averageTimeToReturnDays = 0;
  let averageTimeToReturnFormatted = 'N/A';

  if (returnedPosts.length > 0) {
    const totalDurationMs = returnedPosts.reduce((sum, post) => {
      const duration = Math.max(0, new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime());
      return sum + duration;
    }, 0);

    const avgMs = totalDurationMs / returnedPosts.length;
    averageTimeToReturnHours = Number((avgMs / (1000 * 60 * 60)).toFixed(1));
    averageTimeToReturnDays = Number((avgMs / (1000 * 60 * 60 * 24)).toFixed(1));

    if (averageTimeToReturnDays >= 1) {
      averageTimeToReturnFormatted = `${averageTimeToReturnDays} day${averageTimeToReturnDays === 1 ? '' : 's'}`;
    } else {
      averageTimeToReturnFormatted = `${averageTimeToReturnHours} hr${averageTimeToReturnHours === 1 ? '' : 's'}`;
    }
  }

  // Category breakdown
  const categoryStats = await Post.aggregate([
    { $match: { hostel: hostelId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const categories = categoryStats.map((item) => ({
    category: item._id,
    count: item.count,
  }));

  return {
    itemsPosted,
    itemsReturned,
    itemsLost,
    itemsFound,
    itemsOpen,
    itemsClaimPending,
    itemsExpired,
    returnRate,
    averageTimeToReturn: {
      hours: averageTimeToReturnHours,
      days: averageTimeToReturnDays,
      formatted: averageTimeToReturnFormatted,
    },
    totalMatches,
    categories,
  };
};

module.exports = {
  getHostelStats,
};
