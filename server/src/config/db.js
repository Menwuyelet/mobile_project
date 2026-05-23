const mongoose = require('mongoose');

const cleanupLegacyUserIndexes = async () => {
  const User = require('../models/User');
  const hasUsernameInSchema = Boolean(User.schema.path('username'));
  if (hasUsernameInSchema) {
    return;
  }

  const indexNames = (await User.collection.indexes()).map((index) => index.name);
  if (indexNames.includes('username_1')) {
    await User.collection.dropIndex('username_1');
    console.log('Dropped legacy users.username_1 index');
  }
};

const syncModelIndexes = async () => {
  const models = [
    require('../models/User'),
    require('../models/Item'),
    require('../models/Message'),
    require('../models/Notification'),
    require('../models/NotificationToken'),
  ];

  for (const model of models) {
    await model.syncIndexes();
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required in environment.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
  });

  try {
    await cleanupLegacyUserIndexes();
  } catch (error) {
    console.warn('Legacy user index cleanup skipped due to error:', error.message);
  }

  const shouldSyncIndexes =
    process.env.SYNC_INDEXES === 'true' || (process.env.SYNC_INDEXES !== 'false' && process.env.NODE_ENV !== 'production');

  if (shouldSyncIndexes) {
    try {
      await syncModelIndexes();
      console.log('MongoDB indexes synced');
    } catch (error) {
      console.warn('MongoDB index sync skipped due to error:', error.message);
    }
  }

  console.log('MongoDB connected');
};

module.exports = connectDB;
