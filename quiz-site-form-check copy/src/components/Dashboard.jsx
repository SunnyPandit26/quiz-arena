// src/components/Dashboard.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './footer';
import Slider from '/src/components/slider/slider.jsx';
import Cards from './Cards';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, loading } = useAuth();

  // Loading screen (only shows briefly while checking auth status)
  if (loading) return <div className={styles.loader}>Loading...</div>;

  // ✅ MAIN CHANGE: No redirect logic - this is now the public home page
  // ❌ REMOVED: All the authentication checking and redirect logic
  // ❌ REMOVED: handleLogout function (now handled in AuthContext)
  // ❌ REMOVED: useEffect with authAPI.getProfile()
  // ❌ REMOVED: user state management (now from AuthContext)

  return (
    <div className={styles.dashboard}>
    
      
      <section className={styles.hero}>
        <Slider />
      </section>

      {/* Cards Content - Now accessible to everyone */}
      <main className={styles.main}>
        <div className={styles.cardsWrap}>
          <Cards />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
