const mongoose = require('mongoose');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { scorePair } = require('../utils/matchEngine');

const ALLOWED_STATUSES = ['lost', 'found', 'recovered'];
const ALLOWED_CREATE_STATUSES = ['lost', 'found'];

const trimString = (value = '') => (typeof value === 'string' ? value.trim() : '');

const escapeRegExp = (input = '') => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseLocation = (location) => {
  if (!location || typeof location !== 'object') {
    return null;
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const accuracy = Number(location.accuracy || 0);

  const hasValidLat = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
  const hasValidLng = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;

  if (!hasValidLat || !hasValidLng) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0,
  };
};

const buildListQuery = (query) => {
  const filter = {};

  // By default, exclude archived items unless explicitly requested
  if (query.includeArchived !== 'true') {
    filter.archivedAt = { $exists: false };
  }

  if (query.status && ALLOWED_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.campus) {
    filter.campus = trimString(query.campus);
  }

  if (query.category) {
    filter.category = trimString(query.category);
  }

  if (query.keyword) {
    const safeKeyword = escapeRegExp(trimString(query.keyword));
    if (safeKeyword) {
      const keywordRegex = new RegExp(safeKeyword, 'i');
      filter.$or = [{ title: keywordRegex }, { description: keywordRegex }, { locationText: keywordRegex }];
    }
  }

  if (query.dateFrom || query.dateTo) {
    const createdAt = {};

    if (query.dateFrom) {
      const from = new Date(query.dateFrom);
      if (!Number.isNaN(from.valueOf())) {
        createdAt.$gte = from;
      }
    }

    if (query.dateTo) {
      const to = new Date(query.dateTo);
      if (!Number.isNaN(to.valueOf())) {
        createdAt.$lte = to;
      }
    }

    if (Object.keys(createdAt).length) {
      filter.createdAt = createdAt;
    }
  }

  return filter;
};

const notifyPotentialMatches = async (newItem) => {
  const oppositeStatus = newItem.status === 'lost' ? 'found' : 'lost';

  const candidates = await Item.find({
    _id: { $ne: newItem._id },
    status: oppositeStatus,
    campus: newItem.campus,
  })
    .sort({ createdAt: -1 })
    .limit(80);

  const notifications = [];

  candidates.forEach((candidate) => {
    const score = scorePair(newItem, candidate);

    if (score < 0.6) {
      return;
    }

    if (candidate.reportedBy.toString() !== newItem.reportedBy.toString()) {
      notifications.push({
        userId: candidate.reportedBy,
        type: 'match',
        title: 'Potential match found',
        body: `A new ${newItem.status} report may match your item (${Math.round(score * 100)}%).`,
        meta: { itemId: newItem._id, score },
      });
    }

    notifications.push({
      userId: newItem.reportedBy,
      type: 'match',
      title: 'Potential match discovered',
      body: `One of the existing reports looks similar (${Math.round(score * 100)}%).`,
      meta: { itemId: candidate._id, score },
    });
  });

  if (notifications.length) {
    await Notification.insertMany(notifications, { ordered: false });
  }
};

const createItem = async (req, res, next) => {
  try {
    const status = trimString(req.body.status).toLowerCase();
    const title = trimString(req.body.title);
    const description = trimString(req.body.description);
    const category = trimString(req.body.category);
    const campus = trimString(req.body.campus);
    const locationText = trimString(req.body.locationText);
    const imageUrl = trimString(req.body.imageUrl);
    const location = parseLocation(req.body.location);

    if (!ALLOWED_CREATE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status must be either lost or found.' });
    }

    if (title.length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters.' });
    }

    if (description.length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters.' });
    }

    if (!category || !campus) {
      return res.status(400).json({ message: 'Category and campus are required.' });
    }

    const created = await Item.create({
      status,
      title,
      description,
      category,
      campus,
      locationText,
      location,
      imageUrl,
      reportedBy: req.user._id,
    });

    notifyPotentialMatches(created).catch((err) => {
      console.error('Potential match notification failure:', err.message);
    });

    const item = await Item.findById(created._id).populate('reportedBy', '_id name email campus role');
    return res.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
};

const listItems = async (req, res, next) => {
  try {
    const filter = buildListQuery(req.query);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);

    const [items, total] = await Promise.all([
      Item.find(filter)
        .populate('reportedBy', '_id name email campus role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Item.countDocuments(filter),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid item id.' });
    }

    const item = await Item.findById(id).populate('reportedBy', '_id name email campus role');
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    return res.json({ item });
  } catch (error) {
    return next(error);
  }
};

const markRecovered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed to update this item.' });
    }

    if (item.status !== 'recovered') {
      item.status = 'recovered';
      item.recoveredAt = new Date();
      await item.save();
    }

    return res.json({ item });
  } catch (error) {
    return next(error);
  }
};

const flagItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot flag your own report.' });
    }

    item.flagged = true;
    item.flagReason = trimString(req.body.reason) || 'User flagged this report';
    item.flaggedBy = req.user._id;
    item.reviewStatus = 'not_reviewed';
    item.reviewedBy = null;
    item.reviewedAt = null;
    await item.save();

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: item.reportedBy,
        type: 'moderation',
        title: 'Your report was flagged',
        body: 'A user flagged your item report. Admin review may follow.',
        meta: { itemId: item._id },
      });
    }

    return res.json({ item });
  } catch (error) {
    return next(error);
  }
};

const getFlaggedItems = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);

    const [items, total] = await Promise.all([
      Item.find({ flagged: true })
        .populate('reportedBy', '_id name email campus role')
        .populate('flaggedBy', '_id name email campus role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Item.countDocuments({ flagged: true }),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const reviewFlaggedItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const action = trimString(req.body.action).toLowerCase();
    const note = trimString(req.body.note);

    if (!['clear', 'keep'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either clear or keep.' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (action === 'clear') {
      item.flagged = false;
      item.flagReason = '';
      item.flaggedBy = null;
      item.reviewStatus = 'reviewed_clear';
    } else {
      item.flagged = true;
      item.reviewStatus = 'reviewed_keep';
    }

    item.reviewNote = note;
    item.reviewedBy = req.user._id;
    item.reviewedAt = new Date();

    await item.save();

    if (item.reportedBy?.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: item.reportedBy,
        type: 'moderation',
        title: action === 'clear' ? 'Report approved' : 'Report needs attention',
        body:
          action === 'clear'
            ? 'Admin reviewed your flagged report and kept it active.'
            : 'Admin reviewed your report and marked it for further attention.',
        meta: { itemId: item._id },
      });
    }

    return res.json({ item });
  } catch (error) {
    return next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    await item.deleteOne();
    return res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

const getPotentialMatches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const targetStatus = item.status === 'lost' ? 'found' : 'lost';

    const candidates = await Item.find({
      _id: { $ne: item._id },
      status: targetStatus,
      campus: item.campus,
      category: item.category,
    })
      .populate('reportedBy', '_id name email campus role')
      .sort({ createdAt: -1 })
      .limit(80);

    const matches = candidates
      .map((candidate) => ({ item: candidate, score: scorePair(item, candidate) }))
      .filter((entry) => entry.score >= 0.45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return res.json({ matches });
  } catch (error) {
    return next(error);
  }
};

const getAdminStats = async (_req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalReports,
      lostReports,
      foundReports,
      recoveredReports,
      flaggedReports,
      todayReports,
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ status: 'lost' }),
      Item.countDocuments({ status: 'found' }),
      Item.countDocuments({ status: 'recovered' }),
      Item.countDocuments({ flagged: true }),
      Item.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    return res.json({
      stats: {
        totalUsers,
        totalReports,
        lostReports,
        foundReports,
        recoveredReports,
        flaggedReports,
        todayReports,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createItem,
  listItems,
  getItemById,
  markRecovered,
  flagItem,
  getFlaggedItems,
  reviewFlaggedItem,
  deleteItem,
  getPotentialMatches,
  getAdminStats,
};
