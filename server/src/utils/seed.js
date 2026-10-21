require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Hostel = require('../models/Hostel');
const User = require('../models/User');
const Post = require('../models/Post');
const Match = require('../models/Match');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');
const embeddingService = require('../services/embeddingService');
const matchingService = require('../services/matchingService');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_lost_found';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Promise.all([
      Hostel.deleteMany({}),
      User.deleteMany({}),
      Post.deleteMany({}),
      Match.deleteMany({}),
      Claim.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // 1. Create Hostel with 6 spots
    const hostel = await Hostel.create({
      name: 'Cauvery Boys Hostel',
      inviteCode: 'HOSTEL2026',
      spots: [
        'Mess / Dining Hall',
        'Common Room',
        '1st Floor Corridor',
        'Library / Study Area',
        'Gym & Sports Complex',
        'Laundry Room',
      ],
    });
    console.log(`Created Hostel: ${hostel.name} (Invite Code: ${hostel.inviteCode})`);

    // 2. Create Password Hash
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

    // 3. Create Warden
    const warden = await User.create({
      name: 'Dr. Ramesh Sharma',
      email: 'warden@hostel.edu',
      passwordHash: defaultPasswordHash,
      hostel: hostel._id,
      room: 'W-01',
      role: 'warden',
      approved: true,
      claimStrikes: 0,
    });
    console.log(`Created Warden: ${warden.name} (${warden.email})`);

    // 4. Create Residents (3 approved, 1 unapproved for warden testing)
    const [aarav, rohit, priya, kunal] = await User.create([
      {
        name: 'Aarav Patel',
        email: 'aarav@student.edu',
        passwordHash: defaultPasswordHash,
        hostel: hostel._id,
        room: 'A-102',
        role: 'resident',
        approved: true,
        claimStrikes: 0,
      },
      {
        name: 'Rohit Verma',
        email: 'rohit@student.edu',
        passwordHash: defaultPasswordHash,
        hostel: hostel._id,
        room: 'B-205',
        role: 'resident',
        approved: true,
        claimStrikes: 0,
      },
      {
        name: 'Priya Sen',
        email: 'priya@student.edu',
        passwordHash: defaultPasswordHash,
        hostel: hostel._id,
        room: 'C-310',
        role: 'resident',
        approved: true,
        claimStrikes: 0,
      },
      {
        name: 'Kunal Roy',
        email: 'kunal@student.edu',
        passwordHash: defaultPasswordHash,
        hostel: hostel._id,
        room: 'D-401',
        role: 'resident',
        approved: false, // Pending approval for demonstration!
        claimStrikes: 0,
      },
    ]);
    console.log(`Created 3 approved residents & 1 pending resident (${kunal.name})`);

    // 5. Create 20 Sample Posts with deliberately different wording for same items
    const postsData = [
      // Pair 1: Earphone case / AirPods cover
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Lost blue earphone case',
        description: 'Navy blue silicone case for Apple AirPods Pro with small silver carabiner clip.',
        category: 'electronics',
        spot: 'Common Room',
        happenedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        postedBy: aarav._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'AirPods cover found',
        description: 'Small royal blue rubber protective jacket for wireless earbuds.',
        category: 'electronics',
        spot: 'Common Room',
        happenedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        postedBy: rohit._id,
        hiddenDetails: "There is an engraved initial 'AP' inside the flap lid.",
        verificationQuestions: [
          'What is the brand and color of the case?',
          'Is there any initial or mark engraved inside?',
        ],
      },

      // Pair 2: Black steel bottle / Dark flask
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Black steel bottle missing',
        description: 'Matte black stainless steel insulated Milton flask bottle with a silver cap.',
        category: 'bottle',
        spot: 'Gym & Sports Complex',
        happenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        postedBy: rohit._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Found a dark flask',
        description: 'Metallic dark water container with small dent near the bottom rim.',
        category: 'bottle',
        spot: 'Gym & Sports Complex',
        happenedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        postedBy: priya._id,
        hiddenDetails: 'Small dent at bottom rim and 750ml capacity indicator.',
        verificationQuestions: [
          'What color is the cap of the flask?',
          'What is the capacity or any distinguishing dent on it?',
        ],
      },

      // Pair 3: Room key with red tag / Key found with crimson tag
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Misplaced room key with red tag',
        description: 'Single brass Godrej door key attached to a bright red plastic keychain marked with number 102.',
        category: 'keys',
        spot: '1st Floor Corridor',
        happenedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        postedBy: aarav._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Key found with crimson tag',
        description: 'Metallic door latch key with a worn red plastic tab on a metal ring.',
        category: 'keys',
        spot: '1st Floor Corridor',
        happenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        postedBy: priya._id,
        hiddenDetails: 'Key number 102 handwritten in black marker on the back.',
        verificationQuestions: [
          'What room number or writing is inscribed on the red tab?',
        ],
      },

      // Pair 4: Grey hoodie / Charcoal pullover
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Grey hooded sweatshirt',
        description: 'Oversized charcoal grey hoodie from H&M with front kangaroo pocket left on the dryer.',
        category: 'clothing',
        spot: 'Laundry Room',
        happenedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        postedBy: priya._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Dark grey pullover left behind',
        description: 'Warm fleece winter hoodie jacket, dark ash colour, retrieved from washing area.',
        category: 'clothing',
        spot: 'Laundry Room',
        happenedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        postedBy: rohit._id,
        hiddenDetails: 'Size XL with a folded coffee shop receipt inside the pocket.',
        verificationQuestions: [
          'What brand and size is the hoodie?',
          'What small paper item was inside the front pouch?',
        ],
      },

      // Pair 5: College ID card / Campus card
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'College ID card lost',
        description: 'Student identity smart card with barcode, name Aarav, department of Computer Science.',
        category: 'documents',
        spot: 'Library / Study Area',
        happenedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        postedBy: aarav._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Campus card discovered',
        description: 'Laminated institute card found on the desk near computer section.',
        category: 'documents',
        spot: 'Library / Study Area',
        happenedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        postedBy: priya._id,
        hiddenDetails: 'Roll number ending with 084.',
        verificationQuestions: [
          'What is the student name and roll number on the card?',
        ],
      },

      // Pair 6: Scientific calculator / Exam math calculator
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Scientific calculator',
        description: 'Casio fx-991EX ClassWiz calculator in black, with matrix and equation solver functions.',
        category: 'electronics',
        spot: 'Library / Study Area',
        happenedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        postedBy: rohit._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Exam math calculator',
        description: 'Casio advanced engineering calculation device with slide-on plastic lid.',
        category: 'electronics',
        spot: 'Library / Study Area',
        happenedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        postedBy: aarav._id,
        hiddenDetails: 'Has a small Batman sticker stuck inside the plastic slide cover.',
        verificationQuestions: [
          'What exact model number is the calculator?',
          'Is there any sticker or marking inside the sliding cover?',
        ],
      },

      // Pair 7: Spectacles in brown leather case / Eyeglasses on lunch table
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Spectacles in brown leather case',
        description: 'Rectangular Ray-Ban reading glasses inside a foldable brown faux-leather magnetic case.',
        category: 'other',
        spot: 'Mess / Dining Hall',
        happenedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        postedBy: priya._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Eyeglasses found on lunch table',
        description: 'Pair of wireframe specs inside an amber/tan folding box case.',
        category: 'other',
        spot: 'Mess / Dining Hall',
        happenedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        postedBy: rohit._id,
        hiddenDetails: 'Left nose pad is slightly yellowed and brand name printed on inner temple.',
        verificationQuestions: [
          'What brand name is on the spectacle frame?',
          'What color and shape is the carrying case?',
        ],
      },

      // Pair 8: Black umbrella / Dark compact brolly
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Umbrella left at entrance',
        description: 'Black automatic three-fold rain umbrella with curved wooden handle.',
        category: 'other',
        spot: 'Common Room',
        happenedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        postedBy: aarav._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Dark compact brolly',
        description: 'Collapsible rain shelter stick with wooden grip and push button.',
        category: 'other',
        spot: 'Common Room',
        happenedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        postedBy: priya._id,
        hiddenDetails: 'Small tear near one rib stitched with white thread.',
        verificationQuestions: [
          'What type of handle does it have?',
          'Is there any visible hand-stitched repair on the canopy?',
        ],
      },

      // Pair 9: Wireless mouse / Cordless pointer
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Logitech wireless mouse',
        description: 'Ergonomic black bluetooth pointer mouse with silent click buttons.',
        category: 'electronics',
        spot: 'Common Room',
        happenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        postedBy: rohit._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Computer mouse found',
        description: 'Dark optical cordless mouse, battery door on underside.',
        category: 'electronics',
        spot: 'Common Room',
        happenedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        postedBy: aarav._id,
        hiddenDetails: 'Contains a golden Duracell AA battery inside.',
        verificationQuestions: [
          'What brand is the mouse?',
          'What brand of battery is currently installed inside?',
        ],
      },

      // Pair 10: Sports shoe bag / Athletic kit pouch
      {
        hostel: hostel._id,
        type: 'lost',
        title: 'Sports shoes bag',
        description: 'Navy blue drawstring gym sack with Nike swoosh containing running trainers.',
        category: 'clothing',
        spot: 'Gym & Sports Complex',
        happenedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        postedBy: priya._id,
      },
      {
        hostel: hostel._id,
        type: 'found',
        title: 'Athletic kit pouch found',
        description: 'Dark blue cinch drawstring pack with footwear inside.',
        category: 'clothing',
        spot: 'Gym & Sports Complex',
        happenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        postedBy: rohit._id,
        hiddenDetails: 'Nike Pegasus size 9 shoes in black and white.',
        verificationQuestions: [
          'What shoe model and size is inside the pouch?',
          'What color are the shoe laces?',
        ],
      },
    ];

    const createdPosts = await Post.insertMany(postsData);
    console.log(`Created ${createdPosts.length} sample posts with contrasting vocabulary!`);

    console.log('\nGenerating text embeddings and computing initial matches for sample posts...');
    for (let i = 0; i < createdPosts.length; i++) {
      const p = createdPosts[i];
      try {
        const embedding = await embeddingService.getPostTextEmbedding(p);
        p.textEmbedding = embedding;
        await p.save();
      } catch (err) {
        console.warn(`Failed to embed post #${i + 1}:`, err.message);
      }
    }

    // Now run pairwise matching for all posts
    let totalMatchesCreated = 0;
    for (const p of createdPosts) {
      const matches = await matchingService.findAndSaveMatches(p);
      totalMatchesCreated += matches.length;
    }
    const distinctMatches = await Match.countDocuments();
    console.log(`Generated ${distinctMatches} distinct candidate matches across the sample posts!`);

    console.log('\n--- SEED SUMMARY ---');
    console.log(`Hostel: ${hostel.name} (Code: ${hostel.inviteCode})`);
    console.log('Warden login: warden@hostel.edu / Password123!');
    console.log('Resident login: aarav@student.edu / Password123!');
    console.log('Pending Resident (to test approve): kunal@student.edu / Password123!');
    console.log(`Total sample posts: ${createdPosts.length}`);
    console.log(`Total active matches generated: ${distinctMatches}`);

    await mongoose.disconnect();
    console.log('Database disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('Seed script failed:', error);
    process.exit(1);
  }
};

seedData();
