// src/components/start_quiz/Box.jsx
import React from 'react';

const Box = ({ level, types, onStart, locked = false }) => {
  return (
    <div
      style={{
        background: '#0b1220',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        color: '#e6e9ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 800 }}>{level}</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{types}</div>
      </div>

      <button
        disabled={locked}
        onClick={onStart}
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          border: 'none',
          fontWeight: 800,
          cursor: locked ? 'not-allowed' : 'pointer',
          background: locked ? '#5b6070' : '#ffd700',
          color: locked ? '#1b1f2a' : '#0b1220',
        }}
      >
        {locked ? 'Locked' : 'Start'}
      </button>
    </div>
  );
}

export default  Box;
