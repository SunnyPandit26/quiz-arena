import React from "react";
import { authAPI } from "../services/api";

const Login = ({ 
  onLogin, 
  formData, 
  setFormData, 
  loading, 
  showForgotPassword, 
  setShowForgotPassword,
  resetEmail, 
  setResetEmail,
  showOTPFields,  // 👈 NEW PROP
  resetOTP, 
  setResetOTP,
  newPassword, 
  setNewPassword,
  handleSendOTP, 
  handleResetPassword 
}) => {
  
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleResetInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'resetEmail') setResetEmail(value);
    if (name === 'resetOTP') setResetOTP(value);
    if (name === 'newPassword') setNewPassword(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  const handleGoogleLogin = () => {
    authAPI.googleLogin();
  };

  return (
    <div className="form-box login" style={{ zIndex: 3, pointerEvents: 'auto' }}>
      <form onSubmit={handleSubmit} style={{ pointerEvents: 'auto' }}>
        <h2 className="title">Login</h2>

        <div className="input-box">
          <input
            type="text"
            name="username"
            placeholder="username"
            value={formData.username || ''}
            onChange={handleInputChange}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
            required
            disabled={loading}
            autoComplete="username"
          />
        </div>

        <div className="input-box">
          <input
            type="password"
            name="password"
            placeholder="password"
            value={formData.password || ''}
            onChange={handleInputChange}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <div className="forgot-link">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setShowForgotPassword(true);
            }}
          >
            Forgot your password?
          </a>
        </div>

        <button
          type="submit"
          className="submitBtn"
          style={{
            pointerEvents: 'auto',
            zIndex: 10,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>

        <p>or login with...</p>

        <div className="social-icons">
          <button
            type="button"
            className="social google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              pointerEvents: 'auto',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <img
              src="/images/google.png"
              alt="Google"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </button>
        </div>
      </form>

      {/* 👇 FIXED FORGOT PASSWORD FORM */}
      {showForgotPassword && (
        <div className="reset-form-overlay">
          <h3>🔐 Reset Password</h3>
          
          {/* STEP 1: Email Input */}
          {!showOTPFields ? (
            <>
              <div className="input-box">
                <input
                  type="email"
                  name="resetEmail"
                  placeholder="Enter your registered email"
                  value={resetEmail}
                  onChange={handleResetInputChange}
                  style={{ pointerEvents: 'auto' }}
                />
              </div>
              <button
                className="submitBtn"
                onClick={() => handleSendOTP(resetEmail)}
                disabled={loading || !resetEmail}
                style={{ width: '80%', margin: '10px auto', display: 'block' }}
              >
                📧 Send OTP
              </button>
            </>
          ) : (
            /* STEP 2: OTP + New Password */
            <>
              <div className="input-box">
                <input
                  type="text"
                  name="resetOTP"
                  placeholder="Enter 6-digit OTP"
                  value={resetOTP}
                  onChange={handleResetInputChange}
                  maxLength={6}
                  style={{ pointerEvents: 'auto' }}
                />
              </div>
              <div className="input-box">
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={handleResetInputChange}
                  style={{ pointerEvents: 'auto' }}
                  minLength={6}
                />
              </div>
              <button
                className="submitBtn"
                onClick={() => handleResetPassword(resetEmail, resetOTP, newPassword)}
                disabled={loading || resetOTP.length !== 6 || newPassword.length < 6}
                style={{ 
                  width: '80%', 
                  margin: '10px auto', 
                  display: 'block',
                  background: '#28a745'
                }}
              >
                🔒 Reset Password
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowForgotPassword(false)}
            style={{
              width: '80%',
              margin: '10px auto',
              display: 'block',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ❌ Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
