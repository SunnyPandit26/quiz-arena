// ExitNavbar.jsx
import React, { useState } from 'react';
import { X, Menu, Search, User } from 'lucide-react';
import styles from './navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        {/* Logo */}
        <div className={styles.navbarLogo}>
          <span>Logo</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className={styles.navbarLinks}>
          <a href="#home" className={styles.navLink}>Home</a>
          <a href="#about" className={styles.navLink}>About Us</a>
          <a href="#services" className={styles.navLink}>Services</a>
          <a href="#featured" className={styles.navLink}>Featured</a>
          <a href="#contact" className={styles.navLink}>Contact Me</a>
        </div>

        {/* Right side icons */}
        <div className={styles.navbarActions}>
          <button className={styles.iconBtn}>
            <Search size={18} />
          </button>
          <button className={styles.iconBtn}>
            <User size={18} />
          </button>
          
          {/* Mobile menu toggle */}
          <button 
            className={styles.mobileMenuBtn}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuContent}>
            <a href="#home" className={styles.mobileNavLink} onClick={toggleMenu}>Home</a>
            <a href="#about" className={styles.mobileNavLink} onClick={toggleMenu}>About Us</a>
            <a href="#services" className={styles.mobileNavLink} onClick={toggleMenu}>Services</a>
            <a href="#featured" className={styles.mobileNavLink} onClick={toggleMenu}>Featured</a>
            <a href="#contact" className={styles.mobileNavLink} onClick={toggleMenu}>Contact Me</a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;