var express = require('express');
var router = express.Router();
const userModel = require('./users');

const passport = require('passport');
const LocalStrategy = require("passport-local");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport Local Strategy
passport.use(new LocalStrategy(userModel.authenticate()));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google OAuth Profile:', profile.id, profile.emails[0].value);
      
      let user = await userModel.findOne({ googleId: profile.id });
      
      if (user) {
        console.log('✅ Existing Google user found:', user.username);
        return done(null, user);
      }
      
      user = await userModel.findOne({ email: profile.emails[0].value });
      
      if (user) {
        user.googleId = profile.id;
        user.profilePicture = profile.photos.value;
        await user.save();
        console.log('✅ Linked Google account to existing user:', user.username);
        return done(null, user);
      }
      
      user = new userModel({
        googleId: profile.id,
        username: profile.emails[0].value,
        fullName: profile.displayName,
        email: profile.emails[0].value,
        profilePicture: profile.photos.value
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

/* GET home page */
router.get('/', function(req, res, next) {
  console.log('✅ Home route accessed');
  res.render('index', { title: 'Quiz App' });
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

// Google OAuth routes
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
  function(req, res) {
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

/* POST register route - COMPLETELY FIXED */
router.post('/register', async function (req, res) {
  console.log('🔥 REGISTRATION ROUTE HIT');
  console.log('==== DEBUG REGISTER BODY ====');
  console.log('Raw request body:', req.body);
  console.log('Content-Type header:', req.get('content-type'));
  
  try {
    // Extract data with multiple fallbacks
    const newUsername = req.body.newUsername || req.body.username;
    const email = req.body.email;
    const newPassword = req.body.newPassword || req.body.password;
    
    console.log('Extracted values:');
    console.log('- newUsername:', newUsername);
    console.log('- email:', email);
    console.log('- newPassword:', newPassword ? 'PROVIDED' : 'MISSING');
    
    // Validation
    if (!newUsername || typeof newUsername !== 'string' || newUsername.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
        debug: { body: req.body, extracted: { newUsername, email, newPassword: !!newPassword } }
      });
    }
    
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        debug: { body: req.body, extracted: { newUsername, email, newPassword: !!newPassword } }
      });
    }
    
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        debug: { body: req.body, extracted: { newUsername, email, newPassword: !!newPassword } }
      });
    }
    
    // Clean data
    const cleanUsername = newUsername.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = newPassword.trim();
    
    // Check existing user
    const existingUser = await userModel.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === cleanEmail ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create user with explicit field assignment
    const userData = new userModel();
    userData.username = cleanUsername;
    userData.fullName = cleanUsername;
    userData.email = cleanEmail;
    
    console.log('Creating user with data:', {
      username: userData.username,
      fullName: userData.fullName,
      email: userData.email
    });

    // Register user
    const registeredUser = await userModel.register(userData, cleanPassword);
    console.log('✅ User registered successfully:', registeredUser.username);

    // Auto login
    req.login(registeredUser, (err) => {
      if (err) {
        console.error('❌ Auto-login error:', err);
        return res.status(500).json({
          success: false,
          message: 'User created but login failed',
          error: err.message
        });
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
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Username'} already exists`
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: err.message,
      debug: {
        body: req.body,
        errorDetails: err
      }
    });
  }
});

/* POST login route */
router.post('/login', function(req, res, next) {
  console.log('🔥 LOGIN ROUTE HIT');
  console.log('Body:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.error('❌ Login error:', err);
      return res.status(500).json({
        success: false,
        message: 'Login error'
      });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        console.error('❌ Session error:', err);
        return res.status(500).json({
          success: false,
          message: 'Login error'
        });
      }
      console.log('✅ User logged in:', user.username);
      return res.json({
        success: true,
        message: 'Login successful!',
        user: {
          username: user.username,
          fullName: user.fullName,
          email: user.email
        }
      });
    });
  })(req, res, next);
});

/* POST logout route */
router.post('/logout', function (req, res, next) {
  console.log('🔥 LOGOUT ROUTE HIT');
  req.logout(function (err) { 
    if (err) { 
      console.error('❌ Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Logout error'
      });
    }
    console.log('✅ User logged out');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/* Debug route */
router.get('/debug/routes', function(req, res) {
  const routes = [
    'GET /',
    'GET /profile',
    'POST /register',
    'POST /login',
    'POST /logout',
    'GET /auth/google',
    'GET /auth/google/callback',
    'GET /auth/google/failure'
  ];
  
  res.json({
    success: true,
    routes: routes,
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: 'Not authenticated'
  });
}

module.exports = router;
