import "./App.css";
import React from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from "./components/LoginPage";
import "bootstrap/dist/css/bootstrap.min.css"

function App() {
  return (
    <GoogleOAuthProvider GOOGLE_CLIENT_ID="1088939610703-aajo5nc7s0i7bi80oqg7ovpvk3dnek39.apps.googleusercontent.com">
      <LoginPage/>
    </GoogleOAuthProvider>
  );
}

export default App;
