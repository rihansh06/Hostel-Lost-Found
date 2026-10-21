const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const Hostel = require('../src/models/Hostel');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Match = require('../src/models/Match');
const Claim = require('../src/models/Claim');
const { generateToken } = require('../src/utils/jwt');
const matchingService = require('../src/services/matchingService');

describe('PHASE 5: Cross-Hostel Isolation, Security Leakage & Warden Stats Tests', () => {
  let hostelA, hostelB;
  let residentA, residentB;
  let wardenA, wardenB;
  let tokenResidentA, tokenResidentB;
  let tokenWardenA, tokenWardenB;

  let postInHostelA;
  let postInHostelB;

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
      Match.deleteMany({}),
      Claim.deleteMany({}),
    ]);

    // Create two separate hostels
    hostelA = await Hostel.create({
      name: 'Hostel Alpha',
      inviteCode: 'ALPHA2026',
      spots: ['Alpha Lobby', 'Alpha Mess', 'Alpha Study Room'],
    });

    hostelB = await Hostel.create({
      name: 'Hostel Beta',
      inviteCode: 'BETA2026',
      spots: ['Beta Reception', 'Beta Cafeteria', 'Beta Gym'],
    });

    const pwd = await bcrypt.hash('Password123!', 6);

    // Users in Hostel A
    residentA = await User.create({
      name: 'Resident Alpha',
      email: 'resA@alpha.edu',
      passwordHash: pwd,
      hostel: hostelA._id,
      room: 'A-101',
      role: 'resident',
      approved: true,
      claimStrikes: 0,
    });

    wardenA = await User.create({
      name: 'Warden Alpha',
      email: 'wardenA@alpha.edu',
      passwordHash: pwd,
      hostel: hostelA._id,
      room: 'W-01',
      role: 'warden',
      approved: true,
      claimStrikes: 0,
    });

    // Users in Hostel B
    residentB = await User.create({
      name: 'Resident Beta',
      email: 'resB@beta.edu',
      passwordHash: pwd,
      hostel: hostelB._id,
      room: 'B-201',
      role: 'resident',
      approved: true,
      claimStrikes: 0,
    });

    wardenB = await User.create({
      name: 'Warden Beta',
      email: 'wardenB@beta.edu',
      passwordHash: pwd,
      hostel: hostelB._id,
      room: 'W-02',
      role: 'warden',
      approved: true,
      claimStrikes: 0,
    });

    tokenResidentA = generateToken(residentA._id);
    tokenWardenA = generateToken(wardenA._id);
    tokenResidentB = generateToken(residentB._id);
    tokenWardenB = generateToken(wardenB._id);

    // Create a lost post in Hostel A
    postInHostelA = await Post.create({
      hostel: hostelA._id,
      type: 'lost',
      title: 'Lost Blue JBL Flip Speaker',
      description: 'Blue cylindrical bluetooth speaker with black strap',
      category: 'electronics',
      spot: 'Alpha Mess',
      postedBy: residentA._id,
      status: 'open',
    });

    // Create a found post in Hostel B
    postInHostelB = await Post.create({
      hostel: hostelB._id,
      type: 'found',
      title: 'Found Blue JBL Flip Speaker',
      description: 'Blue cylindrical bluetooth speaker with black strap',
      category: 'electronics',
      spot: 'Beta Cafeteria',
      postedBy: residentB._id,
      status: 'open',
      hiddenDetails: 'Serial number JBL-998811 engraved on base',
      verificationQuestions: ['What color is the strap?', 'Is there an engraving on the base?'],
    });
  });

  describe('Strict Cross-Hostel Scoping & Isolation Proof', () => {
    it('proves a user from Hostel B CANNOT read a post from Hostel A', async () => {
      const res = await request(app)
        .get(`/api/posts/${postInHostelA._id}`)
        .set('Authorization', `Bearer ${tokenResidentB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('proves a user from Hostel B listing posts NEVER receives posts from Hostel A', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${tokenResidentB}`);

      expect(res.status).toBe(200);
      const postIds = res.body.posts.map((p) => p._id.toString());
      expect(postIds).toContain(postInHostelB._id.toString());
      expect(postIds).not.toContain(postInHostelA._id.toString());
    });

    it('proves a user from Hostel A CANNOT claim a post from Hostel B', async () => {
      const res = await request(app)
        .post(`/api/posts/${postInHostelB._id}/claims`)
        .set('Authorization', `Bearer ${tokenResidentA}`)
        .send({
          answers: [
            { question: 'What color is the strap?', answer: 'Black' },
          ],
        });

      // Post is not found in Hostel A's scope, so it is rejected with 404
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('proves matching NEVER matches opposite posts across different hostels', async () => {
      // Simulate matching for postInHostelB (which has identical wording to postInHostelA, but different hostels)
      await matchingService.findAndSaveMatches(postInHostelB);

      // Verify no match links postInHostelA and postInHostelB
      const crossMatch = await Match.findOne({
        $or: [
          { lostPost: postInHostelA._id, foundPost: postInHostelB._id },
          { lostPost: postInHostelB._id, foundPost: postInHostelA._id },
        ],
      });

      expect(crossMatch).toBeNull();
    });

    it('proves a user from Hostel A cannot mark as returned or delete a post from Hostel B', async () => {
      const patchRes = await request(app)
        .patch(`/api/posts/${postInHostelB._id}/returned`)
        .set('Authorization', `Bearer ${tokenResidentA}`);

      expect(patchRes.status).toBe(404);

      const deleteRes = await request(app)
        .delete(`/api/posts/${postInHostelB._id}`)
        .set('Authorization', `Bearer ${tokenResidentA}`);

      expect(deleteRes.status).toBe(404);
    });
  });

  describe('Zero-Leakage Security for Sensitive hiddenDetails', () => {
    let hostelAFoundPost;
    let otherResidentA;
    let tokenOtherResidentA;

    beforeEach(async () => {
      const pwd = await bcrypt.hash('Password123!', 6);
      otherResidentA = await User.create({
        name: 'Curious Resident A2',
        email: 'resA2@alpha.edu',
        passwordHash: pwd,
        hostel: hostelA._id,
        room: 'A-105',
        role: 'resident',
        approved: true,
        claimStrikes: 0,
      });
      tokenOtherResidentA = generateToken(otherResidentA._id);

      hostelAFoundPost = await Post.create({
        hostel: hostelA._id,
        type: 'found',
        title: 'Found Gold Ring',
        description: 'Gold ring found in study room',
        category: 'other',
        spot: 'Alpha Study Room',
        postedBy: residentA._id,
        status: 'open',
        hiddenDetails: 'TOP_SECRET_INSCRIPTION_LOVE_MOM_2024',
        verificationQuestions: ['What inscription is inside the band?'],
      });
    });

    it('NEVER reveals hiddenDetails in the public feed for non-posters', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${tokenOtherResidentA}`);

      expect(res.status).toBe(200);
      const post = res.body.posts.find((p) => p._id.toString() === hostelAFoundPost._id.toString());
      expect(post).toBeDefined();
      expect(post.hiddenDetails).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('TOP_SECRET_INSCRIPTION_LOVE_MOM_2024');
    });

    it('NEVER reveals hiddenDetails in GET /api/posts/:id to other residents', async () => {
      const res = await request(app)
        .get(`/api/posts/${hostelAFoundPost._id}`)
        .set('Authorization', `Bearer ${tokenOtherResidentA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hiddenDetails).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('TOP_SECRET_INSCRIPTION_LOVE_MOM_2024');
      // But verification questions ARE visible so claimant can answer
      expect(res.body.data.verificationQuestions).toEqual(['What inscription is inside the band?']);
    });

    it('reveals hiddenDetails ONLY to the original poster and hostel wardens', async () => {
      // Poster view
      const posterRes = await request(app)
        .get(`/api/posts/${hostelAFoundPost._id}`)
        .set('Authorization', `Bearer ${tokenResidentA}`);

      expect(posterRes.status).toBe(200);
      expect(posterRes.body.data.hiddenDetails).toBe('TOP_SECRET_INSCRIPTION_LOVE_MOM_2024');

      // Warden view
      const wardenRes = await request(app)
        .get(`/api/posts/${hostelAFoundPost._id}`)
        .set('Authorization', `Bearer ${tokenWardenA}`);

      expect(wardenRes.status).toBe(200);
      expect(wardenRes.body.data.hiddenDetails).toBe('TOP_SECRET_INSCRIPTION_LOVE_MOM_2024');
    });
  });

  describe('Warden Stats Endpoint (/api/stats)', () => {
    beforeEach(async () => {
      // Create additional items in Hostel A
      const returnedPost = await Post.create({
        hostel: hostelA._id,
        type: 'found',
        title: 'Returned Keys',
        description: 'Room keys with red tag',
        category: 'keys',
        spot: 'Alpha Lobby',
        postedBy: residentA._id,
        status: 'returned',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      });

      // Update to set past updatedAt (1 day ago => duration = 1 day)
      await Post.updateOne(
        { _id: returnedPost._id },
        { $set: { updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        { timestamps: false }
      );
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(401);
    });

    it('rejects regular residents with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${tokenResidentA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Warden privileges required');
    });

    it('returns accurate, hostel-scoped statistics to the warden', async () => {
      const res = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${tokenWardenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.itemsPosted).toBe(2); // postInHostelA + returnedPost
      expect(data.itemsReturned).toBe(1);
      expect(data.returnRate).toBe(50); // 1 returned out of 2 posted = 50%
      expect(data.averageTimeToReturn.hours).toBeGreaterThanOrEqual(20);
      expect(data.averageTimeToReturn.days).toBeCloseTo(1, 0);
      expect(Array.isArray(data.categories)).toBe(true);
    });

    it('proves Hostel A stats do NOT count Hostel B items', async () => {
      const statsA = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${tokenWardenA}`);

      const statsB = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${tokenWardenB}`);

      expect(statsA.body.data.itemsPosted).toBe(2);
      expect(statsB.body.data.itemsPosted).toBe(1); // Only postInHostelB
    });
  });
});
