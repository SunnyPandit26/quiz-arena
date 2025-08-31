import React, { useState } from "react";
import Login from "./Login";
import CreateAccount from "./CreateAccount";
import ToggleSlide from "./ToggleSlide";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from "../services/api";
import "./loginpage.css";

// Popup style
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
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isActive, setIsActive] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    newUsername: "",
    email: "",
    newPassword: ""
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogin = async (loginData) => {
    if (!loginData.username || !loginData.password) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await login({ 
        username: loginData.username, 
        password: loginData.password 
      });
      
      if (result.success) {
        showMessage("Login successful", "success");
        setFormData(prev => ({ ...prev, username: "", password: "" }));
        navigate('/');
      } else {
        showMessage(result.message || "Login failed", "error");
      }
    } catch (error) {
      showMessage("Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

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
    </>
  );
};

export default LoginPage;
