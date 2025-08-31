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

/* TEST ROUTES - NO AUTHENTICATION REQUIRED */
router.get('/test-graph', async (req, res) => {
  console.log('🔥 Test graph route hit!');
  
  try {
    const testScript = `
import sys
import os
import json

try:
    print("Starting Python test...", file=sys.stderr)
    
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    
    print("Matplotlib imported successfully!", file=sys.stderr)
    
    # Simple test plot
    plt.figure(figsize=(8, 6))
    plt.plot([1, 2, 3, 4], [1, 4, 9, 16], 'bo-', linewidth=2, markersize=8)
    plt.title('Test Plot - Python is Working!', fontsize=16, fontweight='bold')
    plt.xlabel('X values', fontsize=12)
    plt.ylabel('Y values', fontsize=12)
    plt.grid(True, alpha=0.3)
    
    # Save to quiz_results folder
    save_path = r'${path.join(__dirname, '..', 'quiz_results').replace(/\\/g, '\\\\')}'
    if not os.path.exists(save_path):
        os.makedirs(save_path)
        print(f"Created directory: {save_path}", file=sys.stderr)
    
    plot_file = os.path.join(save_path, 'test_plot.png')
    plt.savefig(plot_file, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    
    print(f"Plot saved to: {plot_file}", file=sys.stderr)
    
    # Verify file exists
    if os.path.exists(plot_file):
        file_size = os.path.getsize(plot_file)
        print(f"File created successfully. Size: {file_size} bytes", file=sys.stderr)
    else:
        raise FileNotFoundError("Plot file was not created")
    
    result = {
        "success": True, 
        "message": "Test plot created successfully!", 
        "file": "test_plot.png",
        "path": plot_file,
        "size": file_size
    }
    print(json.dumps(result))
    
except ImportError as e:
    error_result = {"success": False, "error": f"Import error: {str(e)}"}
    print(json.dumps(error_result))
    
except Exception as e:
    error_result = {"success": False, "error": f"General error: {str(e)}"}
    print(json.dumps(error_result))
`;

    const scriptPath = path.join(__dirname, '..', 'test_script.py');
    fs.writeFileSync(scriptPath, testScript);

    const { spawn } = require('child_process');
    const python = spawn('python3', [scriptPath]);
    
    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python stdout:', data.toString());
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
      console.log('Python stderr:', data.toString());
    });

    python.on('close', (code) => {
      try { fs.unlinkSync(scriptPath); } catch(e) {}
      
      console.log('Python exit code:', code);
      console.log('Python output:', output);
      console.log('Python error:', error);
      
      let result;
      try {
        result = JSON.parse(output.trim());
      } catch(e) {
        result = { success: false, parseError: e.message };
      }
      
      res.json({
        success: code === 0,
        exitCode: code,
        pythonResult: result,
        pythonOutput: output,
        pythonError: error,
        testImageUrl: (code === 0 && result.success) ? 'http://localhost:3000/quiz_results/test_plot.png' : null,
        timestamp: new Date().toISOString()
      });
    });

    python.on('error', (spawnError) => {
      console.log('Python spawn error:', spawnError);
      res.json({
        success: false,
        spawnError: spawnError.message,
        message: 'Failed to spawn Python process'
      });
    });

  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Simple test working!',
    timestamp: new Date().toISOString(),
    server: 'Express is running'
  });
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

/* POST submit quiz results - COMPLETE FIX WITH MISSING QUESTIONS HANDLING */
router.post('/submit-quiz', isLoggedIn, async (req, res) => {
  try {
    const { subject, level, answers, questions, score, totalQuestions } = req.body;
    
    if (!subject || !level || !answers || !questions) {
      return res.status(400).json({ success: false, message: 'Missing required data' });
    }

    console.log('🔥 Quiz submission for:', req.user.username, 'Score:', score, '/', totalQuestions);

    // Create complete CSV data with all question numbers
    const completeCSVData = [];
    const timestamp = new Date().toISOString();
    
    // Ensure all questions from 1 to totalQuestions are represented
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
    console.log('✅ CSV saved with complete question data');

    // 🔥 FIXED: Generate safe JSON for Python (replace lowercase booleans)
    const questionDataJSON = JSON.stringify(completeCSVData.map(q => ({ num: q.questionNumber, correct: q.isCorrect })));
    const safeQuestionData = questionDataJSON.replace(/"true"/g, 'True').replace(/"false"/g, 'False').replace(/true/g, 'True').replace(/false/g, 'False');

    // Generate Python graph
    const plotFileName = `plot_${req.user._id}_${Date.now()}.png`;
    const plotPath = path.join(csvDir, plotFileName);
    
    const pythonScript = `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import json
import sys

try:
    correct = ${score}
    total = ${totalQuestions}
    incorrect = total - correct
    percentage = int((correct / total) * 100)
    
    print(f"Creating graph: {correct}/{total} = {percentage}%", file=sys.stderr)
    
    # Create chart
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Pie chart
    if incorrect > 0:
        sizes = [correct, incorrect]
        labels = ['Correct', 'Incorrect']  
        colors = ['#4CAF50', '#f44336']
        explode = (0.1, 0)
        ax1.pie(sizes, explode=explode, labels=labels, colors=colors, 
                autopct='%1.0f%%', shadow=True, startangle=90,
                textprops={'fontsize': 12, 'weight': 'bold'})
    else:
        ax1.pie([correct], labels=['Correct'], colors=['#4CAF50'], 
                autopct='%1.0f%%', startangle=90,
                textprops={'fontsize': 12, 'weight': 'bold'})
    
    status = "PASSED ✓" if percentage >= 70 else "FAILED ✗"
    status_color = '#4CAF50' if percentage >= 70 else '#f44336'
    ax1.set_title(f'${subject.toUpperCase()} Level ${level}\\n{status} - {percentage}%', 
                 fontsize=14, fontweight='bold', color=status_color)
    
    # Bar chart with COMPLETE question range (FIXED)
    question_data = ${safeQuestionData}
    
    if question_data:
        # Create complete question range from 1 to total
        all_question_nums = list(range(1, total + 1))
        all_correct_flags = []
        
        # Map existing question data to complete range
        existing_data = {q['num']: q['correct'] for q in question_data}
        
        for q_num in all_question_nums:
            # Use actual data if exists, otherwise False (incorrect)
            all_correct_flags.append(existing_data.get(q_num, False))
        
        colors_bar = ['#4CAF50' if correct else '#f44336' for correct in all_correct_flags]
        
        # Create bars for ALL questions (1 to total)
        bars = ax2.bar(all_question_nums, [1]*len(all_question_nums), color=colors_bar, 
                       alpha=0.8, edgecolor='white', linewidth=2)
        
        # Add symbols on bars
        for i, (bar, correct) in enumerate(zip(bars, all_correct_flags)):
            height = bar.get_height()
            symbol = '✓' if correct else '✗'
            ax2.text(bar.get_x() + bar.get_width()/2., height/2,
                    symbol, ha='center', va='center', 
                    fontsize=16, fontweight='bold', color='white')
        
        # Set x-axis to show ALL question numbers
        ax2.set_xticks(all_question_nums)
        ax2.set_xlim(0.5, total + 0.5)
    
    ax2.set_xlabel('Question Number', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Result', fontsize=12, fontweight='bold')
    ax2.set_title('Question-wise Performance', fontsize=14, fontweight='bold')
    ax2.set_ylim(-0.1, 1.2)
    ax2.grid(axis='y', alpha=0.3)
    
    plt.tight_layout(pad=3.0)
    plt.savefig('${plotPath.replace(/\\/g, '/')}', dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    
    print(f"Graph saved successfully!", file=sys.stderr)
    print(json.dumps({"success": True, "filename": "${plotFileName}"}))
    
except Exception as e:
    import traceback
    print(f"Error: {e}", file=sys.stderr)
    print(traceback.format_exc(), file=sys.stderr)
    print(json.dumps({"success": False, "error": str(e)}))
`;

    // Execute Python
    const scriptPath = path.join(__dirname, '..', `temp_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, pythonScript);
    console.log('✅ Python script created');
    
    const { spawn } = require('child_process');
    const python = spawn('python3', [scriptPath]);
    
    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python output:', data.toString());
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
      console.log('Python error:', data.toString());
    });

    python.on('close', (code) => {
      try { fs.unlinkSync(scriptPath); } catch(e) {}
      
      console.log('🔍 Python finished with code:', code);
      console.log('🔍 Output:', output);
      console.log('🔍 Error:', error);
      
      if (code === 0 && output.includes('success')) {
        const fileExists = fs.existsSync(plotPath);
        console.log('📊 Plot file exists:', fileExists);
        
        res.json({
          success: true,
          message: 'Quiz submitted with graph',
          plotPath: plotFileName,
          results: { 
            score, 
            total: totalQuestions, 
            percentage: Math.round((score/totalQuestions) * 100) 
          },
          debugInfo: {
            plotExists: fileExists,
            plotPath: plotPath,
            pythonOutput: output,
            pythonError: error
          }
        });
      } else {
        res.json({
          success: true,
          message: 'Quiz submitted (graph failed)',
          error: error || 'Unknown error',
          debugInfo: {
            exitCode: code,
            pythonOutput: output,
            pythonError: error
          }
        });
      }
    });

    python.on('error', (spawnError) => {
      console.error('❌ Python spawn failed:', spawnError);
      res.json({
        success: true,
        message: 'Quiz submitted (Python spawn failed)',
        spawnError: spawnError.message
      });
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

/* GET detailed quiz results - COMPLETE FIX FOR HISTORY GRAPHS */
/* GET detailed quiz results - ULTIMATE FIX FOR ACCURATE GRAPHS */
router.get('/quiz-details', isLoggedIn, (req, res) => {
  try {
    const { subject, level, timestamp } = req.query;
    
    if (!subject || !level || !timestamp) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    console.log('🔥 ULTIMATE FIX: Quiz details requested:', { subject, level, timestamp });

    const csvPath = path.join(__dirname, '..', 'quiz_results', `quiz_results_${req.user._id}.csv`);
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found:', csvPath);
      return res.json({ success: false, message: 'No quiz data found' });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    if (lines.length <= 1) {
      return res.json({ success: false, message: 'No quiz data found' });
    }
    
    const headers = lines[0].split(',');
    const questions = [];
    let testSummary = null;

    // 🔥 ENHANCED: More flexible timestamp matching
    const normalizeTimestamp = (ts) => {
      try {
        return new Date(ts).getTime();
      } catch (e) {
        return 0;
      }
    };

    const requestTimestamp = normalizeTimestamp(timestamp);
    console.log('🔍 ULTIMATE: Looking for timestamp:', timestamp, '→', requestTimestamp);

    // Strategy: Try flexible timestamp matching first
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values || values.length !== headers.length) continue;
        
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/"/g, '') : '';
        });

        const rowTimestamp = normalizeTimestamp(row.timestamp);
        const timeDifference = Math.abs(rowTimestamp - requestTimestamp);
        
        // Flexible matching with 10 seconds tolerance
        if (row.subject?.toLowerCase().trim() === subject.toLowerCase().trim() && 
            parseInt(row.level?.toString().trim()) === parseInt(level.toString().trim()) && 
            timeDifference < 10000) {
          
          console.log('✅ ULTIMATE: Found match for question:', {
            questionNumber: row.questionNumber,
            isCorrect: row.isCorrect,
            subject: row.subject,
            level: row.level
          });
          
          questions.push({
            questionNumber: parseInt(row.questionNumber),
            question: row.question || 'Missing Question',
            userAnswer: row.userAnswer || 'Not Answered',
            correctAnswer: row.correctAnswer || 'N/A',
            isCorrect: row.isCorrect === 'true' || row.isCorrect === true
          });

          if (!testSummary) {
            testSummary = {
              totalScore: parseInt(row.totalScore) || 0,
              totalQuestions: parseInt(row.totalQuestions) || 1,
              percentage: Math.round((parseInt(row.totalScore) / parseInt(row.totalQuestions)) * 100) || 0
            };
          }
        }
      } catch (e) {
        console.error('Error parsing CSV line:', e);
        continue;
      }
    }

    // Sort and ensure complete question range
    questions.sort((a, b) => a.questionNumber - b.questionNumber);

    // 🔥 CRITICAL: Fill missing questions to complete the set
    if (testSummary && testSummary.totalQuestions > 0) {
      const filledQuestions = [];
      for (let i = 1; i <= testSummary.totalQuestions; i++) {
        const existing = questions.find(q => q.questionNumber === i);
        filledQuestions.push(
          existing || {
            questionNumber: i,
            question: "Missing Question Data",
            userAnswer: "Not Answered",
            correctAnswer: "N/A",
            isCorrect: false
          }
        );
      }
      questions.splice(0, questions.length, ...filledQuestions);
    }

    console.log('✅ ULTIMATE: Final questions processed:', questions.length);
    console.log('✅ ULTIMATE: Test summary:', testSummary);
    console.log('✅ ULTIMATE: Question correctness:', questions.map(q => ({num: q.questionNumber, correct: q.isCorrect})));

    if (questions.length === 0 || !testSummary) {
      console.log('❌ ULTIMATE: No matching test data found');
      return res.json({ 
        success: false, 
        message: 'No test data found for the specified parameters'
      });
    }

    // Generate safe filename
    const safeTimestamp = timestamp.replace(/[:.]/g, '_');
    const plotFileName = `ultimate_plot_${req.user._id}_${safeTimestamp}_${Date.now()}.png`;
    const plotPath = path.join(__dirname, '..', 'quiz_results', plotFileName);
    
    console.log('📊 ULTIMATE: Plot filename:', plotFileName);
    
    // Generate safe JSON for Python
    const questionDataJSON = JSON.stringify(questions);
    const safeQuestionData = questionDataJSON
      .replace(/"true"/g, 'True')
      .replace(/"false"/g, 'False')
      .replace(/true/g, 'True')
      .replace(/false/g, 'False');

    console.log('🔥 ULTIMATE: Generating accurate graph...');

    // 🔥 ULTIMATE Python script with PERFECT mapping
    const pythonScript = `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import json
import sys
import os

try:
    correct = ${testSummary.totalScore}
    total = ${testSummary.totalQuestions}
    incorrect = total - correct
    percentage = ${testSummary.percentage}
    
    print(f"🔥 ULTIMATE Graph Generation: {correct}/{total} = {percentage}%", file=sys.stderr)
    
    # Ensure directory exists
    plot_dir = os.path.dirname(r'${plotPath.replace(/\\/g, '\\\\')}')
    os.makedirs(plot_dir, mode=0o755, exist_ok=True)
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Pie chart (this should be working correctly)
    if incorrect > 0:
        sizes = [correct, incorrect]
        labels = ['Correct', 'Incorrect']  
        colors = ['#4CAF50', '#f44336']
        explode = (0.1, 0)
        ax1.pie(sizes, explode=explode, labels=labels, colors=colors, 
                autopct='%1.0f%%', shadow=True, startangle=90,
                textprops={'fontsize': 12, 'weight': 'bold'})
    else:
        ax1.pie([correct], labels=['Correct'], colors=['#4CAF50'], 
                autopct='%1.0f%%', startangle=90,
                textprops={'fontsize': 12, 'weight': 'bold'})
    
    status = "PASSED ✓" if percentage >= 70 else "FAILED ✗"
    status_color = '#4CAF50' if percentage >= 70 else '#f44336'
    ax1.set_title(f'${subject.toUpperCase()} Level ${level} - ULTIMATE\\n{status} - {percentage}%', 
                 fontsize=14, fontweight='bold', color=status_color)
    
    # 🔥 ULTIMATE Bar chart with PERFECT question mapping
    question_data = ${safeQuestionData}
    
    print(f"ULTIMATE: Question data length: {len(question_data)}", file=sys.stderr)
    
    if question_data and len(question_data) > 0:
        # 🔥 CRITICAL: Create ordered correctness array
        all_question_nums = list(range(1, total + 1))
        all_correct_flags = []
        
        # Print debug info
        print("ULTIMATE: Question data received:", file=sys.stderr)
        for q in question_data:
            print(f"  Q{q['questionNumber']}: {q['isCorrect']}", file=sys.stderr)
        
        # 🔥 PERFECT mapping: For each question number, find its correctness
        for q_num in all_question_nums:
            found_correctness = False
            for q in question_data:
                if q.get('questionNumber') == q_num:
                    found_correctness = q.get('isCorrect', False)
                    break
            all_correct_flags.append(found_correctness)
            print(f"ULTIMATE: Q{q_num} -> {found_correctness}", file=sys.stderr)
        
        print(f"ULTIMATE: Final correctness array: {all_correct_flags}", file=sys.stderr)
        print(f"ULTIMATE: Total correct should be: {sum(all_correct_flags)}, Expected: {correct}", file=sys.stderr)
        
        # Verify correctness count matches
        actual_correct = sum(all_correct_flags)
        if actual_correct != correct:
            print(f"⚠️ MISMATCH: Actual correct {actual_correct} != Expected {correct}", file=sys.stderr)
        
        # Color mapping
        colors_bar = ['#4CAF50' if flag else '#f44336' for flag in all_correct_flags]
        
        # Create bars
        bars = ax2.bar(all_question_nums, [1]*len(all_question_nums), color=colors_bar, 
                       alpha=0.8, edgecolor='white', linewidth=2)
        
        # Add symbols with proper mapping
        for i, (bar, correct_flag) in enumerate(zip(bars, all_correct_flags)):
            height = bar.get_height()
            symbol = '✓' if correct_flag else '✗'
            ax2.text(bar.get_x() + bar.get_width()/2., height/2,
                    symbol, ha='center', va='center', 
                    fontsize=16, fontweight='bold', color='white')
        
        ax2.set_xticks(all_question_nums)
        ax2.set_xlim(0.5, total + 0.5)
    else:
        print("❌ ULTIMATE: No question data available", file=sys.stderr)
        ax2.text(0.5, 0.5, 'No Question Data\\nAvailable', 
                ha='center', va='center', transform=ax2.transAxes,
                fontsize=14, color='red')
    
    ax2.set_xlabel('Question Number', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Result', fontsize=12, fontweight='bold')
    ax2.set_title('Question-wise Performance - ULTIMATE', fontsize=14, fontweight='bold')
    ax2.set_ylim(-0.1, 1.2)
    ax2.grid(axis='y', alpha=0.3)
    
    plt.tight_layout(pad=3.0)
    
    # Save plot
    plot_path = r'${plotPath.replace(/\\/g, '\\\\')}'
    print(f"ULTIMATE: Saving to: {plot_path}", file=sys.stderr)
    plt.savefig(plot_path, dpi=200, bbox_inches='tight', 
                facecolor='white', edgecolor='none', format='png')
    plt.close()
    
    # Verify creation
    if os.path.exists(plot_path):
        file_size = os.path.getsize(plot_path)
        print(f"✅ ULTIMATE SUCCESS: Graph saved: {file_size} bytes", file=sys.stderr)
        print(json.dumps({"success": True, "filename": "${plotFileName}"}))
    else:
        raise FileNotFoundError("ULTIMATE FAILURE: Plot file was not created")
    
except Exception as e:
    import traceback
    print(f"❌ ULTIMATE ERROR: {e}", file=sys.stderr)
    print(traceback.format_exc(), file=sys.stderr)
    print(json.dumps({"success": False, "error": str(e)}))
`;

    // Execute Python
    const scriptPath = path.join(__dirname, '..', `ultimate_graph_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, pythonScript);
    console.log('✅ ULTIMATE: Python script created');
    
    const { spawn } = require('child_process');
    const python = spawn('python3', [scriptPath]);
    
    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
      console.log('ULTIMATE Python stdout:', data.toString());
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
      console.log('ULTIMATE Python stderr:', data.toString());
    });

    python.on('close', (code) => {
      try { fs.unlinkSync(scriptPath); } catch(e) {}
      
      console.log('🔍 ULTIMATE: Python finished:', code);
      
      let graphPath = null;
      if (code === 0 && output.includes('success')) {
        const fileExists = fs.existsSync(plotPath);
        console.log('📊 ULTIMATE: Graph exists:', fileExists);
        if (fileExists) {
          graphPath = plotFileName;
        }
      }
      
      res.json({ 
        success: true, 
        details: { 
          questions: questions,
          subject: subject,
          level: level,
          timestamp: timestamp,
          summary: testSummary,
          plotPath: graphPath,
          debugInfo: {
            plotFileName: plotFileName,
            fileExists: fs.existsSync(plotPath),
            pythonExitCode: code,
            questionsProcessed: questions.length,
            ultimateSuccess: !!graphPath,
            questionCorrectness: questions.map(q => ({num: q.questionNumber, correct: q.isCorrect}))
          }
        } 
      });
    });

    python.on('error', (spawnError) => {
      console.error('❌ ULTIMATE: Python spawn error:', spawnError);
      res.json({ 
        success: true, 
        details: { 
          questions: questions,
          subject: subject,
          level: level,
          timestamp: timestamp,
          summary: testSummary,
          plotPath: null,
          error: spawnError.message
        } 
      });
    });

  } catch (error) {
    console.error('❌ ULTIMATE: Quiz details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'ULTIMATE FAILURE: Quiz details processing failed', 
      error: error.message 
    });
  }
});


/* Serve generated plots */
router.get('/plot/:filename', (req, res) => {
  const filename = req.params.filename;
  const plotPath = path.join(__dirname, '..', 'quiz_results', filename);
  
  console.log('🔥 Plot request for:', filename);
  console.log('Looking for file at:', plotPath);
  
  if (fs.existsSync(plotPath)) {
    res.sendFile(path.resolve(plotPath));
  } else {
    console.log('❌ Plot file not found:', plotPath);
    res.status(404).json({ success: false, message: 'Plot not found' });
  }
});

/* Debug route to check quiz questions count */

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
    'POST /submit-quiz',
    'GET /plot/:filename',
    'GET /quiz-history',
    'GET /quiz-details',
    'GET /test-graph (NO LOGIN)',
    'GET /test-simple (NO LOGIN)',
    'GET /auth/google',
    'GET /auth/google/callback',
    'GET /auth/google/failure',
    'GET /me',
    'GET /debug/quiz/:subject/:level'
  ];

  res.json({
    success: true,
    routes: routes,
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

module.exports = router;
