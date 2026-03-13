// routes/usernameSetup.js - 100% FIXED (passport-local-mongoose method)
const express = require('express');
const router = express.Router();
const User = require('./users'); // Your perfect model
const passport = require('passport');

router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 3) {
      return res.json({ available: false, message: 'Username 3+ chars' });
    }
    const existing = await User.findOne({ username: username.trim() });
    res.json({ success: true, available: !existing });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// 🔥 FIXED: Use User.register() - Official passport-local-mongoose method
router.post('/set-username-password', async (req, res) => {
  try {
    const { userId, username, password } = req.body;
    console.log('🔧 Setup user:', username);

    // Find existing Google/temp user
    const user = await User.findById(userId);
    if (!user || (!user.tempGoogleUser && !user.username.startsWith('guest_'))) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check username availability
    const cleanUsername = username.trim();
    const existingUser = await User.findOne({ 
      username: cleanUsername, 
      _id: { $ne: userId } 
    });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username taken' });
    }

    // 🔥 OFFICIAL: Update username + register password (passport-local-mongoose)
    user.username = cleanUsername;
    user.fullName = cleanUsername;
    
    // CRITICAL: Use User.register() - Creates proper hash format!
    await User.register(user, password);
    
    user.tempGoogleUser = false;
    user.isSetupComplete = true;
    await user.save();

    console.log(`✅ Setup COMPLETE: ${user.username} (passport hash)`);

    // Passport auto-login
    req.login(user, (err) => {
      if (err) {
        console.error('❌ Auto-login error:', err);
        return res.status(500).json({ success: false, message: 'Login failed' });
      }
      
      res.json({ 
        success: true, 
        message: 'Account setup complete! 🎉',
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName
        }
      });
    });

  } catch (error) {
    console.error('❌ Setup ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
