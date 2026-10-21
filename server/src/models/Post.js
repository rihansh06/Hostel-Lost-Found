const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['electronics', 'clothing', 'keys', 'bottle', 'documents', 'other'],
      required: true,
    },
    spot: {
      type: String,
      required: true,
      trim: true,
    },
    happenedAt: {
      type: Date,
      default: Date.now,
    },
    images: {
      type: [String],
      default: [],
    },
    // Sensitive verification fields: only visible to poster and warden
    hiddenDetails: {
      type: String,
      trim: true,
      default: null,
    },
    verificationQuestions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'matched', 'claim_pending', 'returned', 'expired'],
      default: 'open',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    textEmbedding: {
      type: [Number],
      default: [],
    },
    imageEmbedding: {
      type: [Number],
      default: [],
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes specified in prompt
postSchema.index({ title: 'text', description: 'text' });
postSchema.index({ hostel: 1, type: 1, status: 1 });

module.exports = mongoose.model('Post', postSchema);
