const Item = require('../models/Item');

async function autoArchiveExpiredItems() {
  try {
    const now = new Date();
    
    // Find items that should be archived (archivedAt is in the past and item is not already archived)
    const result = await Item.updateMany(
      {
        archivedAt: { $lte: now },
        $or: [
          { archivedAt: { $exists: true } },
          { status: { $in: ['lost', 'found'] } } // Only archive active lost/found items
        ]
      },
      {
        $set: {
          status: 'archived'
        }
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