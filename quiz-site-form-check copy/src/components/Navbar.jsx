// Navbar.jsx - PERFORMANCE OPTIMIZED (No /me Spam)
import React, { useState, useEffect, useCallback } from 'react';
import { X, Menu, User, LogOut, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, forceRefresh } = useAuth();
  const [badge, setBadge] = useState(null);
  const [loadingBadge, setLoadingBadge] = useState(true);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try { 
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ✅ FIXED: Badge only + Smart refresh (NO interval spam)
  const fetchBadge = useCallback(async () => {
    if (!user) {
      setBadge(null);
      setLoadingBadge(false);
      return;
    }

    // Badge fetch only (lightweight - NO /me)
    fetch('http://localhost:3000/badge', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBadge(data.badge);
        } else {
          setBadge(null);
        }
        setLoadingBadge(false);
      })
      .catch(() => {
        setBadge(null);
        setLoadingBadge(false);
      });
  }, [user?.id]);

  // ✅ PERFECT: Refresh ONLY when user changes
  useEffect(() => {
    fetchBadge();
  }, [fetchBadge]);

  // ✅ OPTIONAL: Manual refresh every 30s (very light)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(fetchBadge, 30000); // 30 seconds only badge
    return () => clearInterval(interval);
  }, [fetchBadge]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#services', label: 'Services' },
    { href: '#featured', label: 'Featured' },
    { href: '#contact', label: 'Contact' },
    { href: 'http://localhost:5173/history', label: 'History' }
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img 
            src="/images/logo2.png"
            alt="Quiz App Logo"
            className={styles.logoImg}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className={styles.logoFallback} style={{ display: 'none' }}>
            Q
          </span>
        </div>

        <ul className={styles.desktopNav}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className={styles.rightSection}>
          {user && (
            <>
              <div className={styles.badgeContainer}>
                {loadingBadge ? (
                  <div className={styles.badgeSkeleton}></div>
                ) : badge ? (
                  <div 
                    className={styles.badge} 
                    style={{ '--badge-color': badge.color }}
                    title={`🎖️ ${badge.name}`}
                  >
                    <span className={styles.badgeSymbol}>{badge.symbol}</span>
                    <span className={styles.badgeName}>{badge.name}</span>
                  </div>
                ) : (
                  <div className={styles.noBadge}>No Badge Yet</div>
                )}
              </div>
              
              {/* ✅ INSTANT USERNAME (from AuthContext) */}
              <span className={styles.welcome}>
                Welcome, <strong>{user.username}</strong>
              </span>
              
              <button className={styles.userBtn} title={user.username}>
                <User size={18} />
              </button> 
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <LogOut size={18} /> Logout
              </button>
            </>
          )}
          
          <button className={`${styles.menuBtn} ${styles.mobileOnly}`} onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a 
                    href={link.href} 
                    className={styles.mobileLink}
                    onClick={toggleMenu}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {user && (
                <>
                  <li className={styles.mobileBadgeSection}>
                    {loadingBadge ? (
                      <div className={styles.badgeSkeleton}></div>
                    ) : badge ? (
                      <div 
                        className={styles.mobileBadge} 
                        style={{ '--badge-color': badge.color }}
                      >
                        <Award size={20} />
                        <span>{badge.name}</span>
                      </div>
                    ) : (
                      <div className={styles.mobileNoBadge}>Earn your first badge! ✨</div>
                    )}
                  </li>
                  
                  <li className={styles.mobileWelcome}>
                    Welcome, <strong>{user.username}</strong>
                  </li>
                  
                  <li>
                    <button 
                      onClick={() => { handleLogout(); toggleMenu(); }}
                      className={styles.mobileLogout}
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
