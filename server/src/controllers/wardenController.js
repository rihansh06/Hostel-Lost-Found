const wardenService = require('../services/wardenService');

const getPendingUsers = async (req, res, next) => {
  try {
    const users = await wardenService.getPendingUsers(req.user.hostel);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const user = await wardenService.approveUser(req.user.hostel, req.params.id);
    res.status(200).json({
      success: true,
      message: `User ${user.name} approved successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getWardenPosts = async (req, res, next) => {
  try {
    const posts = await wardenService.getWardenPosts(req.user.hostel, req.query);
    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const getMatchBreakdown = async (req, res, next) => {
  try {
    const breakdown = await wardenService.getMatchBreakdown(req.user.hostel, req.params.id);
    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingUsers,
  approveUser,
  getWardenPosts,
  getMatchBreakdown,
};
