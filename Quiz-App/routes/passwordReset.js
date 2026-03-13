// routes/passwordReset.js - FIXED PASSWORD COMPATIBILITY
const express = require('express');
const router = express.Router();
const User = require('../routes/users');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp) => {
  try {
    console.log('🚀 Sending to:', email, 'OTP:', otp);
    
    const { data, error } = await resend.emails.send({
      from: 'Quiz App <onboarding@resend.dev>',
      to: [email],
      subject: '🔐 Quiz App Password Reset OTP',
      html: `<h1 style="font-size: 48px; text-align: center;">${otp}</h1>`
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }
    console.log('✅ Email sent:', data?.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    throw error;
  }
};

// 🔥 FIXED: Send OTP (TEMP - console output)
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password →', email);
    
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) {
      return res.json({ success: true, message: '✅ OTP sent!' });
    }

    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log('🔥 OTP FOR LOGIN:', otp);  // ← COPY THIS!

    // TEMP: Skip email for testing
    res.json({ 
      success: true, 
      message: '✅ OTP ready! Check SERVER CONSOLE above 👆' 
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false });
  }
});

// 🔥 CRITICAL FIX: Use passport-local-mongoose User.setPassword()
router.post('/verify-reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('🔑 Reset attempt:', email, otp);
    
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Verify OTP
    if (!user.resetOTP || user.resetOTP !== otp || new Date() > user.resetOTPExpiry) {
      return res.status(400).json({ success: false, message: '❌ Invalid/expired OTP' });
    }

    // 🔥 FIXED: passport-local-mongoose method (NOT bcrypt!)
    user.setPassword(newPassword, async (err) => {
      if (err) {
        console.error('❌ setPassword error:', err);
        return res.status(500).json({ success: false, message: 'Password update failed' });
      }

      // Clear OTP fields
      user.resetOTP = null;
      user.resetOTPExpiry = null;
      await user.save();

      console.log('✅ PASSWORD RESET SUCCESS:', user.username, 'New format: passport-local-mongoose');
      
      res.json({ 
        success: true, 
        message: '✅ Password reset successful! Try login now.' 
      });
    });

  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
