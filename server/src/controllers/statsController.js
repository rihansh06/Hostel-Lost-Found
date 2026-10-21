const statsService = require('../services/statsService');

const getStats = async (req, res, next) => {
  try {
    const stats = await statsService.getHostelStats(req.user.hostel);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
