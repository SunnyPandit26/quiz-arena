import React, { useState, useEffect, useRef } from 'react';
import styles from './Slider.module.css';
import { GrFormPrevious } from 'react-icons/gr';
import { MdNavigateNext } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
// Path fix ke sath AuthContext import
import { useAuth } from '../../contexts/AuthContext'; 

const Slider = () => {
  const slides = [
    {
      id: 1,
      image: '/images/image1.jpg',
      author: 'John Smith',
      title: 'Python Programming',
      topic: 'Learn Coding',
      description: 'Master Python from basics to advanced concepts. Build real projects and gain practical experience.',
      thumbnailTitle: 'Python Course',
      thumbnailDesc: 'Beginner to Advanced',
    },
    {
      id: 2,
      image: '/images/image2.png',
      author: 'Sarah Johnson',
      title: 'Web Development',
      topic: 'Frontend Skills',
      description: 'Create stunning websites with HTML, CSS, JavaScript and modern frameworks like React.',
      thumbnailTitle: 'Web Dev Course',
      thumbnailDesc: 'Full Stack Focus',
    },
    {
      id: 3,
      image: '/images/image4.png',
      author: 'Mike Wilson',
      title: 'Data Science',
      topic: 'Analytics & AI',
      description: 'Dive deep into data analysis, machine learning, and artificial intelligence concepts.',
      thumbnailTitle: 'Data Science',
      thumbnailDesc: 'ML & Analytics',
    },
    {
      id: 4,
      image: '/images/image3.png',
      author: 'Emma Davis',
      title: 'Mobile Apps',
      topic: 'React Native',
      description: 'Build cross-platform mobile applications for iOS and Android using React Native.',
      thumbnailTitle: 'Mobile Dev',
      thumbnailDesc: 'Cross Platform',
    },
  ];

  const [currentSlides, setCurrentSlides] = useState(slides);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const autoPlayRef = useRef(null);
  const navigate = useNavigate();
  
  // Auth state access
  const { user } = useAuth();

  const ANIMATION_DURATION = 600;
  const AUTO_PLAY_DELAY = 5000;

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setTimeout(() => {
      if (!isAnimating) nextSlide();
    }, AUTO_PLAY_DELAY);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlides(prev => {
      const arr = [...prev];
      const first = arr.shift();
      arr.push(first);
      return arr;
    });
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      startAutoPlay();
    }, ANIMATION_DURATION);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlides(prev => {
      const arr = [...prev];
      const last = arr.pop();
      arr.unshift(last);
      return arr;
    });
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      startAutoPlay();
    }, ANIMATION_DURATION);
  };

  const handleThumbnailClick = clickedIndex => {
    if (isAnimating || clickedIndex === 0) return;
    setIsAnimating(true);
    stopAutoPlay();
    setCurrentSlides(prev => {
      const arr = [...prev];
      const clicked = arr[clickedIndex];
      const before = arr.slice(0, clickedIndex);
      const after = arr.slice(clickedIndex + 1);
      return [clicked, ...after, ...before];
    });
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      startAutoPlay();
    }, ANIMATION_DURATION);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.sliderWrapper}>
        {currentSlides.map((slide, index) => (
          <div
            key={`${slide.id}-${index}`}
            className={`${styles.slide} ${index === 0 ? styles.active : ''}`}
          >
            <div className={styles.mediaBox}>
              <img
                src={slide.image}
                alt={slide.title}
                className={styles.slideImage}
                loading="eager"
              />
            </div>

            <div className={styles.slideContent}>
              <div className={styles.author}>{slide.author}</div>
              <h1 className={styles.title}>{slide.title}</h1>
              <h2 className={styles.topic}>{slide.topic}</h2>
              <p className={styles.description}>{slide.description}</p>

              {/* FIXED: Agar user login HAI, to ye pura section hi nahi dikhega */}
              {!user && (
                <div className={styles.buttonGroup}>
                  <button className={styles.primaryBtn} onClick={() => navigate('/login')}>
                    Login/Signup
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.thumbnails}>
        {currentSlides.slice(0, 3).map((slide, index) => (
          <div
            key={`thumb-${slide.id}-${index}`}
            className={`${styles.thumbnail} ${
              index === 0 ? styles.activeThumbnail : ''
            } ${!isAnimating ? styles.clickable : ''}`}
            onClick={() => handleThumbnailClick(index)}
          >
            <img
              src={slide.image}
              alt={slide.thumbnailTitle}
              className={styles.thumbnailImage}
              loading="lazy"
            />
            <div className={styles.thumbnailContent}>
              <h4 className={styles.thumbnailTitle}>{slide.thumbnailTitle}</h4>
              <p className={styles.thumbnailDesc}>{slide.thumbnailDesc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.navigation}>
        <button className={styles.navBtn} onClick={prevSlide} disabled={isAnimating}>
          <GrFormPrevious />
        </button>
        <button className={styles.navBtn} onClick={nextSlide} disabled={isAnimating}>
          <MdNavigateNext />
        </button>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progress}></div>
      </div>
    </div>
  );
};

export default Slider;