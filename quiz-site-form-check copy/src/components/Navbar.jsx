// Navbar.jsx - COMPLETE FIXED CODE (Desktop 3-lines RESTORED)
import React, { useState, useEffect } from 'react';
import { X, Menu, User, LogOut, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
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

  useEffect(() => {
    if (user) {
      fetch('http://localhost:3000/badge', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success) setBadge(data.badge);
          setLoadingBadge(false);
        })
        .catch(() => setLoadingBadge(false));
    }
  }, [user]);

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
      <span className={styles.welcome}>Welcome, {user.fullName}</span>
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
                    Welcome, {user.username}
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
