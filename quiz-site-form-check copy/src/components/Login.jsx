import React from "react";
import { authAPI } from "../services/api";


const Login = ({ onLogin, formData, setFormData, loading }) => {
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  const handleGoogleLogin = () => {
    // This should trigger window.location to your backend /auth/google
    // Ensure authAPI.googleLogin() does that internally
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
          <a href="#" onClick={(e) => e.preventDefault()}>Forgot your password?</a>
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
          aria-busy={loading}
        >
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>

        <p>or login with...</p>

        <div className="social-icons" aria-label="social logins">
          {/* Google Button */}
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
            aria-label="Login with Google"
          >
            <img
              src="/images/google.png"
              alt="Google"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </button>

          
        
        </div>
      </form>
    </div>
  );
};

export default Login;
