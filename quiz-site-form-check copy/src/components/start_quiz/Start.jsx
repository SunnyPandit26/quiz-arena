// src/components/start_quiz/Start.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

function Box({ level, types, onStart, locked = false }) {
  return (
    <div style={{ background:'#0b1220', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:16, color:'#e6e9ef', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
      <div>
        <div style={{ fontWeight: 800 }}>{level}</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{types}</div>
      </div>
      <button disabled={locked} onClick={onStart} style={{ padding:'10px 14px', borderRadius:10, border:'none', fontWeight:800, cursor: locked ? 'not-allowed' : 'pointer', background: locked ? '#5b6070' : '#ffd700', color: locked ? '#1b1f2a' : '#0b1220' }}>
        {locked ? 'Locked' : 'Start'}
      </button>
    </div>
  );
}

export default function Start() {
  const navigate = useNavigate();
  const { subject } = useParams();
  const location = useLocation();
  const [highest, setHighest] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProgress = () => {
    setLoading(true);
    fetch(`http://localhost:3000/progress?subject=${encodeURIComponent(subject)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setHighest(d.highestUnlocked || 1))
      .catch(() => setHighest(1))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProgress();
  }, [subject, location.key]);

  const boxes = Array.from({ length: 100 }, (_, i) => ({
    label: `Level ${i + 1}`,
    subtitle: `Face more questions to become Level ${i + 2}`,
    levelNumber: i + 1
  }));

  const goToQuiz = (levelNumber) => {
    navigate(`/quiz/${encodeURIComponent(subject)}?level=${levelNumber}`, { state: { ts: Date.now() } });
  };

  if (loading) return <div style={{ padding: 16 }}>Loading levels…</div>;

  return (
    <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:16 }}>
      {boxes.map((box) => (
        <Box
          key={box.levelNumber}
          level={box.label}
          types={box.subtitle}
          onStart={() => goToQuiz(box.levelNumber)}
          locked={box.levelNumber > highest}
        />
      ))}
    </div>
  );
}
