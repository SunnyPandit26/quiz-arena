// routes/index.js  (REPLACE ENTIRE FILE)

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
        console.log('✅ Existing Google user found:', user.username);
        return done(null, user);
      }

      if (primaryEmail) {
        user = await userModel.findOne({ email: primaryEmail });
        if (user) {
          user.googleId = profile.id;
          if (photoUrl) user.profilePicture = photoUrl;
          await user.save();
          console.log('✅ Linked Google account to existing user:', user.username);
          return done(null, user);
        }
      }

      user = new userModel({
        googleId: profile.id,
        username: primaryEmail || `google_${profile.id}`,
        fullName: profile.displayName || primaryEmail || `google_${profile.id}`,
        email: primaryEmail || `${profile.id}@google.local`,
        profilePicture: photoUrl,
        progress: []
      });

      await user.save();
      console.log('✅ New Google user created:', user.username);
      done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      done(error, null);
    }
  }));
}

/* ---------- Routes ---------- */

/* GET home page */
router.get('/', function(req, res) {
  console.log('✅ Home route accessed');
  res.render('index', { title: 'Quiz App' });
});

/* Session check for debugging */
router.get('/me', (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

/* GET profile route */
router.get('/profile', isLoggedIn, function (req, res) {
  console.log('✅ Profile route accessed');
  res.json({
    success: true,
    user: {
      username: req.user.username,
      fullName: req.user.fullName,
      email: req.user.email,
      profilePicture: req.user.profilePicture
    }
  });
});

/* Google OAuth routes */
router.get('/auth/google', function(req, res, next) {
  console.log('🔥 GOOGLE AUTH ROUTE HIT');
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth not configured'
    });
  }
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
  async function(req, res) {
    try {
      const fresh = await userModel.findById(req.user._id);
      req.user = fresh;
    } catch(_) {}
    console.log('✅ Google OAuth callback successful');
    console.log('User:', req.user.username);
    res.redirect('http://localhost:5173?login=success');
  }
);

router.get('/auth/google/failure', function(req, res) {
  console.log('❌ Google OAuth failure');
  res.json({
    success: false,
    message: 'Google authentication failed'
  });
});

/* POST register route */
router.post('/register', async function (req, res) {
  console.log('🔥 REGISTRATION ROUTE HIT');
  console.log('Raw request body:', req.body);

  try {
    const newUsername = req.body.newUsername || req.body.username;
    const email = req.body.email;
    const newPassword = req.body.newPassword || req.body.password;

    if (!newUsername || typeof newUsername !== 'string' || newUsername.trim() === '') {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const cleanUsername = newUsername.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = newPassword.trim();

    const existingUser = await userModel.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === cleanEmail ? 'Email already registered' : 'Username already taken'
      });
    }

    const userData = new userModel();
    userData.username = cleanUsername;
    userData.fullName = cleanUsername;
    userData.email = cleanEmail;
    userData.progress = [];

    const registeredUser = await userModel.register(userData, cleanPassword);
    console.log('✅ User registered successfully:', registeredUser.username);

    req.login(registeredUser, (err) => {
      if (err) {
        console.error('❌ Auto-login error:', err);
        return res.status(500).json({ success: false, message: 'User created but login failed', error: err.message });
      }
      res.json({
        success: true,
        message: 'Account created successfully!',
        user: {
          username: registeredUser.username,
          fullName: registeredUser.fullName,
          email: registeredUser.email
        }
      });
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field === 'email' ? 'Email' : 'Username'} already exists` });
    }
    res.status(400).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

/* GET quiz questions */
router.get('/quiz', (req, res) => {
  const { subject, level } = req.query;

  console.log(`🔥 Quiz route hit with subject=${subject}, level=${level}`);

  if (!subject || !level) {
    return res.status(400).json({ success: false, message: "Subject and level are required" });
  }

  const filePath = path.join(__dirname,"..", "data", subject, `${level}.json`);

  if (!fs.existsSync(filePath)) {
    console.log("❌ File not found:", filePath);
    return res.status(404).json({ success: false, message: "Quiz file not found" });
  }

  try {
    const rawData = fs.readFileSync(filePath);
    const questions = JSON.parse(rawData);

    res.json({
      success: true,
      subject,
      level,
      questions
    });
  } catch (err) {
    console.error("❌ Error reading quiz file:", err);
    res.status(500).json({ success: false, message: "Error loading quiz file", error: err.message });
  }
});

/* POST login route */
router.post('/login', function(req, res, next) {
  console.log('🔥 LOGIN ROUTE HIT');
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.error('❌ Login error:', err);
      return res.status(500).json({ success: false, message: 'Login error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or invalid password' });
    }
    req.logIn(user, async function(err) {
      if (err) {
        console.error('❌ Session error:', err);
        return res.status(500).json({ success: false, message: 'Login error' });
      }
      try {
        const fresh = await userModel.findById(req.user._id);
        req.user = fresh;
      } catch (_) {}
      console.log('✅ User logged in:', req.user.username);
      return res.json({
        success: true,
        message: 'Login successful!',
        user: {
          username: req.user.username,
          fullName: req.user.fullName,
          email: req.user.email,
          profilePicture: req.user.profilePicture
        }
      });
    });
  })(req, res, next);
});

/* POST logout route */
router.post('/logout', function (req, res) {
  console.log('🔥 LOGOUT ROUTE HIT');

  req.logout(function (err) {
    if (err) {
      console.error('❌ Logout error (logout stage):', err);
      return res.status(500).json({ success: false, message: 'Logout error' });
    }

    req.session.destroy((err2) => {
      if (err2) {
        console.error('❌ Logout error (session destroy):', err2);
        return res.status(500).json({ success: false, message: 'Logout error' });
      }

      res.clearCookie('sid', { path: '/' });
      console.log('✅ User logged out and session destroyed');
      return res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

/* ---------- PROGRESS ROUTES (Per-user, per-subject) ---------- */

/**
 * GET /progress?subject=python
 * Returns { success, subject, highestUnlocked }
 * Requires authentication
 */
router.get('/progress', isLoggedIn, async (req, res) => {
  try {
    const subject = String(req.query.subject || '').trim();
    if (!subject) {
      return res.status(400).json({ success: false, message: 'subject is required' });
    }
    const highestUnlocked = getSubjectProgress(req.user, subject);
    return res.json({ success: true, subject, highestUnlocked });
  } catch (e) {
    console.error('❌ GET /progress error:', e);
    return res.status(500).json({ success: false, message: 'Progress fetch error' });
  }
});

/**
 * POST /progress
 * Body: { subject, highestUnlocked }
 * Idempotent update; allows only step-by-step unlock.
 */
router.post('/progress', isLoggedIn, async (req, res) => {
  try {
    const subject = String(req.body.subject || '').trim();
    const proposed = Number(req.body.highestUnlocked);

    if (!subject) {
      return res.status(400).json({ success: false, message: 'subject is required' });
    }
    if (!Number.isFinite(proposed) || proposed < 1) {
      return res.status(400).json({ success: false, message: 'highestUnlocked must be a positive number' });
    }

    const current = getSubjectProgress(req.user, subject);

    if (proposed < current) {
      return res.json({ success: true, subject, highestUnlocked: current });
    }
    if (proposed > current + 1) {
      return res.status(400).json({ success: false, message: 'Cannot skip levels' });
    }

    await setSubjectProgress(req.user, subject, proposed);
    const updated = getSubjectProgress(req.user, subject);
    return res.json({ success: true, subject, highestUnlocked: updated });
  } catch (e) {
    console.error('❌ POST /progress error:', e);
    return res.status(500).json({ success: false, message: 'Progress update error' });
  }
});

/* Debug route */
router.get('/debug/routes', function(req, res) {
  const routes = [
    'GET /',
    'GET /profile',
    'POST /register',
    'POST /login',
    'POST /logout',
    'GET /quiz',
    'GET /progress',
    'POST /progress',
    'GET /auth/google',
    'GET /auth/google/callback',
    'GET /auth/google/failure',
    'GET /me'
  ];

  res.json({
    success: true,
    routes: routes,
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

module.exports = router;
