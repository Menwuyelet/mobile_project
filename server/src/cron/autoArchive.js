const Item = require('../models/Item');

async function autoArchiveExpiredItems() {
  try {
    const now = new Date();

    // Archive only active lost/found reports whose expiry date has passed.
    const result = await Item.updateMany(
      {
        archivedAt: { $lte: now },
        status: { $in: ['lost', 'found'] },
      },
      {
        $set: {
          status: 'archived',
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[${now.toISOString()}] Auto-archived ${result.modifiedCount} expired items`);
    }
  } catch (error) {
    console.error('Error in auto archive cron job:', error);
  }
}

module.exports = { autoArchiveExpiredItems };
