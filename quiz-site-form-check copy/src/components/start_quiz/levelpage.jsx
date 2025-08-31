// src/components/start_quiz/Start.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styles from './levelpage.module.css';
import LevelCard from './levelcard';


export default function Levelpage() {
  const navigate  = useNavigate();
  const { subject } = useParams();
  const location  = useLocation();

  const [highest, setHighest] = useState(1);
  const [loading, setLoading] = useState(true);

  // fetch highest unlocked level
// In Start.jsx useEffect
useEffect(() => {
  (async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3000/progress?subject=${encodeURIComponent(subject)}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      console.log('Progress API Response:', data); // ADD THIS
      setHighest(data.highestUnlocked || 1);
      console.log('Highest set to:', data.highestUnlocked || 1); // ADD THIS
    } catch (error) {
      console.error('Progress fetch error:', error); // ADD THIS
      setHighest(1);
    } finally {
      setLoading(false);
    }
  })();
}, [subject, location.key]);


  const boxes = Array.from({ length: 10 }, (_, i) => ({
    label       : `Level ${i + 1}`,
    subtitle    : `Face more questions to become Level ${i + 2}`,
    levelNumber : i + 1,
  }));

  const goToQuiz = (levelNumber) =>
    navigate(`/quiz/${encodeURIComponent(subject)}?level=${levelNumber}`, {
      state: { ts: Date.now() },
    });

  if (loading) return <div className={styles.loading}>Loading levels…</div>;

  return (
    <div className={styles.grid}>
      {boxes.map(({ levelNumber, label, subtitle }) => (
        <LevelCard  // Use LevelCard instead of Box
        key={levelNumber}
        level={label}
        types={subtitle}
        onStart={() => goToQuiz(levelNumber)}
        locked={levelNumber > highest}
      />
      ))}
    </div>
  );
}
