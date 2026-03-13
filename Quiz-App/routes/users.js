const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: String, // ✅ Passport-local-mongoose के लिए जरूरी
  fullName: String,
  email: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true }, // ✅ Google OAuth के लिए
  profilePicture: String,
  progress: [
    {
      subject: { type: String, required: true },
      highestUnlocked: { type: Number, required: true, default: 1 }
    }
  ],
  // OTP Reset Fields
  resetOTP: { type: String, default: null },
  resetOTPExpiry: { type: Date, default: null },
  // ✅ Username setup flags
  tempGoogleUser: { type: Boolean, default: false }, // Google temp user flag
  isSetupComplete: { type: Boolean, default: false }, // Setup complete flag
  createdAt: { type: Date, default: Date.now }
}, { 
  collection: 'users',
  timestamps: true 
});

// ✅ Passport-local-mongoose plugin (password hashing automatic)
userSchema.plugin(plm, {
  usernameField: 'username',
  passwordField: 'password',
  errorMessages: {
    MissingPasswordError: 'Password is required',
    AttemptTooSoonError: 'Too many failed login attempts. Try again later.',
    TooManyAttemptsError: 'Account locked due to too many failed login attempts.',
    NoSaltValueStoredError: 'Authentication not possible. No salt value stored.',
    IncorrectPasswordError: 'Incorrect username or password.'
  }
});

// ✅ Export model with static methods
const User = mongoose.model('User', userSchema, 'users');
module.exports = User;
