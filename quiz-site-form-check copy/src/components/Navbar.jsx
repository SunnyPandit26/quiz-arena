import React, { useState } from 'react';
import { X, Menu, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();           // user === null when guest

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      await logout();                           // AuthContext clears state & redirects
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className={styles.navbar}>
  <div className={styles.navbarContainer}>

    {/* ── 1.  LEFT GROUP:  Logo + Welcome ── */}
    <div className={styles.leftGroup}>
      <div className={styles.navbarLogo}>
        <span>MyBrand</span>
      </div>

      {user && (
        <span className={styles.welcomeText}>
          Welcome,&nbsp;{user.username}
        </span>
      )}
    </div>

    {/* ── 2.  CENTER:  Page links ── */}
    <div className={styles.navbarLinks}>
      <a href="/"     className={styles.navLink}>Home</a>
      <a href="#about"    className={styles.navLink}>About Us</a>
      <a href="#services" className={styles.navLink}>Services</a>
      <a href="#featured" className={styles.navLink}>Featured</a>
      <a href="#contact"  className={styles.navLink}>Contact Me</a>
    </div>

    {/* ── 3.  RIGHT GROUP:  Icons + Logout ── */}
    <div className={styles.navbarActions}>
      <button className={styles.iconBtn}>
        <Search size={18}/>
      </button>

      {user && (
        <button className={styles.iconBtn} title={user.username}>
          <User size={18}/>
        </button>
      )}

      {user && (
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={18}/> Logout
        </button>
      )}

      <button
        className={styles.mobileMenuBtn}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>
    </div>
  </div>

  


      {/* ───── Mobile overlay ───── */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuContent}>
            <a href="/"     className={styles.mobileNavLink} onClick={toggleMenu}>Home</a>
            <a href="#about"    className={styles.mobileNavLink} onClick={toggleMenu}>About Us</a>
            <a href="#services" className={styles.mobileNavLink} onClick={toggleMenu}>Services</a>
            <a href="#featured" className={styles.mobileNavLink} onClick={toggleMenu}>Featured</a>
            <a href="#contact"  className={styles.mobileNavLink} onClick={toggleMenu}>Contact Me</a>

            {user && (
              <>
                <div className={styles.mobileWelcomeText}>
                  Welcome,&nbsp;{user.username}
                </div>
                <button
                  onClick={() => { handleLogout(); toggleMenu(); }}
                  className={styles.mobileLogoutBtn}
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
