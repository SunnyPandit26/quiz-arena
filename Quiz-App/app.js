require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users'); // User model yahan se

const app = express();

// MongoDB Connection FIRST with options
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quiz_app_database', {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  bufferCommands: false, // Buffering disable
  family: 4  // IPv4 only
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// SINGLE CORS
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// SINGLE BODY PARSERS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SINGLE MIDDLEWARE
app.use(require('morgan')('dev'));
app.use(require('cookie-parser')());
app.use(express.static(path.join(__dirname, 'public')));

// SINGLE SESSION
app.use(session({
  secret: process.env.SESSION_SECRET || "heloo",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    sameSite: 'lax', 
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// FIXED Passport using User model
const User = require('./routes/users'); // User model
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// 404 & Error handlers (last)
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  next(createError(404));
});

module.exports = app;
