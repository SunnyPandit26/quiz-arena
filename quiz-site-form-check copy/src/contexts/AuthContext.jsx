// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  // starts true, blocks rendering
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res?.success) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      setUser(null);
    }
    // ✅ CRITICAL: Only set loading false AFTER auth check completes
    setLoading(false);
  };

  const login = async ({ username, password }) => {
    console.log('🔑 Login starting...');
    try {
      const res = await authAPI.login(username, password);
      if (res?.success) {
        console.log('✅ Login successful, setting user:', res.user);
        setUser(res.user);
        setShowLoginDialog(false);
        console.log('✅ User state updated');
        return { success: true };
      }
      return { success: false, message: res?.message || "Login failed" };
    } catch (err) {
      console.error("Login failed:", err);
      return { success: false, message: "Login failed" };
    }
  };
  

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setShowLoginDialog(false);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const requireAuth = async (cb) => {
    if (user) return cb();
    await checkAuth();
    if (user) return cb();
    setShowLoginDialog(true);
  };

  // Also add this to see when components re-render
const value = useMemo(() => {
  console.log('🔄 AuthContext value updated:', { user: !!user, isAuthenticated: !!user });
  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    requireAuth,
    showLoginDialog,
    setShowLoginDialog,
  };
}, [user, loading, showLoginDialog]);

  // ✅ Block ALL rendering until auth check finishes
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
