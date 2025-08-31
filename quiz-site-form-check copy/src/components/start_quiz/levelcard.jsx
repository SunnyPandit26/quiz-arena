import React from 'react';
import styles from './LevelCard.module.css';

const LevelCard = ({ level, types, onStart, locked = false }) => {
  return (
    <div className={styles.box}>
      <div>
        <div className={styles.level}>{level}</div>
        <div className={styles.subtitle}>{types}</div>
      </div>

      <button
        className={`${styles.button} ${locked ? styles.locked : styles.start}`}
        disabled={locked}
        onClick={onStart}
      >
        {locked ? 'Locked' : 'Start'}
      </button>
    </div>
  );
};

export default LevelCard;
