// ✅ COMPLETE UsernameSetup.jsx - FIXED + AuthContext Integration
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';  // ✅ AuthContext added
import './loginpage.css';

const UsernameSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { forceRefresh } = useAuth();  // ✅ For instant navbar update
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [message, setMessage] = useState('');

  // ✅ FIXED: Correct API endpoint (no /api/username prefix)
  const checkUsernameAvailability = async (name) => {
    try {
      setAvailability(null);
      const response = await fetch('http://localhost:3000/username/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name })
      });
      
      const result = await response.json();
      setAvailability(!result.exists);
      setMessage(result.message);
    } catch (error) {
      console.error('Username check error:', error);
      setAvailability(false);
      setMessage('❌ Network error. Please try again.');
    }
  };

  // Real-time username check (debounced)
  useEffect(() => {
    if (username.length < 3) {
      setAvailability(null);
      setMessage('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // ✅ FIXED: Correct endpoint + Auth Integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!availability) {
      setMessage('❌ Please choose an available username');
      return;
    }
    if (password.length < 6) {
      setMessage('❌ Password must be 6+ characters');
      return;
    }

    setLoading(true);
    try {
      const userId = searchParams.get('userId');
      
      if (!userId) {
        setMessage('❌ Invalid session. Please login again.');
        setLoading(false);
        return;
      }

      console.log('🚀 Submitting username setup:', { userId: userId.substring(0,10)+'...', username });

      const response = await fetch('http://localhost:3000/username/set-username-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ Session cookies
        body: JSON.stringify({ 
          userId,
          username: username.trim(),
          password,
          email: '' // Optional
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('🎉 Username setup success:', result.user.username);
        
        // ✅ INSTANT UPDATE - Trigger AuthContext
        sessionStorage.setItem('user', JSON.stringify(result.user));
        window.dispatchEvent(new CustomEvent('userUpdated', { 
          detail: result.user 
        }));
        
        // ✅ Force refresh for Navbar
        if (forceRefresh) {
          await forceRefresh();
        }
        
        setMessage(`✅ Welcome, ${result.user.username}! Redirecting...`);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setMessage(result.message || '❌ Setup failed');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', paddingTop: '60px' }}>
      <style>{`
        .username-container { max-width: 450px; margin: 0 auto; padding: 20px; }
        .availability-badge {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .available { background: linear-gradient(45deg, #28a745, #20c997); }
        .taken { background: linear-gradient(45deg, #dc3545, #fd7e14); }
        .checking { background: linear-gradient(45deg, #ffc107, #fd7e14); color: black; }
        .input-group { 
          position: relative; 
          margin-bottom: 25px; 
        }
        .submitBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="username-container">
        <div className="container" style={{ height: 'auto', minHeight: '600px' }}>
          <div className="form-box" style={{ 
            width: '100%', 
            padding: '40px 30px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <form onSubmit={handleSubmit}>
              <h2 className="title" style={{ 
                fontSize: '32px', 
                marginBottom: '10px',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🎮 Complete Setup
              </h2>
              <p style={{ 
                color: '#666', 
                textAlign: 'center', 
                marginBottom: '30px',
                fontSize: '16px'
              }}>
                Choose your unique username & password to start playing:
              </p>

              {/* Username Input */}
              <div className="input-group">
                <input
                  type="text"
                  placeholder="sunnygamer123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  maxLength={20}
                  minLength={3}
                  style={{ 
                    width: '100%', 
                    padding: '18px 60px 18px 18px',
                    fontSize: '18px',
                    fontWeight: '500',
                    borderRadius: '15px',
                    border: availability === false ? '2px solid #dc3545' : 
                           availability === true ? '2px solid #28a745' : 
                           '2px solid #e1e5e9',
                    background: availability === false ? '#fff5f5' :
                               availability === true ? '#f0fff4' : 'white',
                    transition: 'all 0.3s ease',
                    boxShadow: availability ? '0 4px 12px rgba(40,167,69,0.2)' : 
                              availability === false ? '0 4px 12px rgba(220,53,69,0.2)' : 'none'
                  }}
                  disabled={loading}
                  autoFocus
                />
                {availability !== null && (
                  <div className={`availability-badge ${availability === null ? 'checking' : 
                                 availability ? 'available' : 'taken'}`}>
                    {availability === null ? '⏳' : 
                     availability ? '✓' : '✗'}
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Choose strong password (6+ chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  style={{ 
                    width: '100%', 
                    padding: '18px',
                    fontSize: '18px',
                    fontWeight: '500',
                    borderRadius: '15px',
                    border: password.length >= 6 ? '2px solid #28a745' : '2px solid #e1e5e9',
                    background: password.length >= 6 ? '#f0fff4' : 'white',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={loading}
                />
              </div>

              {/* Message */}
              {message && (
                <div style={{
                  padding: '15px 20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  margin: '20px 0',
                  fontWeight: '600',
                  fontSize: '16px',
                  background: message.includes('✅') ? 
                    'linear-gradient(45deg, #d4edda, #c3e6cb)' : 
                    'linear-gradient(45deg, #f8d7da, #f5c6cb)',
                  color: message.includes('✅') ? '#155724' : '#721c24',
                  border: `3px solid ${message.includes('✅') ? '#28a745' : '#dc3545'}`,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  animation: 'pulse 2s infinite'
                }}>
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit"
                className="submitBtn"
                style={{
                  width: '100%',
                  marginTop: '20px',
                  background: loading ? '#6c757d' : 
                             availability && username.length >= 3 && password.length >= 6 ? 
                             'linear-gradient(45deg, #667eea, #764ba2)' : '#6c757d',
                  color: 'white',
                  fontSize: '18px',
                  padding: '18px',
                  fontWeight: '600',
                  borderRadius: '15px',
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(102,126,234,0.4)'
                }}
                disabled={loading || !availability || username.length < 3 || password.length < 6}
              >
                {loading ? '🎯 Creating Account...' : '🚀 Create Account & Start Playing!'}
              </button>

              {/* Back Link */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '25px', 
                paddingTop: '20px',
                borderTop: '1px solid #eee'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    fontSize: '16px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '500'
                  }}
                  disabled={loading}
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetup;
