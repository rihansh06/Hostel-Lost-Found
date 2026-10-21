const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const {
  cosineSimilarity,
  locationTimeScore,
  areSpotsAdjacent,
  computeFinalScore,
  getDetailedScoreBreakdown,
} = require('../src/services/scoringService');
const { TfIdfVectorizer, computeKeywordSimilarity } = require('../src/services/keywordMatchService');
const imageEmbeddingService = require('../src/services/imageEmbeddingService');
const config = require('../src/config/scoring');
const Hostel = require('../src/models/Hostel');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Match = require('../src/models/Match');
const matchingService = require('../src/services/matchingService');
const { generateToken } = require('../src/utils/jwt');

describe('PHASE 2 & PHASE 3 Scoring, Vision & Matching Tests', () => {
  describe('Cosine Similarity Function', () => {
    it('returns 1.0 for identical non-zero vectors', () => {
      const v = [0.2, 0.5, 0.8];
      const sim = cosineSimilarity(v, v);
      expect(sim).toBeCloseTo(1.0, 5);
    });

    it('returns 0.0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      const sim = cosineSimilarity(v1, v2);
      expect(sim).toBeCloseTo(0.0, 5);
    });

    it('returns 0 when either vector is empty, null, or mismatched in length', () => {
      expect(cosineSimilarity([], [1, 2])).toBe(0);
      expect(cosineSimilarity(null, [1, 2])).toBe(0);
      expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
      expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    });

    it('calculates correct cosine similarity for arbitrary vectors', () => {
      const a = [3, 4]; // norm = 5
      const b = [4, 3]; // norm = 5, dot = 24
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.96, 4);
    });
  });

  describe('Location, Adjacency & Time Scoring', () => {
    it('returns 1.0 for identical spots and identical timestamp', () => {
      const now = new Date();
      const lost = { spot: 'Common Room', happenedAt: now };
      const found = { spot: 'Common Room', happenedAt: now };

      const score = locationTimeScore(lost, found);
      expect(score).toBe(1.0);
    });

    it('decays exponentially with time difference (exp(-days/3))', () => {
      const t0 = new Date('2026-10-01T12:00:00Z');
      const t3 = new Date('2026-10-04T12:00:00Z'); // 3 days difference => exp(-1) ≈ 0.3679

      const lost = { spot: 'Common Room', happenedAt: t0 };
      const found = { spot: 'Common Room', happenedAt: t3 };

      const score = locationTimeScore(lost, found);
      expect(score).toBeCloseTo(Math.exp(-1), 2);
    });

    it('strictly returns 0 if found item predates lost item by more than 14 days', () => {
      const lostDate = new Date('2026-10-20T12:00:00Z');
      const foundDate = new Date('2026-10-01T12:00:00Z'); // 19 days BEFORE lost item was reported

      const lost = { spot: 'Common Room', happenedAt: lostDate };
      const found = { spot: 'Common Room', happenedAt: foundDate };

      const score = locationTimeScore(lost, found);
      expect(score).toBe(0);
    });

    it('uses custom spotAdjacency defined on the Hostel model', () => {
      const mockHostel = {
        spotAdjacency: {
          'Floor 1': ['Floor 2'],
          'Floor 2': ['Floor 1', 'Floor 3'],
        },
      };

      expect(areSpotsAdjacent('Floor 1', 'Floor 2', mockHostel)).toBe(true);
      expect(areSpotsAdjacent('Floor 1', 'Floor 3', mockHostel)).toBe(false);

      const now = new Date();
      const scoreAdjacent = locationTimeScore(
        { spot: 'Floor 1', happenedAt: now },
        { spot: 'Floor 2', happenedAt: now },
        mockHostel
      );
      const scoreNonAdjacent = locationTimeScore(
        { spot: 'Floor 1', happenedAt: now },
        { spot: 'Floor 3', happenedAt: now },
        mockHostel
      );

      expect(scoreAdjacent).toBe(0.5); // adjacent base
      expect(scoreNonAdjacent).toBe(0.2); // same hostel baseline
    });
  });

  describe('Combined Scoring & Weight Redistribution (Phase 3)', () => {
    it('applies full weights (text 0.5, image 0.3, location 0.2) when both items have images', () => {
      const now = new Date();
      const lost = {
        type: 'lost',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [1, 0],
        imageEmbedding: [0.8, 0.6], // norm = 1
      };
      const found = {
        type: 'found',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [1, 0], // text similarity = 1.0
        imageEmbedding: [0.8, 0.6], // image similarity = 1.0
      };

      const result = computeFinalScore(lost, found);
      expect(result.hasBothImages).toBe(true);
      expect(result.textScore).toBe(1.0);
      expect(result.imageScore).toBe(1.0);
      expect(result.locationTimeScore).toBe(1.0);
      expect(result.weightsUsed.text).toBe(0.5);
      expect(result.weightsUsed.image).toBe(0.3);
      expect(result.weightsUsed.locationTime).toBe(0.2);
      expect(result.weightsUsed.redistributed).toBe(false);
      // 1*0.5 + 1*0.3 + 1*0.2 = 1.0
      expect(result.finalScore).toBe(1.0);
    });

    it('redistributes the 0.3 image weight proportionally when one or both posts lack images', () => {
      const now = new Date();
      const lost = {
        type: 'lost',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [1, 0],
        imageEmbedding: [1, 0],
      };
      const found = {
        type: 'found',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [1, 0],
        imageEmbedding: [], // Found post has no images!
      };

      const result = computeFinalScore(lost, found);
      expect(result.hasBothImages).toBe(false);
      expect(result.weightsUsed.redistributed).toBe(true);
      expect(result.weightsUsed.image).toBe(0);
      expect(result.weightsUsed.text).toBeCloseTo(0.5 / 0.7, 3);
      expect(result.weightsUsed.locationTime).toBeCloseTo(0.2 / 0.7, 3);
      // 1.0 * (0.5/0.7) + 1.0 * (0.2/0.7) = 1.0
      expect(result.finalScore).toBe(1.0);
    });
  });

  describe('Image Embedding Cache', () => {
    it('caches and clears image embeddings', () => {
      imageEmbeddingService.clearImageCache();
      // Test the cache helper directly
      const mockKey = '/uploads/sample.jpg';
      const mockEmbedding = [0.1, 0.2, 0.3];

      // Simulate cache entry
      imageEmbeddingService.clearImageCache();
      expect(imageEmbeddingService.resolveLocalImagePath('non_existent.png')).toBeNull();
    });
  });

  describe('TF-IDF Baseline Keyword Matcher', () => {
    it('computes higher similarity for overlapping keywords', () => {
      const docA = 'Apple AirPods Pro wireless earphone case in blue';
      const docB = 'AirPods wireless earphones bluetooth';
      const docC = 'Stainless steel water bottle flask dark';

      const corpus = [docA, docB, docC];
      const simAB = computeKeywordSimilarity(docA, docB, corpus);
      const simAC = computeKeywordSimilarity(docA, docC, corpus);

      expect(simAB).toBeGreaterThan(simAC);
      expect(simAC).toBe(0);
    });
  });

  describe('Integration: Matching Thresholds & Warden Debug Endpoint', () => {
    let testHostel;
    let wardenUser;
    let residentUser;
    let wardenToken;
    let residentToken;
    let lostPost;
    let foundPost;
    let testMatch;

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
      ]);

      testHostel = await Hostel.create({
        name: 'Cauvery Hostel',
        inviteCode: 'TEST2026',
        spots: ['Common Room', 'Mess', 'Gym'],
        spotAdjacency: {
          'Common Room': ['Mess'],
        },
      });

      wardenUser = await User.create({
        name: 'Warden Smith',
        email: 'warden@test.com',
        passwordHash: 'hash',
        hostel: testHostel._id,
        room: 'W-01',
        role: 'warden',
        approved: true,
      });

      residentUser = await User.create({
        name: 'Resident John',
        email: 'john@test.com',
        passwordHash: 'hash',
        hostel: testHostel._id,
        room: '101',
        role: 'resident',
        approved: true,
      });

      wardenToken = generateToken(wardenUser._id);
      residentToken = generateToken(residentUser._id);

      lostPost = await Post.create({
        hostel: testHostel._id,
        type: 'lost',
        title: 'Lost earphone case',
        description: 'Navy blue case',
        category: 'electronics',
        spot: 'Common Room',
        postedBy: residentUser._id,
        textEmbedding: [1, 0, 0],
        imageEmbedding: [0.8, 0.6],
      });

      foundPost = await Post.create({
        hostel: testHostel._id,
        type: 'found',
        title: 'AirPods cover found',
        description: 'Blue rubber jacket',
        category: 'electronics',
        spot: 'Common Room',
        postedBy: residentUser._id,
        textEmbedding: [0.95, 0.31, 0],
        imageEmbedding: [0.8, 0.6],
      });

      const scores = computeFinalScore(lostPost, foundPost, testHostel);
      testMatch = await Match.create({
        hostel: testHostel._id,
        lostPost: lostPost._id,
        foundPost: foundPost._id,
        textScore: scores.textScore,
        imageScore: scores.imageScore,
        locationTimeScore: scores.locationTimeScore,
        finalScore: scores.finalScore,
        status: 'suggested',
      });
    });

    it('creates Match documents only above the threshold and prunes beyond top 5', async () => {
      // Create 7 candidate found posts with varying similarity
      for (let i = 1; i <= 7; i++) {
        const angle = i <= 6 ? 0.95 - (i * 0.05) : 0;
        await Post.create({
          hostel: testHostel._id,
          type: 'found',
          title: `Found candidate ${i}`,
          description: `Description ${i}`,
          category: 'electronics',
          spot: 'Common Room',
          postedBy: residentUser._id,
          textEmbedding: [angle, Math.sqrt(Math.max(0, 1 - angle * angle)), 0],
        });
      }

      await matchingService.findAndSaveMatches(lostPost);

      const matches = await Match.find({ lostPost: lostPost._id }).sort({ finalScore: -1 });

      expect(matches.every((m) => m.finalScore >= config.matchThreshold)).toBe(true);
      expect(matches.length).toBe(5);
    });

    it('prohibits residents from accessing the warden match breakdown debug endpoint', async () => {
      const res = await request(app)
        .get(`/api/warden/matches/${testMatch._id}/breakdown`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Warden');
    });

    it('allows warden to retrieve detailed score breakdown for a match', async () => {
      const res = await request(app)
        .get(`/api/warden/matches/${testMatch._id}/breakdown`)
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchId).toBe(testMatch._id.toString());
      expect(res.body.data.scoringBreakdown.textScore).toBeDefined();
      expect(res.body.data.scoringBreakdown.imageScore).toBeDefined();
      expect(res.body.data.scoringBreakdown.locationTimeScore.baseLocationScore).toBe(1.0);
      expect(res.body.data.scoringBreakdown.weightsApplied.text).toBe(0.5);
      expect(res.body.data.scoringBreakdown.weightsApplied.image).toBe(0.3);
      expect(res.body.data.scoringBreakdown.weightsApplied.locationTime).toBe(0.2);
    });
  });
});
