const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');

/**
 * Marks open posts older than 30 days as 'expired'
 */
const expireOldPosts = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await Post.updateMany(
    {
      status: 'open',
      createdAt: { $lte: thirtyDaysAgo },
    },
    {
      $set: { status: 'expired' },
    }
  );

  console.log(`[CronService] Expired ${result.modifiedCount} open posts older than 30 days`);
  return result.modifiedCount;
};

/**
 * Deletes uploaded images of returned posts after 7 days to preserve storage
 */
const cleanupReturnedImages = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const returnedPosts = await Post.find({
    status: 'returned',
    updatedAt: { $lte: sevenDaysAgo },
    'images.0': { $exists: true },
  });

  let deletedImagesCount = 0;

  for (const post of returnedPosts) {
    if (Array.isArray(post.images)) {
      for (const imgUrl of post.images) {
        try {
          const filename = path.basename(imgUrl);
          const localPath = path.join(__dirname, '../../uploads', filename);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            deletedImagesCount++;
          }
        } catch (err) {
          console.warn(`[CronService] Failed to delete file ${imgUrl}:`, err.message);
        }
      }
      post.images = [];
      await post.save();
    }
  }

  console.log(`[CronService] Cleaned up images for ${returnedPosts.length} returned posts (${deletedImagesCount} files deleted)`);
  return { postsCount: returnedPosts.length, filesCount: deletedImagesCount };
};

const runExpiryJob = async () => {
  const expiredCount = await expireOldPosts();
  const cleanupStats = await cleanupReturnedImages();
  return { expiredCount, cleanupStats };
};

/**
 * Initializes the automated daily midnight cron schedule
 */
const initCron = () => {
  // Run daily at midnight (00:00:00)
  const task = cron.schedule('0 0 * * *', async () => {
    console.log('[CronService] Running automated daily post expiry and image cleanup job...');
    try {
      await runExpiryJob();
    } catch (err) {
      console.error('[CronService] Expiry job failed:', err.message);
    }
  });

  console.log('[CronService] Daily midnight post expiry & cleanup cron job scheduled');
  return task;
};

module.exports = {
  expireOldPosts,
  cleanupReturnedImages,
  runExpiryJob,
  initCron,
};
