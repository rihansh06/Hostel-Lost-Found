const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const Hostel = require('../src/models/Hostel');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Claim = require('../src/models/Claim');
const Notification = require('../src/models/Notification');
const cronService = require('../src/services/cronService');
const { generateToken } = require('../src/utils/jwt');

describe('PHASE 4 Claims, Notifications & Expiry Tests', () => {
  let hostel;
  let warden;
  let finder;
  let claimant;
  let anotherResident;

  let wardenToken;
  let finderToken;
  let claimantToken;
  let anotherResidentToken;

  let foundPost;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_lost_found_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([
      Hostel.deleteMany({}),
      User.deleteMany({}),
      Post.deleteMany({}),
      Claim.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    hostel = await Hostel.create({
      name: 'Cauvery Hostel',
      inviteCode: 'HOSTEL2026',
      spots: ['Common Room', 'Dining Hall', 'Library'],
    });

    const pwd = await bcrypt.hash('Password123!', 6);

    warden = await User.create({
      name: 'Warden Ramesh',
      email: 'warden@test.com',
      passwordHash: pwd,
      hostel: hostel._id,
      room: 'W-01',
      role: 'warden',
      approved: true,
      claimStrikes: 0,
    });

    finder = await User.create({
      name: 'Finder Rohit',
      email: 'rohit@test.com',
      passwordHash: pwd,
      hostel: hostel._id,
      room: 'B-205',
      role: 'resident',
      approved: true,
      claimStrikes: 0,
    });

    claimant = await User.create({
      name: 'Claimant Aarav',
      email: 'aarav@test.com',
      passwordHash: pwd,
      hostel: hostel._id,
      room: 'A-102',
      role: 'resident',
      approved: true,
      claimStrikes: 0,
    });

    anotherResident = await User.create({
      name: 'Resident Priya',
      email: 'priya@test.com',
      passwordHash: pwd,
      hostel: hostel._id,
      room: 'C-310',
      role: 'resident',
      approved: true,
      claimStrikes: 0,
    });

    wardenToken = generateToken(warden._id);
    finderToken = generateToken(finder._id);
    claimantToken = generateToken(claimant._id);
    anotherResidentToken = generateToken(anotherResident._id);

    // Create a found post with verification questions and secret details
    foundPost = await Post.create({
      hostel: hostel._id,
      type: 'found',
      title: 'Found Apple AirPods Case',
      description: 'Blue silicone cover found in common room sofa',
      category: 'electronics',
      spot: 'Common Room',
      postedBy: finder._id,
      hiddenDetails: 'Serial ending in 981, engraved with letter A',
      verificationQuestions: [
        'What brand is the case?',
        'Is there any engraved letter inside?',
      ],
      status: 'open',
    });
  });

  describe('Claim Submission Rules & Rate Limiting', () => {
    it('prohibits a user from claiming their own post', async () => {
      const res = await request(app)
        .post(`/api/posts/${foundPost._id}/claims`)
        .set('Authorization', `Bearer ${finderToken}`)
        .send({
          answers: [
            { question: 'What brand is the case?', answer: 'Apple' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot claim an item that you posted');
    });

    it('submits a valid claim, sets post to claim_pending, and emits notification', async () => {
      const res = await request(app)
        .post(`/api/posts/${foundPost._id}/claims`)
        .set('Authorization', `Bearer ${claimantToken}`)
        .send({
          answers: [
            { question: 'What brand is the case?', answer: 'Apple AirPods' },
            { question: 'Is there any engraved letter inside?', answer: 'Letter A' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify post status updated
      const updatedPost = await Post.findById(foundPost._id);
      expect(updatedPost.status).toBe('claim_pending');

      // Verify notification was sent to finder
      const notif = await Notification.findOne({ user: finder._id });
      expect(notif).toBeDefined();
      expect(notif.type).toBe('claim_received');
    });

    it('enforces rate limit of maximum 3 claims per user per 24 hours', async () => {
      // Create 3 extra posts
      for (let i = 1; i <= 3; i++) {
        const p = await Post.create({
          hostel: hostel._id,
          type: 'found',
          title: `Item ${i}`,
          description: `Desc ${i}`,
          category: 'other',
          spot: 'Common Room',
          postedBy: finder._id,
          verificationQuestions: ['Q?'],
        });

        await request(app)
          .post(`/api/posts/${p._id}/claims`)
          .set('Authorization', `Bearer ${claimantToken}`)
          .send({ answers: [{ question: 'Q?', answer: 'Ans' }] });
      }

      // 4th claim attempt within 24 hours must be rejected with 429
      const fourthPost = await Post.create({
        hostel: hostel._id,
        type: 'found',
        title: 'Item 4',
        description: 'Desc 4',
        category: 'other',
        spot: 'Common Room',
        postedBy: finder._id,
        verificationQuestions: ['Q?'],
      });

      const res = await request(app)
        .post(`/api/posts/${fourthPost._id}/claims`)
        .set('Authorization', `Bearer ${claimantToken}`)
        .send({ answers: [{ question: 'Q?', answer: 'Ans' }] });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Daily claim limit reached');
    });

    it('blocks claiming if user has accumulated 3 strikes', async () => {
      // Set claimant strikes to 3
      claimant.claimStrikes = 3;
      await claimant.save();

      const res = await request(app)
        .post(`/api/posts/${foundPost._id}/claims`)
        .set('Authorization', `Bearer ${claimantToken}`)
        .send({ answers: [{ question: 'Q?', answer: 'Ans' }] });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('3 claim strikes');
    });
  });

  describe('Claim Review, Room Handover & Strike Penalties', () => {
    let claimId;

    beforeEach(async () => {
      const claimRes = await request(app)
        .post(`/api/posts/${foundPost._id}/claims`)
        .set('Authorization', `Bearer ${claimantToken}`)
        .send({
          answers: [
            { question: 'What brand is the case?', answer: 'Apple AirPods' },
            { question: 'Is there any engraved letter inside?', answer: 'Letter A' },
          ],
        });
      claimId = claimRes.body.data._id;
    });

    it('prohibits unauthorized residents from approving or rejecting claims', async () => {
      const res = await request(app)
        .patch(`/api/claims/${claimId}`)
        .set('Authorization', `Bearer ${anotherResidentToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the finder or a hostel warden');
    });

    it('approves claim: marks post as returned and reveals room numbers for handover', async () => {
      const res = await request(app)
        .patch(`/api/claims/${claimId}`)
        .set('Authorization', `Bearer ${finderToken}`)
        .send({ status: 'approved', reviewNote: 'Engraved A matches hidden details' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');

      // Post status becomes returned
      const updatedPost = await Post.findById(foundPost._id);
      expect(updatedPost.status).toBe('returned');

      // Claimant sees finder room number in /api/claims/mine
      const mineRes = await request(app)
        .get('/api/claims/mine')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(mineRes.status).toBe(200);
      expect(mineRes.body.data[0].post.postedBy.room).toBe('B-205');
    });

    it('rejects claim: reverts post to open, increments claimant strikes, and suspends after 3', async () => {
      const res = await request(app)
        .patch(`/api/claims/${claimId}`)
        .set('Authorization', `Bearer ${finderToken}`)
        .send({ status: 'rejected', reviewNote: 'Incorrect engraving' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');

      // Post reverts to open
      const updatedPost = await Post.findById(foundPost._id);
      expect(updatedPost.status).toBe('open');

      // Claimant strikes increased to 1
      const updatedClaimant = await User.findById(claimant._id);
      expect(updatedClaimant.claimStrikes).toBe(1);
    });

    it('allows warden to reset claim strikes for a suspended resident', async () => {
      // Simulate resident with 3 strikes
      claimant.claimStrikes = 3;
      await claimant.save();

      const res = await request(app)
        .patch(`/api/warden/users/${claimant._id}/reset-strikes`)
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.status).toBe(200);

      const updated = await User.findById(claimant._id);
      expect(updated.claimStrikes).toBe(0);
    });
  });

  describe('Notification Endpoints', () => {
    it('fetches, counts unread, and marks notifications as read', async () => {
      // Create test notifications
      await Notification.create([
        { user: claimant._id, type: 'test', message: 'Notif 1', read: false },
        { user: claimant._id, type: 'test', message: 'Notif 2', read: false },
      ]);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${claimantToken}`);
      expect(countRes.body.count).toBe(2);

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${claimantToken}`);
      expect(listRes.body.data.length).toBe(2);

      // Mark all as read
      await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${claimantToken}`);

      const afterCount = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${claimantToken}`);
      expect(afterCount.body.count).toBe(0);
    });
  });

  describe('Post Expiry and Image Cleanup Cron', () => {
    it('expires open posts older than 30 days and ignores recent posts', async () => {
      // Create an old open post (35 days old)
      const oldPost = await Post.create({
        hostel: hostel._id,
        type: 'lost',
        title: 'Old lost book',
        description: 'Lost long ago',
        category: 'documents',
        spot: 'Library',
        postedBy: finder._id,
        status: 'open',
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      });

      // Recent post (2 days old)
      const recentPost = await Post.create({
        hostel: hostel._id,
        type: 'lost',
        title: 'Recent lost keys',
        description: 'Lost recently',
        category: 'keys',
        spot: 'Library',
        postedBy: finder._id,
        status: 'open',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });

      const expiredCount = await cronService.expireOldPosts();
      expect(expiredCount).toBeGreaterThanOrEqual(1);

      const checkOld = await Post.findById(oldPost._id);
      expect(checkOld.status).toBe('expired');

      const checkRecent = await Post.findById(recentPost._id);
      expect(checkRecent.status).toBe('open');
    });

    it('cleans up uploaded images of returned posts older than 7 days', async () => {
      // Create dummy file in server/uploads
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const testFile = path.join(uploadsDir, 'cron-test.jpg');
      fs.writeFileSync(testFile, 'dummy image content');

      const returnedPost = await Post.create({
        hostel: hostel._id,
        type: 'found',
        title: 'Returned watch',
        description: 'Returned 10 days ago',
        category: 'other',
        spot: 'Common Room',
        postedBy: finder._id,
        status: 'returned',
        images: ['/uploads/cron-test.jpg'],
      });

      // Explicitly set past updatedAt without Mongoose timestamps hook overriding it
      await Post.updateOne(
        { _id: returnedPost._id },
        { $set: { updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } },
        { timestamps: false }
      );

      await cronService.cleanupReturnedImages();

      const refreshed = await Post.findById(returnedPost._id);
      expect(refreshed.images.length).toBe(0);
      expect(fs.existsSync(testFile)).toBe(false);
    });
  });
});
