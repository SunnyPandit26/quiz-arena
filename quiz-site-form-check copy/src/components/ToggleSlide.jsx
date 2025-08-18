import React from "react";

const ToggleSlide = ({ isActive, setIsActive }) => {
  return (
    <div className="toggle-box">
      <div className="toggle-panel toggle-left">
        <h1>hi !</h1>
        <p>dont have a account ?</p>
        <button 
          className="btn create-accountbtn"
          onClick={() => setIsActive(true)}
        >
          create account
        </button>
      </div>
      
      <div className="toggle-panel toggle-right">
        <h1>welcome back</h1>
        <p>Already have a account ?</p>
        <button 
          className="btn login-btn"
          onClick={() => setIsActive(false)}
        >
          login
        </button>
      </div>
    </div>
  );
};

export default ToggleSlide;
