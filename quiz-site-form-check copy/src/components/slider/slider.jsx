import React, { useState, useEffect, useRef } from 'react';
import styles from "./slider.module.css";
import { GrFormPrevious } from "react-icons/gr";
import { MdNavigateNext } from "react-icons/md";
const Slider = () => {
  // Slide data - same as your original structure
  const slides = [
    {
      image: "/images/photo3.jpg",
      author: "Author",
      title: "course 1",
      topic: "topic name", 
      description: "description..........",
      thumbnailTitle: "name slider",
      thumbnailDesc: "description....."
    },
    {
      image: "/images/photo4.jpg", 
      author: "",
      title: "course 2",
      topic: "topic name",
      description: "description..........",
      thumbnailTitle: "name slider", 
      thumbnailDesc: "description....."
    },
    {
      image: "/images/photo5.jpg",
      author: "",
      title: "course 3", 
      topic: "topic name",
      description: "description..........",
      thumbnailTitle: "name slider",
      thumbnailDesc: "description....."
    },
    {
      image: "/images/photo6.jpg",
      author: "",
      title: "course 4",
      topic: "topic name", 
      description: "description..........",
      thumbnailTitle: "name slider",
      thumbnailDesc: "description....."
    },
    {
      image: "/images/photo7.jpg",
      author: "",
      title: "course 5",
      topic: "topic name",
      description: "description..........",
      thumbnailTitle: "name slider", 
      thumbnailDesc: "description....."
    }
  ];

  // State to manage slides order (same as DOM manipulation in original)
  const [currentSlides, setCurrentSlides] = useState(slides);
  const [carouselClass, setCarouselClass] = useState('');
  
  // Refs for timeouts (same as original variables)
  const runTimeOutRef = useRef(null);
  const runAutoRunRef = useRef(null);
  
  // Same timing as original JavaScript
  const timeRunning = 3000;
  const timeAutoNext = 7000;

  // Auto-advance functionality (same as original setTimeout)
  useEffect(() => {
    runAutoRunRef.current = setTimeout(() => {
      handleNext(); // Same as nextDom.click() in original
    }, timeAutoNext);

    return () => {
      if (runAutoRunRef.current) {
        clearTimeout(runAutoRunRef.current);
      }
    };
  }, [currentSlides]);

  // Same showSlider function logic converted to React
  const showSlider = (type) => {
    if (type === 'next') {
      // Same as: listItemDom.appendChild(itemSlider[0])
      setCurrentSlides(prev => {
        const newSlides = [...prev];
        const firstItem = newSlides.shift(); // Remove first item
        newSlides.push(firstItem); // Add to end
        return newSlides;
      });
      setCarouselClass('next'); // Same as: carouselDom.classList.add('next')
    } else {
      // Same as: listItemDom.prepend(itemSlider[positionLastItem])
      setCurrentSlides(prev => {
        const newSlides = [...prev];
        const lastItem = newSlides.pop(); // Remove last item
        newSlides.unshift(lastItem); // Add to beginning
        return newSlides;
      });
      setCarouselClass('prev'); // Same as: carouselDom.classList.add('prev')
    }

    // Same timeout logic as original
    if (runTimeOutRef.current) {
      clearTimeout(runTimeOutRef.current);
    }
    
    runTimeOutRef.current = setTimeout(() => {
      setCarouselClass(''); // Same as removing 'next' and 'prev' classes
    }, timeRunning);

    // Same auto-run reset logic
    if (runAutoRunRef.current) {
      clearTimeout(runAutoRunRef.current);
    }
    
    runAutoRunRef.current = setTimeout(() => {
      handleNext(); // Same as nextDom.click()
    }, timeAutoNext);
  };

  // Same as: nextDom.onclick = function(){ showSlider('next'); }
  const handleNext = () => {
    showSlider('next');
  };

  // Same as: prevDom.onclick = function(){ showSlider('prev'); }
  const handlePrev = () => {
    showSlider('prev');
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (runTimeOutRef.current) {
        clearTimeout(runTimeOutRef.current);
      }
      if (runAutoRunRef.current) {
        clearTimeout(runAutoRunRef.current);
      }
    };
  }, []);

  return (
    <div>
      {/* Main carousel - same structure with dynamic class */}
      <div className={`${styles.carousel} ${carouselClass ? styles[carouselClass] : ''}`}>
        <div className={styles.List}>
          {currentSlides.map((slide, index) => (
            <div key={`${slide.image}-${index}`} className={styles.item}>
              <img className={styles.img} src={slide.image} alt={slide.title} />
              <div className={styles.content}>
                <div className={styles.author}>{slide.author}</div>
                <div className={styles.title}>{slide.title}</div>
                <div className={styles.topic}>{slide.topic}</div>
                <div className={styles.des}>{slide.description}</div>
                <div className={styles.buttons}>
                  <button className={styles.btn}>see more</button>
                  <button className={styles.btn}>click here</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnail section - same structure */}
      <div className={styles.thumbnail}>
        {currentSlides.map((slide, index) => (
          <div key={`thumb-${slide.image}-${index}`} className={styles.item1}>
            <img className={styles.img1} src={slide.image} alt={slide.thumbnailTitle} />
            <div className={styles.content1}>
              <div className="title">{slide.thumbnailTitle}</div>
              <div className="des">{slide.thumbnailDesc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows - same IDs and functionality */}
      <div className={styles.arrows}>
        <button 
          className={styles.btn1} 
          id="prev"
          onClick={handlePrev}
        >
          <GrFormPrevious />
        </button>
        <button 
          className={styles.btn1} 
          id="next"
          onClick={handleNext}
        >
          <MdNavigateNext />
        </button>
      </div>

      {/* Progress bar */}
      <div className={styles.time}></div>
    </div>
  );
};

export default Slider;
