import React from "react";
import { authAPI } from "../services/api";

const CreateAccount = ({ onCreateAccount, formData, setFormData, loading }) => {
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateAccount(formData);
  };

  const handleGoogleLogin = () => {
    authAPI.googleLogin();
  };

  return (
    <div className="form-box create-account" style={{ zIndex: 3, pointerEvents: 'auto' }}>
      <form onSubmit={handleSubmit} style={{ pointerEvents: 'auto' }}>
        <h2 className="title">CREATE ACCOUNT</h2>
        <div className="input-box">
          <input
            type="text"
            name="newUsername"
            placeholder="username"
            value={formData.newUsername || ''}
            onChange={handleInputChange}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
            required
            disabled={loading}
          />
        </div>
        <div className="input-box">
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            value={formData.email || ''}
            onChange={handleInputChange}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
            required
            disabled={loading}
          />
        </div>
        <div className="input-box">
          <input
            type="password"
            name="newPassword"
            placeholder="password"
            value={formData.newPassword || ''}
            onChange={handleInputChange}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
            required
            disabled={loading}
          />
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
          {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
        </button>
        <p>or make account with...</p>
         <div className="social-icons">
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
          >
            <img 
              src="/images/google.png" 
              alt="Google"
              style={{
                width: '24px',
                height: '24px',
                objectFit: 'contain'
              }}
            />
          </button>
          
         
          
        
        </div>
      </form>
    </div>
  );
};

export default CreateAccount;
