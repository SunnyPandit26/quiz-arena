// src/contexts/AuthContext.jsx - 100% FIXED (Username + Persistent login)
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // 🔥 FIXED: Session refresh (Fixes navbar username + refresh logout)
  const refreshAuth = useCallback(async () => {
    console.log('🔄 Refreshing auth session...');
    try {
      const res = await authAPI.getProfile(); // /me endpoint
      console.log('🔍 /me response:', res);
      
      if (res?.success && res.authenticated && res.user) {
        console.log('✅ Session valid:', res.user.username);
        setUser(res.user);
        return true;
      } else {
        console.log('❌ No valid session');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.log('❌ Session refresh failed:', error.response?.status || error.message);
      setUser(null);
      return false;
    }
  }, []);

  // 🔥 INITIAL AUTH CHECK
  useEffect(() => {
    refreshAuth().finally(() => {
      setLoading(false); // UNBLOCK UI
    });
  }, [refreshAuth]);

  // 🔥 BACKGROUND REFRESH (Every 5min - prevents stale session)
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(refreshAuth, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [refreshAuth, loading]);

  const checkAuth = async () => {
    return await refreshAuth();
  };

  const login = async ({ username, password }) => {
    console.log('🔑 Login attempt:', username);
    try {
      const res = await authAPI.login(username, password);
      if (res?.success) {
        // 🔥 REFRESH after login (syncs with /me)
        const sessionValid = await refreshAuth();
        if (sessionValid) {
          console.log('✅ Login + session sync:', res.user?.username);
          setShowLoginDialog(false);
          return { success: true };
        }
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
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setShowLoginDialog(false);
      window.location.href = "/";
    }
  };

  const requireAuth = async (cb) => {
    if (user) return cb();
    const sessionValid = await refreshAuth();
    if (sessionValid && user) return cb();
    setShowLoginDialog(true);
  };

  // 🔥 EXPOSE refreshAuth for manual calls (username setup)
  const value = useMemo(() => {
    console.log('🔄 AuthContext render:', { 
      user: user?.username || 'null', 
      loading,
      sessionValid: !!user 
    });
    return {
      user,
      loading: false,  // 🔥 FORCE UNBLOCK
      isAuthenticated: !!user,
      login,
      logout,
      requireAuth,
      refreshAuth,     // 🔥 MANUAL REFRESH EXPOSED
      showLoginDialog,
      setShowLoginDialog,
    };
  }, [user, showLoginDialog, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
