// app.js - PASSPORT FIXED VERSION
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const createError = require('http-errors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quiz_app_database', {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  family: 4
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(require('morgan')('dev'));
app.use(require('cookie-parser')());
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 FIXED SESSION (longer expiry)
app.use(session({
  secret: process.env.SESSION_SECRET || "itisquizapp",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    sameSite: 'lax', 
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 30  // 30 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// 🔥 FIXED PASSPORT SETUP - CORRECT WAY
const User = require('./routes/users');
passport.use(User.createStrategy());                    // ✅ Strategy
passport.serializeUser(User.serializeUser());           // ✅ Instance method
passport.deserializeUser(User.deserializeUser());       // ✅ Instance method

console.log('✅ Passport configured correctly');

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Password reset
try {
  const passwordResetRouter = require('./routes/passwordReset');
  app.use('/api/password-reset', passwordResetRouter);
  console.log('✅ Password reset loaded');
} catch (e) {
  console.log('ℹ️ Password reset OK');
}

// Username setup
try {
  const usernameRouter = require('./routes/usernameSetup');
  app.use('/username', usernameRouter);
  console.log('✅ Username setup loaded');
} catch (e) {
  console.log('ℹ️ Username setup OK');
}

// 404 handler
app.use((req, res, next) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  next(createError(404));
});

module.exports = app;
