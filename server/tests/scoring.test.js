const mongoose = require('mongoose');
const { cosineSimilarity, locationTimeScore, computeFinalScore } = require('../src/services/scoringService');
const { TfIdfVectorizer, computeKeywordSimilarity } = require('../src/services/keywordMatchService');
const config = require('../src/config/scoring');
const Hostel = require('../src/models/Hostel');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Match = require('../src/models/Match');
const matchingService = require('../src/services/matchingService');

describe('PHASE 2 Scoring & Matching Service Tests', () => {
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
      // 24 / 25 = 0.96
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.96, 4);
    });
  });

  describe('Location & Time Scoring Function', () => {
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
      // spot matches (1.0) * exp(-1) = 0.3679
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

    it('gives lower score for different spots in the hostel', () => {
      const now = new Date();
      const sameSpot = locationTimeScore(
        { spot: 'Library', happenedAt: now },
        { spot: 'Library', happenedAt: now }
      );
      const diffSpot = locationTimeScore(
        { spot: 'Library', happenedAt: now },
        { spot: 'Gym & Sports Complex', happenedAt: now }
      );

      expect(diffSpot).toBeLessThan(sameSpot);
      expect(diffSpot).toBeGreaterThan(0);
    });
  });

  describe('Weighted Final Score Calculation', () => {
    it('applies configured weights (text 0.7, locationTime 0.3)', () => {
      const now = new Date();
      const lost = {
        type: 'lost',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [1, 0],
      };
      const found = {
        type: 'found',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [1, 0], // text similarity = 1.0
      };

      const result = computeFinalScore(lost, found);
      expect(result.textScore).toBe(1.0);
      expect(result.locationTimeScore).toBe(1.0);
      // 1.0 * 0.7 + 1.0 * 0.3 = 1.0
      expect(result.finalScore).toBe(1.0);
    });

    it('correctly weights partial text similarity and location-time score', () => {
      const now = new Date();
      const lost = {
        type: 'lost',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [3, 4], // norm = 5
      };
      const found = {
        type: 'found',
        spot: 'Common Room',
        happenedAt: now,
        textEmbedding: [4, 3], // norm = 5, cosine = 0.96
      };

      const result = computeFinalScore(lost, found);
      expect(result.textScore).toBeCloseTo(0.96, 2);
      expect(result.locationTimeScore).toBe(1.0);
      // (0.96 * 0.7) + (1.0 * 0.3) = 0.672 + 0.3 = 0.972
      expect(result.finalScore).toBeCloseTo(0.972, 2);
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

  describe('Matching Thresholds and Top 5 Limit Integration', () => {
    let testHostel;
    let testUser;

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
      });

      testUser = await User.create({
        name: 'Tester',
        email: 'test@hostel.edu',
        passwordHash: 'hash',
        hostel: testHostel._id,
        room: '101',
        approved: true,
      });
    });

    it('creates Match documents only above the threshold and prunes beyond top 5', async () => {
      // Create target lost post
      const lostPost = await Post.create({
        hostel: testHostel._id,
        type: 'lost',
        title: 'Lost earphone case',
        description: 'Blue case',
        category: 'electronics',
        spot: 'Common Room',
        postedBy: testUser._id,
        textEmbedding: [1, 0, 0],
      });

      // Create 7 candidate found posts with varying similarity
      // 6 candidates will have high similarity (above 0.55), 1 will have 0 similarity
      for (let i = 1; i <= 7; i++) {
        const angle = i <= 6 ? 0.95 - (i * 0.05) : 0; // i=1..6 gives >0.65 score, i=7 gives 0
        await Post.create({
          hostel: testHostel._id,
          type: 'found',
          title: `Found candidate ${i}`,
          description: `Description ${i}`,
          category: 'electronics',
          spot: 'Common Room',
          postedBy: testUser._id,
          textEmbedding: [angle, Math.sqrt(Math.max(0, 1 - angle * angle)), 0],
        });
      }

      // Run matching
      await matchingService.findAndSaveMatches(lostPost);

      // Verify that Match documents were created
      const matches = await Match.find({ lostPost: lostPost._id }).sort({ finalScore: -1 });

      // Threshold check: Candidate 7 (score below 0.55) was never included
      expect(matches.every((m) => m.finalScore >= config.matchThreshold)).toBe(true);

      // Top 5 check: Despite 6 candidates exceeding threshold, only top 5 were kept
      expect(matches.length).toBe(5);

      // Matches should be ordered descending
      for (let j = 0; j < matches.length - 1; j++) {
        expect(matches[j].finalScore).toBeGreaterThanOrEqual(matches[j + 1].finalScore);
      }
    });
  });
});
