import React from 'react';
import styles from './cards.module.css';

const Card = ({
  title,
  description,
  level,
  imageUrl,
  backgroundImage,
  onStart,
}) => {
  return (
    <div
      className={styles.courseCard}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className={styles.overlay}></div>
      
      <div className={styles.courseIconContainer}>
        <img
          src={imageUrl}
          alt={title}
          className={styles.courseIcon}
        />
      </div>

      <h2 className={styles.courseTitle}>{title}</h2>
      <p className={styles.courseLevel}>{level}</p>
      <p className={styles.courseDescription}>{description}</p>

      <button className={styles.levelBadge} onClick={onStart}>
        Start Quiz
      </button>
    </div>
  );
};

export default Card;