import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import styles from './Dashboard.module.css'
import Navbar from './Navbar';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!user) {
    window.location.href = '/';
    return null;
  }

  return (
   <>
    <Navbar />
     <h1>
      hello hwllo
    </h1>
    
   </>
  );
};

export default Dashboard;
