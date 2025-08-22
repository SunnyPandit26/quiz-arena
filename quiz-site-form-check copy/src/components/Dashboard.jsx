import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import Navbar from './Navbar';
import Footer from './footer';
import Slider from '/src/components/slider/slider.jsx';
import Cards from './Cards';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    (async () => {
      try {
        const response = await authAPI.getProfile();
        if (response?.success) setUser(response.user);
      } catch {
        console.error('Not authenticated');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      window.location.href = '/';
    } catch {
      console.error('Logout failed');
    }
  };

  // Loading screen
  if (loading) return <div className={styles.loader}>Loading...</div>;

  // If not logged in, redirect
  if (!user) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className={styles.dashboard}>
      <Navbar />

 

    
      <section className={styles.hero}>
        <Slider />
      </section>

      {/* Cards Content */}
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
