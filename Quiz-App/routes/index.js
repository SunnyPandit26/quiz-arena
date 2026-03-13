// routes/index.js - COMPLETE FIXED VERSION
var express = require('express');
var router = express.Router();
const userModel = require('./users');
const passport = require('passport');
const LocalStrategy = require("passport-local");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new LocalStrategy(userModel.authenticate()));

const path = require("path");
const fs = require("fs");

/* ---------- Helpers ---------- */
function isLoggedIn(req, res, next) {
  console.log('🔍 isLoggedIn check:', req.isAuthenticated());
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ success: false, message: 'Not authenticated' });
}

function getSubjectProgress(user, subject) {
  if (!user || !user.progress || !Array.isArray(user.progress)) return 1;
  const rec = user.progress.find(p => p.subject === subject);
  return rec?.highestUnlocked || 1;
}

async function setSubjectProgress(user, subject, nextLevel) {
  if (!user.progress) user.progress = [];
  const idx = user.progress.findIndex(p => p.subject === subject);
  if (idx === -1) {
    user.progress.push({ subject, highestUnlocked: nextLevel });
  } else {
    user.progress[idx].highestUnlocked = Math.max(user.progress[idx].highestUnlocked || 1, nextLevel);
  }
  await user.save();
  console.log(`✅ Progress SAVED: ${subject} -> ${nextLevel}`);
}

/* ---------- Google OAuth Strategy ---------- */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const primaryEmail = profile.emails?.[0]?.value?.toLowerCase();
      const photoUrl = profile.photos?.[0]?.value || null;
      console.log('🔍 Google OAuth Profile:', profile.id, primaryEmail);

      let user = await userModel.findOne({ googleId: profile.id });
      if (user) {
        if (photoUrl && user.profilePicture !== photoUrl) {
          user.profilePicture = photoUrl;
          await user.save();
        }
        console.log('✅ Existing Google user:', user.username);
        return done(null, user);
      }

      if (primaryEmail) {
        user = await userModel.findOne({ email: primaryEmail });
        if (user) {
          user.googleId = profile.id;
          if (photoUrl) user.profilePicture = photoUrl;
          await user.save();
          console.log('✅ Linked existing user:', user.username);
          return done(null, user);
        }
      }

      const tempUsername = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      user = new userModel({
        googleId: profile.id,
        username: tempUsername,
        fullName: profile.displayName || primaryEmail || 'Google User',
        email: primaryEmail || `${profile.id}@google.local`,
        profilePicture: photoUrl,
        progress: [],
        tempGoogleUser: true
      });

      await user.save();
      console.log('✅ New Google user created:', tempUsername);
      done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      done(error, null);
    }
  }));
}

/* ---------- ROUTES ---------- */
router.get('/', function(req, res) {
  console.log('✅ Home route accessed');
  res.render('index', { title: 'Quiz App' });
});

// 🔥 FIXED: /me - Works for both logged-in and guests
router.get('/me', async (req, res) => {
  try {
    console.log('🔍 /me route - User authenticated:', req.isAuthenticated());
    
    if (!req.isAuthenticated() || !req.user) {
      return res.json({ 
        success: false, 
        authenticated: false 
      });
    }
    
    const freshUser = await userModel.findById(req.user._id).lean();
    
    if (!freshUser) {
      req.logout((err) => { if (err) console.error(err); });
      return res.json({ success: false, authenticated: false });
    }
    
    console.log('✅ /me FRESH USER:', freshUser.username);
    
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: freshUser._id.toString(),
        username: freshUser.username,
        fullName: freshUser.fullName,
        email: freshUser.email,
        tempGoogleUser: freshUser.tempGoogleUser || false,
        profilePicture: freshUser.profilePicture
      }
    });
  } catch (error) {
    console.error('❌ /me ERROR:', error);
    res.json({ success: false, authenticated: false });
  }
});

// 🔥 FIXED: /badge - Works WITHOUT login (shows default badge)
router.get('/badge', async (req, res) => {
  try {
    console.log('🔍 /badge - Authenticated:', req.isAuthenticated());
    
    if (!req.isAuthenticated() || !req.user) {
      console.log('❌ /badge: Not authenticated');
      return res.json({ 
        success: true,
        badge: {
          name: 'Guest Player',
          symbol: '👋',
          color: '#6c757d',
          description: 'Login to earn badges!'
        },
        message: 'Please login to see badges'
      });
    }

    const user = await userModel.findById(req.user._id).lean();
    if (!user) {
      return res.json({ 
        success: true,
        badge: null 
      });
    }

    let badge = {
      name: 'New Player',
      symbol: '⭐',
      color: '#28a745',
      description: 'Welcome to Quiz Arena!'
    };

    if (user.progress && user.progress.length > 0) {
      const totalLevels = user.progress.reduce((sum, p) => sum + (p.highestUnlocked || 0), 0);
      if (totalLevels >= 25) badge = { name: 'PLATINUM', symbol: '🏆', color: '#ffd700' };
      else if (totalLevels >= 15) badge = { name: 'GOLD', symbol: '🥇', color: '#ffd700' };
      else if (totalLevels >= 10) badge = { name: 'SILVER', symbol: '🥈', color: '#c0c0c0' };
      else if (totalLevels >= 5) badge = { name: 'BRONZE', symbol: '🥉', color: '#cd7f32' };
    }

    console.log('✅ Badge sent:', badge.name, 'for user:', user.username);
    res.json({ success: true, badge });
  } catch (error) {
    console.error('❌ /badge ERROR:', error);
    res.json({ success: true, badge: null });
  }
});

// 🔥 FIXED: GET /progress - Works WITHOUT login (returns 1 for guests)
router.get('/progress', async (req, res) => {
  try {
    const subject = String(req.query.subject || '').trim();
    console.log('🔥 GET /progress:', { subject, authenticated: req.isAuthenticated() });
    
    if (!subject) {
      return res.status(400).json({ success: false, message: 'subject is required' });
    }

    // Guests always get level 1
    if (!req.isAuthenticated() || !req.user) {
      return res.json({ 
        success: true, 
        subject, 
        highestUnlocked: 1,
        guest: true 
      });
    }

    const user = await userModel.findById(req.user._id);
    const highestUnlocked = getSubjectProgress(user, subject);
    
    console.log('✅ GET Progress:', { subject, highestUnlocked, userId: req.user._id });
    return res.json({ success: true, subject, highestUnlocked });
  } catch (e) {
    console.error('❌ GET /progress error:', e);
    return res.status(500).json({ success: false, message: 'Progress fetch error' });
  }
});

// 🔥 FIXED: POST /progress - Works WITHOUT login (fake save for guests)
router.post('/progress', async (req, res) => {
  try {
    const { subject, highestUnlocked } = req.body;
    console.log('🔥 POST /progress HIT:', { subject, highestUnlocked, authenticated: req.isAuthenticated() });

    if (!subject || highestUnlocked === undefined) {
      return res.status(400).json({ success: false, message: 'subject and highestUnlocked required' });
    }

    // Guests - fake success (no real save)
    if (!req.isAuthenticated() || !req.user) {
      console.log('👤 Guest progress update (fake):', subject, highestUnlocked);
      return res.json({ 
        success: true, 
        message: `Level ${highestUnlocked} unlocked! (Guest mode)`,
        subject, 
        highestUnlocked: parseInt(highestUnlocked),
        guest: true
      });
    }

    // Real logged-in users
    const user = await userModel.findById(req.user._id);
    const current = getSubjectProgress(user, subject);
    
    if (parseInt(highestUnlocked) > current + 1) {
      return res.status(400).json({ success: false, message: 'Cannot skip levels' });
    }

    await setSubjectProgress(user, subject, parseInt(highestUnlocked));
    const updated = getSubjectProgress(user, subject);
    
    res.json({ 
      success: true, 
      message: `Level ${updated} unlocked!`,
      subject, 
      highestUnlocked: updated 
    });
    
  } catch (error) {
    console.error('❌ POST /progress error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🔥 CRITICAL FIX: POST /quiz/submit - NO isLoggedIn middleware!
router.post('/quiz/submit', async (req, res) => {
  try {
    const { subject, level, score, total } = req.body;
    console.log(`🔥 Quiz submit: ${req.isAuthenticated() ? req.user?.username : 'GUEST'} - ${subject} L${level} - ${score}/${total}`);

    if (!subject || !level || score === undefined || !total) {
      return res.status(400).json({ success: false, message: "Invalid quiz data" });
    }

    const currentLevel = parseInt(level);
    let passed = score >= total * 0.7; // 70% pass
    let nextLevel = currentLevel + 1;

    // Only save progress for logged-in users
    if (req.isAuthenticated() && req.user) {
      const user = await userModel.findById(req.user._id);
      if (passed) {
        await setSubjectProgress(user, subject, nextLevel);
        console.log(`✅ ${req.user.username} PASSED ${subject} L${level} -> Unlocked L${nextLevel}`);
      }
    } else {
      console.log(`👤 GUEST passed ${subject} L${level} (progress not saved)`);
    }

    res.json({
      success: true,
      passed,
      nextLevel,
      message: passed ? 'Great job! Next level unlocked!' : 'Try again to unlock next level!',
      guestMode: !req.isAuthenticated()
    });
  } catch (error) {
    console.error('❌ Quiz submit error:', error);
    res.status(500).json({ success: false, message: 'Failed to save results' });
  }
});

// 🔥 Quiz questions (unchanged - works perfectly)
router.get('/quiz', (req, res) => {
  const { subject, level } = req.query;
  console.log(`🔥 Quiz route: ${subject} level ${level}`);

  if (!subject || !level) {
    return res.status(400).json({ success: false, message: "Subject and level required" });
  }

  const filePath = path.join(__dirname, "..", "data", subject, `${level}.json`);
  if (!fs.existsSync(filePath)) {
    console.log("❌ File not found:", filePath);
    return res.status(404).json({ success: false, message: "Quiz file not found" });
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(rawData);
    console.log(`✅ Quiz loaded: ${questions.length} questions from ${subject} level ${level}`);
    res.json({ success: true, subject, level, questions });
  } catch (err) {
    console.error("❌ Quiz file parse error:", err);
    res.status(500).json({ success: false, message: "Failed to load quiz data" });
  }
});

// Keep other routes (register, login, etc.) same...
router.get('/profile', isLoggedIn, function (req, res) {
  console.log('✅ Profile route accessed');
  res.json({
    success: true,
    user: {
      username: req.user.username,
      fullName: req.user.fullName,
      email: req.user.email,
      profilePicture: req.user.profilePicture,
      tempGoogleUser: req.user.tempGoogleUser || false
    }
  });
});

// Google OAuth routes (keep same)...
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: true 
  }), 
  async (req, res) => {
    try {
      const user = req.user;
      console.log('🔍 Callback user:', user.username, user.tempGoogleUser);
      
      if (user.tempGoogleUser || user.username.startsWith('guest_')) {
        res.redirect(`http://localhost:5173/username-setup?userId=${user._id}`);
      } else {
        res.redirect('http://localhost:5173/');
      }
    } catch (error) {
      console.error('❌ Callback error:', error);
      res.redirect('/login');
    }
  }
);

// Register, login, logout routes (keep same as your first version)...
router.post('/register', async function (req, res) {
  // ... your existing register code
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  console.log('✅ Local login success:', req.user.username);
  res.json({
    success: true,
    user: {
      username: req.user.username,
      fullName: req.user.fullName,
      email: req.user.email
    }
  });
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ success: false });
    }
    console.log('✅ Logout success');
    res.json({ success: true });
  });
});

module.exports = router;
