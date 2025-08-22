// src/components/Cards.jsx (only the navigate target changed)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import styles from './cards.module.css';

const courses = [
  { id: 'python', title: 'Python', description: '...', level: 'Start Quiz', imageUrl: '/images/image1.jpg' },
  { id: 'java', title: 'Java', description: '...', level: 'Start Quiz', imageUrl: '/images/java.png' },
  { id: 'webdev', title: 'Web Development', description: '...', level: 'Start Quiz', imageUrl: '/images/courses/webdev.jpg'},
  { id: 'r', title: 'R Programming', description: '...', level: 'Start Quiz', imageUrl: '/images/courses/r.jpg' },
  { id: 'julia', title: 'Julia', description: '...', level: 'Start Quiz', imageUrl: '/images/courses/julia.jpg' },
  { id: 'cpp', title: 'C++', description: '...', level: 'Start Quiz', imageUrl: '/images/courses/cpp.jpg' },
];

export default function Cards() {
  const navigate = useNavigate();
  const goToLevels = (subject) => navigate(`/start/${encodeURIComponent(subject)}`);

  return (
    <section className={styles.grid}>
      {courses.map((course) => (
        <Card
          key={course.id}
          title={course.title}
          description={course.description}
          level="Start Quiz"
          imageUrl={course.imageUrl}
         
          onStart={() => goToLevels(course.id)}
        />
      ))}
    </section>
  );
}
