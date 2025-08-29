// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
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

const GOOGLE_CLIENT_ID =
  '1088939610703-aajo5nc7s0i7bi80oqg7ovpvk3dnek39.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
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
