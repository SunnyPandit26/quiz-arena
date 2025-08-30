// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import LoginPage from './components/LoginPage';
import Cards from './components/Cards';
import Quiz from './components/quiz/Quiz';
import Start from './components/start_quiz/Start';
import LoginDialog from './components/loginDialog';
import Dashboard from './components/Dashboard';
import History from './components/History';

function BodyAuthClassSync() {
  const { user } = useAuth();
  useEffect(() => {
    const cls = 'isAuthenticated';
    if (user) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [user]);
  return null;
}

export default function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // from .env
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BodyAuthClassSync />
        <Navbar/>
        <main style={{ marginTop: '60px' }}>
          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/start/:subject" element={<Start />} />
            <Route path="/quiz/:subject" element={<Quiz />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <LoginDialog />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
