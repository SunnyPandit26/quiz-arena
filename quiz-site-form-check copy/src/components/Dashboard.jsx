import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './footer';
import Slider from '/src/components/slider/slider.jsx';
import Cards from './Cards';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      
      <section>
        <Slider />
      </section>

      <main>
        <Cards />
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
