const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing',
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    if (!user.approved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending warden approval',
        pendingApproval: true,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

const requireWarden = (req, res, next) => {
  if (!req.user || req.user.role !== 'warden') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Warden privileges required',
    });
  }
  next();
};

module.exports = {
  protect,
  requireWarden,
};
