import styles from './cards.module.css';

const Card = ({
  title,
  description,
  level,
  imageUrl,
  backgroundImage, // New prop for background image
  onStart, // NEW: click handler
}) => {
  return (
    <div 
      className={styles.courseCard} 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    
    >
      {/* Dark overlay for text readability */}
      <div className={styles.overlay}></div>
      
      {/* Circular course icon */}
      <div className={styles.courseIconContainer}>
        <img 
          src={imageUrl} 
          alt={title} 
          className={styles.courseIcon}
        />
      </div>

      {/* Course title as large white text */}
      <h2 className={styles.courseTitle}>{title}</h2>
      
      {/* Level as colored subtitle */}
      <p className={styles.courseLevel}>{level}</p>

      {/* Description area */}
      <p className={styles.courseDescription}>{description}</p>

      {/* Your existing button */}
      <button className={styles.levelBadge} onClick={onStart}>
        Start Quiz
      </button>
    </div>
  );
};

export default Card;
