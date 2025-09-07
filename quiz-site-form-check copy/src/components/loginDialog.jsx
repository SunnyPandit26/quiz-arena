import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginDialog.module.css';

const LoginDialog = () => {
  const navigate = useNavigate();
  const { showLoginDialog, setShowLoginDialog } = useAuth();

  const handleLogin = () => {
    navigate('/login');
    setShowLoginDialog(false);
  };

  const handleClose = () => {
    setShowLoginDialog(false);
  };

  if (!showLoginDialog) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Authentication Required</h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <p>Please log in to access this feature</p>
        </div>
        
        <div className={styles.actions}>
          <button onClick={handleLogin} className={styles.loginBtn}>
            Sign In
          </button>
          <button
              onClick={() => {
               navigate('/login?signup=true');
              setShowLoginDialog(false);
               }}
            className={styles.signupBtn}
              >
            Sign Up
          </button>
          <button onClick={handleClose} className={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginDialog;
