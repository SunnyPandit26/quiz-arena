// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import LoginPage from './components/LoginPage';
import Cards from './components/Cards';
import Quiz from './components/quiz/Quiz';
import Start from './components/start_quiz/Start';

const GOOGLE_CLIENT_ID =
  '1088939610703-aajo5nc7s0i7bi80oqg7ovpvk3dnek39.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/courses" element={<Cards />} />
        <Route path="/start/:subject" element={<Start />} />
        <Route path="/quiz/:subject" element={<Quiz />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GoogleOAuthProvider>
  );
}
 