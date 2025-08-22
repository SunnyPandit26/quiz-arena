import styles from './cards.module.css';

const Card = ({
  title = 'Python',
  description = 'Learn programming fundamentals such as variables, control flow, and loops with the...',
  level = 'Start Quiz',
  imageUrl = '/images/courses/python.jpg',
  onStart, // NEW: click handler
}) => {
  return (
    <div className={styles.courseCard}>
      <div className={styles.courseImageContainer}>
        <img src={imageUrl} alt={title} className={styles.courseImage} />
      
      </div>

      <h2 className={styles.courseTitle}>{title}</h2>

      <p className={styles.courseDescription}>{description}</p>

      <button className={styles.levelBadge} onClick={onStart}>
        {level}
      </button>
    </div>
  );
};

export default Card;
