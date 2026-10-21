const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const { generateToken } = require('../utils/jwt');

const register = async ({ name, email, password, room, inviteCode }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Look up hostel by invite code (case-insensitive)
  const hostel = await Hostel.findOne({
    inviteCode: inviteCode.trim().toUpperCase(),
  });

  if (!hostel) {
    const error = new Error('Invalid hostel invite code. Please check with your hostel warden.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // New residents start unapproved by default
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    hostel: hostel._id,
    room: room.trim(),
    role: 'resident',
    approved: false,
    claimStrikes: 0,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    room: user.room,
    role: user.role,
    approved: user.approved,
    hostelName: hostel.name,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('hostel', 'name spots inviteCode');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Reject unapproved residents
  if (!user.approved) {
    const error = new Error('Your account is pending warden approval');
    error.statusCode = 403;
    error.pendingApproval = true;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      room: user.room,
      role: user.role,
      approved: user.approved,
      hostel: {
        id: user.hostel._id,
        name: user.hostel.name,
        spots: user.hostel.spots,
      },
    },
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId)
    .select('-passwordHash')
    .populate('hostel', 'name spots inviteCode');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    room: user.room,
    role: user.role,
    approved: user.approved,
    claimStrikes: user.claimStrikes,
    hostel: {
      id: user.hostel._id,
      name: user.hostel.name,
      spots: user.hostel.spots,
      inviteCode: user.role === 'warden' ? user.hostel.inviteCode : undefined,
    },
  };
};

module.exports = {
  register,
  login,
  getMe,
};
