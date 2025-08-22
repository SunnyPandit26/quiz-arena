import React, { useState, useEffect } from "react";
import Login from "./Login";
import CreateAccount from "./CreateAccount";
import ToggleSlide from "./ToggleSlide";
import { authAPI } from "../services/api";
import Dashboard from "./Dashboard";

// Popup style (can go in CSS as well)
const popupStyle = {
  position: "fixed",
  top: "30px",
  left: "50%",
  transform: "translateX(-50%)",
  minWidth: "220px",
  maxWidth: "90vw",
  padding: "15px 30px",
  backgroundColor: "#222",
  color: "#fff",
  borderRadius: "8px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  zIndex: 2000,
  fontSize: "16px",
  textAlign: "center",
};

const successStyle = { backgroundColor: "#22b96e" };
const errorStyle = { backgroundColor: "#e82a2a" };

const LoginPage = () => {
  // Toggle state for switching between login and create account
  const [isActive, setIsActive] = useState(false);

  // Shared form data state - compatible with both Login and CreateAccount
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    newUsername: "",
    email: "",
    newPassword: ""
  });

  // User state for authentication
  const [user, setUser] = useState(null);

  // Message state for notifications
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Loading state
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response?.success) {
        setUser({ ...response.user, isLoggedIn: true });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  /* ---------- MESSAGE POPUP LOGIC ---------- */
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  // Handle login submission
  const handleLogin = async (loginData) => {
    if (!loginData.username || !loginData.password) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(loginData.username, loginData.password);
      if (response?.success) {
        // Ensure server session is established by re-checking profile
        await checkAuthStatus();
        showMessage(response.message || "Login successful", "success");
        setFormData(prev => ({ ...prev, username: "", password: "" }));
      } else {
        showMessage(response?.message || "Login failed", "error");
      }
    } catch (error) {
      showMessage(error?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleCreateAccount = async (accountData) => {
    if (!accountData.newUsername || !accountData.email || !accountData.newPassword) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(
        accountData.newUsername,
        accountData.email,
        accountData.newPassword
      );
      if (response?.success) {
        // Ensure session is active after register
        await checkAuthStatus();
        showMessage(response.message || "Account created successfully", "success");
        setFormData(prev => ({ ...prev, newUsername: "", email: "", newPassword: "" }));
        setIsActive(false);
      } else {
        showMessage(response?.message || "Registration failed", "error");
      }
    } catch (error) {
      showMessage(error?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle logout (hard redirect to fully clear client state)
  const handleLogout = async () => {
    setLoading(true);
    try {
      await authAPI.logout(); // must send credentials inside authAPI
      setUser(null);
      showMessage("Logged out successfully", "success");
      setFormData({
        username: "",
        password: "",
        newUsername: "",
        email: "",
        newPassword: ""
      });
      setIsActive(false);
      // Hard redirect ensures any lingering state is cleared
      window.location.href = "/";
    } catch (error) {
      showMessage(error?.message || "Logout failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            ...popupStyle,
            ...(messageType === "success" ? successStyle : errorStyle),
          }}
        >
          {message}
        </div>
      )}

      {user && user.isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <div className="login-page">
          <div className={`container ${isActive ? "active" : ""}`}>
            <div className="form-container">
              <Login
                onLogin={handleLogin}
                formData={formData}
                setFormData={setFormData}
                loading={loading}
              />
              <CreateAccount
                onCreateAccount={handleCreateAccount}
                formData={formData}
                setFormData={setFormData}
                loading={loading}
              />
            </div>
            <ToggleSlide
              isActive={isActive}
              setIsActive={setIsActive}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
