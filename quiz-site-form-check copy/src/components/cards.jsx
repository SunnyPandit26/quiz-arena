import React, { useState, useRef, useEffect } from 'react';
import './cards.css';

const Cards = () => {
  const scrollRef1 = useRef(null);
  const scrollRef2 = useRef(null);
  const [currentPage1, setCurrentPage1] = useState(0);
  const [currentPage2, setCurrentPage2] = useState(0);

  // Sample data for cards with background images and profile photos
  const cardData = [
    {
      id: 1,
      name: "Hans Down",
      title: "Engineer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop",
      description: "I'm looking for something that can deliver a 50-pound payload of snow on a small feminine target. Can you suggest something? Hello...?"
    },
    {
      id: 2,
      name: "Wisteria Widget", 
      title: "Photographer",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b17c?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop",
      description: "Calvin: I'm a genius, but I'm a misunderstood genius. Hobbes: What's misunderstood about you? Calvin: Nobody thinks I'm a genius."
    },
    {
      id: 3,
      name: "Desmond Eagle",
      title: "Accountant",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop",
      description: "If you want to stay dad you've got to polish your image. I think the image we need to create for you is 'repentant but learning'."
    },
    {
      id: 4,
      name: "Alex Thompson",
      title: "Designer",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 5,
      name: "Sarah Wilson",
      title: "Marketing Manager",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=500&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 6,
      name: "Michael Davis",
      title: "Developer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=500&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 7,
      name: "Michael Davis",
      title: "Developer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bgImage: "./images/photo3.jpg",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 8,
      name: "Michael Davis",
      title: "Developer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bgImage: "./images/photo4.jpg",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
  
  ];

  // CORRECTED CALCULATIONS
  const CARD_WIDTH_PX = 256;
  const CARD_MARGIN_PX = 16;
  const ACTUAL_CARD_WIDTH = CARD_WIDTH_PX + CARD_MARGIN_PX;
  const VISIBLE_CARDS = 3;
  const CONTAINER_WIDTH = ACTUAL_CARD_WIDTH * VISIBLE_CARDS;
  const PAGE_WIDTH = CONTAINER_WIDTH;
  const TOTAL_PAGES = Math.ceil(cardData.length / VISIBLE_CARDS);

  // Scroll functions
  const scrollLeft = (scrollRef, currentPage, setCurrentPage) => {
    let newPage;
    if (currentPage === 0) {
      newPage = TOTAL_PAGES - 1;
    } else {
      newPage = currentPage - 1;
    }
    
    setCurrentPage(newPage);
    if (scrollRef.current) {
      scrollRef.current.style.transform = `translateX(-${newPage * PAGE_WIDTH}px)`;
    }
  };

  const scrollRight = (scrollRef, currentPage, setCurrentPage) => {
    let newPage;
    if (currentPage >= TOTAL_PAGES - 1) {
      newPage = 0;
    } else {
      newPage = currentPage + 1;
    }
    
    setCurrentPage(newPage);
    if (scrollRef.current) {
      scrollRef.current.style.transform = `translateX(-${newPage * PAGE_WIDTH}px)`;
    }
  };

  // IMPROVED SMOOTH MOUSE WHEEL SCROLLING
  useEffect(() => {
    let scrollAccumulator1 = 0;
    let lastScrollTime1 = 0;
    let scrollAccumulator2 = 0;
    let lastScrollTime2 = 0;

    const SCROLL_THRESHOLD = 120; // Requires more scrolling to trigger
    const THROTTLE_DELAY = 500; // Longer delay between page changes

    const handleWheel = (e, scrollRef, currentPage, setCurrentPage, isFirstCarousel) => {
      e.preventDefault();
      
      const now = Date.now();
      
      // Use different accumulators for each carousel
      if (isFirstCarousel) {
        // Throttle rapid scroll events
        if (now - lastScrollTime1 < THROTTLE_DELAY) return;
        
        // Accumulate scroll delta
        scrollAccumulator1 += e.deltaY;
        
        // Only trigger page change when threshold is reached
        if (Math.abs(scrollAccumulator1) >= SCROLL_THRESHOLD) {
          if (scrollAccumulator1 > 0) {
            scrollRight(scrollRef, currentPage, setCurrentPage);
          } else {
            scrollLeft(scrollRef, currentPage, setCurrentPage);
          }
          
          // Reset accumulator and update last scroll time
          scrollAccumulator1 = 0;
          lastScrollTime1 = now;
        }
      } else {
        // Second carousel
        if (now - lastScrollTime2 < THROTTLE_DELAY) return;
        
        scrollAccumulator2 += e.deltaY;
        
        if (Math.abs(scrollAccumulator2) >= SCROLL_THRESHOLD) {
          if (scrollAccumulator2 > 0) {
            scrollRight(scrollRef, currentPage, setCurrentPage);
          } else {
            scrollLeft(scrollRef, currentPage, setCurrentPage);
          }
          
          scrollAccumulator2 = 0;
          lastScrollTime2 = now;
        }
      }
    };

    const container1 = scrollRef1.current?.parentElement;
    const container2 = scrollRef2.current?.parentElement;

    const wheelHandler1 = (e) => handleWheel(e, scrollRef1, currentPage1, setCurrentPage1, true);
    const wheelHandler2 = (e) => handleWheel(e, scrollRef2, currentPage2, setCurrentPage2, false);

    if (container1) {
      container1.addEventListener('wheel', wheelHandler1);
    }
    if (container2) {
      container2.addEventListener('wheel', wheelHandler2);
    }

    return () => {
      if (container1) {
        container1.removeEventListener('wheel', wheelHandler1);
      }
      if (container2) {
        container2.removeEventListener('wheel', wheelHandler2);
      }
    };
  }, [currentPage1, currentPage2, TOTAL_PAGES]);

  // Card component - UNCHANGED
  const Card = ({ data }) => (
    <div 
      className="rounded-xl overflow-hidden flex-shrink-0 w-64 mx-2 shadow-2xl card-hover relative"
      style={{
        backgroundImage: `url(${data.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '400px'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20"></div>
      
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg">
          <img 
            src={data.profileImage} 
            alt={data.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center pt-6">
        <h3 className="text-lg font-bold text-white mb-1">{data.name}</h3>
        <p className="text-cyan-400 text-xs font-medium mb-3">{data.title}</p>
        <p className="text-gray-200 text-xs leading-relaxed mb-4 line-clamp-3">
          {data.description}
        </p>
        
        <div className="flex gap-2 justify-center">
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1.5 rounded text-xs font-medium button-smooth">
            FOLLOW
          </button>
          <button className="border border-gray-400 hover:border-gray-300 text-gray-200 hover:text-white px-4 py-1.5 rounded text-xs font-medium button-smooth">
            MORE INFO
          </button>
        </div>
      </div>
    </div>
  );

  // CarouselSection component - UNCHANGED
  const CarouselSection = ({ scrollRef, currentPage, setCurrentPage, title }) => (
    <div className="relative mb-16 px-20">
      <h2 className="text-3xl font-bold text-center text-white mb-10">{title}</h2>
      
      <button
        onClick={() => scrollLeft(scrollRef, currentPage, setCurrentPage)}
        className="absolute -left-6 top-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-gray-800/80 hover:bg-gray-700/80 cursor-pointer shadow-lg backdrop-blur-sm carousel-arrow"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => scrollRight(scrollRef, currentPage, setCurrentPage)}
        className="absolute -right-6 top-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-gray-800/80 hover:bg-gray-700/80 cursor-pointer shadow-lg backdrop-blur-sm carousel-arrow"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div 
        className="overflow-hidden mx-auto" 
        style={{ 
          width: `${CONTAINER_WIDTH}px`
        }}
      >
        <div 
          ref={scrollRef}
          className="flex carousel-container"
          style={{
            width: `${cardData.length * ACTUAL_CARD_WIDTH}px`,
            transform: `translateX(-${currentPage * PAGE_WIDTH}px)`
          }}
        >
          {cardData.map((card) => (
            <Card key={card.id} data={card} />
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-8 gap-x-3">
        {Array.from({ length: TOTAL_PAGES }).map((_, pageIndex) => (
          <button
            key={pageIndex}
            onClick={() => {
              setCurrentPage(pageIndex);
              if (scrollRef.current) {
                scrollRef.current.style.transform = `translateX(-${pageIndex * PAGE_WIDTH}px)`;
              }
            }}
            className={`w-3 h-3 rounded-full carousel-dot ${
              currentPage === pageIndex 
                ? 'bg-gray-500 shadow-lg shadow-gray-500/50 active' 
                : 'bg-transparent border-2 border-white/60 hover:border-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent py-20">
      <div className="max-w-6xl mx-auto px-4">
        <CarouselSection 
          scrollRef={scrollRef1}
          currentPage={currentPage1}
          setCurrentPage={setCurrentPage1}
          title="Team Members"
        />
        
        <CarouselSection 
          scrollRef={scrollRef2}
          currentPage={currentPage2}
          setCurrentPage={setCurrentPage2}
          title="Featured Profiles"
        />
      </div>
    </div>
  );
};

export default Cards;
