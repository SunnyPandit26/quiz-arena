const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  fullName: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  googleId: String,
  profilePicture: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  collection: 'users'
});

userSchema.plugin(plm);
module.exports = mongoose.model('User', userSchema, 'users');
