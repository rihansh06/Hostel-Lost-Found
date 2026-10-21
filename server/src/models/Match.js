const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true,
    },
    lostPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    foundPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    textScore: {
      type: Number,
      default: 0,
    },
    imageScore: {
      type: Number,
      default: 0,
    },
    locationTimeScore: {
      type: Number,
      default: 0,
    },
    finalScore: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['suggested', 'dismissed', 'claimed'],
      default: 'suggested',
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique index on Match (lostPost, foundPost)
matchSchema.index({ lostPost: 1, foundPost: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
