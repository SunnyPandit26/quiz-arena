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

/* ---------- PROGRESS ROUTES ---------- */

/* GET progress route */
router.get('/progress', isLoggedIn, async (req, res) => {
  try {
    const subject = String(req.query.subject || '').trim();
    if (!subject) {
      return res.status(400).json({ success: false, message: 'subject is required' });
    }
    const highestUnlocked = getSubjectProgress(req.user, subject);
    console.log('🔥 GET Progress:', { subject, highestUnlocked, userId: req.user._id });
    return res.json({ success: true, subject, highestUnlocked });
  } catch (e) {
    console.error('❌ GET /progress error:', e);
    return res.status(500).json({ success: false, message: 'Progress fetch error' });
  }
});

/* POST progress route */
router.post('/progress', isLoggedIn, async (req, res) => {
  try {
    const subject = String(req.body.subject || '').trim();
    const proposed = Number(req.body.highestUnlocked);

    console.log('🔥 POST Progress Update:', { subject, proposed, userId: req.user._id });

    if (!subject) {
      return res.status(400).json({ success: false, message: 'subject is required' });
    }
    if (!Number.isFinite(proposed) || proposed < 1) {
      return res.status(400).json({ success: false, message: 'highestUnlocked must be a positive number' });
    }

    const current = getSubjectProgress(req.user, subject);
    console.log('Current progress:', current, 'Proposed:', proposed);

    if (proposed < current) {
      return res.json({ success: true, subject, highestUnlocked: current });
    }
    if (proposed > current + 1) {
      return res.status(400).json({ success: false, message: 'Cannot skip levels' });
    }

    await setSubjectProgress(req.user, subject, proposed);
    const updated = getSubjectProgress(req.user, subject);
    console.log('✅ Progress updated to:', updated);
    
    return res.json({ success: true, subject, highestUnlocked: updated });
  } catch (e) {
    console.error('❌ POST /progress error:', e);
    return res.status(500).json({ success: false, message: 'Progress update error' });
  }
});

/* POST submit quiz results - SIMPLIFIED (No Python) */
router.post('/submit-quiz', isLoggedIn, async (req, res) => {
  try {
    const { subject, level, answers, questions, score, totalQuestions } = req.body;
    
    if (!subject || !level || !answers || !questions) {
      return res.status(400).json({ success: false, message: 'Missing required data' });
    }

    console.log('🔥 Quiz submission for:', req.user.username, 'Score:', score, '/', totalQuestions);

    // Create complete CSV data
    const completeCSVData = [];
    const timestamp = new Date().toISOString();

    for (let i = 1; i <= totalQuestions; i++) {
      const questionIndex = i - 1;
      const question = questions[questionIndex];
      
      completeCSVData.push({
        userId: req.user._id,
        username: req.user.username,
        subject: subject,
        level: level,
        questionNumber: i,
        question: question ? question.question.replace(/"/g, '""') : 'Missing Question',
        userAnswer: answers[questionIndex] || 'Not Answered',
        correctAnswer: question ? question.correct : 'N/A',
        isCorrect: question ? (answers[questionIndex] === question.correct) : false,
        timestamp: timestamp,
        totalScore: score,
        totalQuestions: totalQuestions
      });
    }

    const csvDir = path.join(__dirname, '..', 'quiz_results');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
      console.log('✅ Created quiz_results directory');
    }

    const csvFileName = `quiz_results_${req.user._id}.csv`;
    const csvFilePath = path.join(csvDir, csvFileName);
    const csvHeaders = Object.keys(completeCSVData[0]).join(',') + '\n';
    const csvRows = completeCSVData.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    const csvContent = fs.existsSync(csvFilePath) ? csvRows + '\n' : csvHeaders + csvRows + '\n';
    
    fs.appendFileSync(csvFilePath, csvContent);
    console.log('✅ CSV saved successfully');

    const percentage = Math.round((score / totalQuestions) * 100);
    
    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      results: { 
        score, 
        total: totalQuestions, 
        percentage 
      },
      csvPath: csvFileName
    });

  } catch (error) {
    console.error('❌ Submit quiz error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* GET quiz history */
router.get('/quiz-history', isLoggedIn, (req, res) => {
  try {
    const csvPath = path.join(__dirname, '..', 'quiz_results', `quiz_results_${req.user._id}.csv`);
    
    if (!fs.existsSync(csvPath)) {
      return res.json({ success: true, history: [] });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length <= 1) {
      return res.json({ success: true, history: [] });
    }
    
    const headers = lines[0].split(',');
    const attempts = new Map();

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values || values.length !== headers.length) continue;
        
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/"/g, '') : '';
        });

        const attemptKey = `${row.subject}_${row.level}_${row.timestamp}`;
        if (!attempts.has(attemptKey)) {
          attempts.set(attemptKey, {
            subject: row.subject,
            level: parseInt(row.level),
            timestamp: row.timestamp,
            totalScore: parseInt(row.totalScore),
            totalQuestions: parseInt(row.totalQuestions),
            percentage: Math.round((parseInt(row.totalScore) / parseInt(row.totalQuestions)) * 100)
          });
        }
      } catch (e) {
        console.error('Error parsing CSV line:', e);
        continue;
      }
    }

    const uniqueHistory = Array.from(attempts.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, history: uniqueHistory });
  } catch (error) {
    console.error('❌ Get history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get history' });
  }
});

// ADD THIS TO YOUR index.js (before module.exports)

/* GET user badge */
router.get('/badge', isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    if (!user.progress || !Array.isArray(user.progress)) {
      return res.json({ success: true, badge: null });
    }

    // Count completed levels across all subjects
    let totalLevelsCompleted = 0;
    let totalSubjects = 0;

    user.progress.forEach(prog => {
      totalSubjects++;
      totalLevelsCompleted += prog.highestUnlocked || 0;
    });

    // Badge Logic
    let badge = null;
    if (totalLevelsCompleted >= 25) badge = { name: 'PLATINUM ARCHITECT', symbol: '🏆', color: '#ffd700' };
    else if (totalLevelsCompleted >= 15) badge = { name: 'GOLD MASTER', symbol: '🥇', color: '#ffd700' };
    else if (totalLevelsCompleted >= 10) badge = { name: 'SILVER SPARK', symbol: '🥈', color: '#c0c0c0' };
    else if (totalLevelsCompleted >= 5) badge = { name: 'BRONZE BUILDER', symbol: '🥉', color: '#cd7f32' };
    else if (totalSubjects >= 1) badge = { name: 'THE SPARK', symbol: '✨', color: '#4e54c8' };

    res.json({ 
      success: true, 
      badge,
      stats: { totalLevels: totalLevelsCompleted, totalSubjects }
    });
  } catch (e) {
    console.error('Badge fetch error:', e);
    res.status(500).json({ success: false, message: 'Badge fetch failed' });
  }
});


module.exports = router;
