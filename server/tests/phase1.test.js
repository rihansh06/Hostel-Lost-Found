const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const Hostel = require('../src/models/Hostel');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const { generateToken } = require('../src/utils/jwt');

describe('PHASE 1 API & Security Tests', () => {
  let hostelA;
  let hostelB;
  let wardenA;
  let residentA1;
  let residentA2;
  let residentB;

  let wardenAToken;
  let residentA1Token;
  let residentA2Token;
  let residentBToken;

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
    ]);

    // Setup Hostel A and Hostel B
    hostelA = await Hostel.create({
      name: 'Hostel Alpha',
      inviteCode: 'ALPHA2026',
      spots: ['Common Room', 'Dining Hall', 'Library'],
    });

    hostelB = await Hostel.create({
      name: 'Hostel Beta',
      inviteCode: 'BETA2026',
      spots: ['Garden', 'Study Pod'],
    });

    const pwd = await bcrypt.hash('Password123!', 6);

    wardenA = await User.create({
      name: 'Warden Alpha',
      email: 'warden.alpha@test.com',
      passwordHash: pwd,
      hostel: hostelA._id,
      room: 'W-01',
      role: 'warden',
      approved: true,
    });

    residentA1 = await User.create({
      name: 'Resident Alpha 1',
      email: 'resA1@test.com',
      passwordHash: pwd,
      hostel: hostelA._id,
      room: 'A-101',
      role: 'resident',
      approved: true,
    });

    residentA2 = await User.create({
      name: 'Resident Alpha 2',
      email: 'resA2@test.com',
      passwordHash: pwd,
      hostel: hostelA._id,
      room: 'A-102',
      role: 'resident',
      approved: true,
    });

    residentB = await User.create({
      name: 'Resident Beta',
      email: 'resB@test.com',
      passwordHash: pwd,
      hostel: hostelB._id,
      room: 'B-201',
      role: 'resident',
      approved: true,
    });

    // Synchronize JWT tokens with the fresh User IDs in every test
    wardenAToken = generateToken(wardenA._id);
    residentA1Token = generateToken(residentA1._id);
    residentA2Token = generateToken(residentA2._id);
    residentBToken = generateToken(residentB._id);
  });

  describe('Auth & Warden Approval Flow', () => {
    it('creates an unapproved resident when registering with a valid invite code', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'New Student',
        email: 'newstudent@test.com',
        password: 'Password123!',
        room: 'A-303',
        inviteCode: 'ALPHA2026',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approved).toBe(false);

      // Verify unapproved resident cannot log in
      const loginAttempt = await request(app).post('/api/auth/login').send({
        email: 'newstudent@test.com',
        password: 'Password123!',
      });

      expect(loginAttempt.status).toBe(403);
      expect(loginAttempt.body.message).toContain('pending warden approval');
    });

    it('rejects registration with invalid invite code', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Invalid Student',
        email: 'invalid@test.com',
        password: 'Password123!',
        room: 'A-303',
        inviteCode: 'WRONG_CODE',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid hostel invite code');
    });

    it('allows warden to view pending users and approve them', async () => {
      const reg = await request(app).post('/api/auth/register').send({
        name: 'Pending Student',
        email: 'pending@test.com',
        password: 'Password123!',
        room: 'A-999',
        inviteCode: 'ALPHA2026',
      });
      const pendingUserId = reg.body.data.id;

      const pendingRes = await request(app)
        .get('/api/warden/pending-users')
        .set('Authorization', `Bearer ${wardenAToken}`);

      expect(pendingRes.status).toBe(200);
      expect(pendingRes.body.data.length).toBe(1);
      expect(pendingRes.body.data[0].email).toBe('pending@test.com');

      const approveRes = await request(app)
        .patch(`/api/warden/users/${pendingUserId}/approve`)
        .set('Authorization', `Bearer ${wardenAToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.approved).toBe(true);

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'pending@test.com',
        password: 'Password123!',
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });
  });

  describe('Post Scoping & Hidden Details Security', () => {
    let foundPostId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${residentA1Token}`)
        .field('type', 'found')
        .field('title', 'Blue Bluetooth Speaker')
        .field('description', 'Found in common room sofa')
        .field('category', 'electronics')
        .field('spot', 'Common Room')
        .field('hiddenDetails', 'JBL brand, has a red smiley sticker at base')
        .field('verificationQuestions', JSON.stringify(['What brand is the speaker?', 'What sticker is at the bottom?']));

      expect(createRes.status).toBe(201);
      foundPostId = createRes.body.data._id;
    });

    it('returns hiddenDetails to the author of the post', async () => {
      const res = await request(app)
        .get(`/api/posts/${foundPostId}`)
        .set('Authorization', `Bearer ${residentA1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hiddenDetails).toBe('JBL brand, has a red smiley sticker at base');
      expect(res.body.data.verificationQuestions.length).toBe(2);
    });

    it('returns hiddenDetails to the warden of the hostel', async () => {
      const res = await request(app)
        .get(`/api/posts/${foundPostId}`)
        .set('Authorization', `Bearer ${wardenAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hiddenDetails).toBe('JBL brand, has a red smiley sticker at base');
    });

    it('NEVER reveals hiddenDetails to another resident (only verification questions)', async () => {
      const res = await request(app)
        .get(`/api/posts/${foundPostId}`)
        .set('Authorization', `Bearer ${residentA2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hiddenDetails).toBeUndefined();
      expect(res.body.data.verificationQuestions).toEqual([
        'What brand is the speaker?',
        'What sticker is at the bottom?',
      ]);
    });

    it('prohibits a resident from Hostel B from accessing posts in Hostel A', async () => {
      const res = await request(app)
        .get(`/api/posts/${foundPostId}`)
        .set('Authorization', `Bearer ${residentBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Post not found in your hostel');
    });

    it('allows author or warden to mark post as returned', async () => {
      const res = await request(app)
        .patch(`/api/posts/${foundPostId}/returned`)
        .set('Authorization', `Bearer ${residentA1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('returned');
    });

    it('prohibits non-author from deleting someone elses post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${foundPostId}`)
        .set('Authorization', `Bearer ${residentA2Token}`);

      expect(res.status).toBe(403);
    });
  });
});
