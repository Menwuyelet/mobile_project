const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['lost', 'found', 'recovered', 'archived'],
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
      required: true,
      trim: true,
    },
    campus: {
      type: String,
      required: true,
      trim: true,
    },
    locationText: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewStatus: {
      type: String,
      enum: ['not_reviewed', 'reviewed_clear', 'reviewed_keep'],
      default: 'not_reviewed',
    },
    reviewNote: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    recoveredAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      index: true
    },
  },
  { timestamps: true }
);

itemSchema.index({ title: 'text', description: 'text', category: 'text', campus: 'text' });
itemSchema.index({ status: 1, campus: 1, category: 1, createdAt: -1 });
itemSchema.index({ flagged: 1, createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);
