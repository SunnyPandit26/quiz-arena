import React, { useState, useRef, useEffect } from 'react';

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
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      description: "I'm looking for something that can deliver a 50-pound payload of snow on a small feminine target. Can you suggest something? Hello...?"
    },
    {
      id: 2,
      name: "Wisteria Widget", 
      title: "Photographer",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b17c?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      description: "Calvin: I'm a genius, but I'm a misunderstood genius. Hobbes: What's misunderstood about you? Calvin: Nobody thinks I'm a genius."
    },
    {
      id: 3,
      name: "Desmond Eagle",
      title: "Accountant",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      description: "If you want to stay dad you've got to polish your image. I think the image we need to create for you is 'repentant but learning'."
    },
    {
      id: 4,
      name: "Alex Thompson",
      title: "Designer",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 5,
      name: "Sarah Wilson",
      title: "Marketing Manager",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 6,
      name: "Michael Davis",
      title: "Developer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 6,
      name: "Michael Davis",
      title: "Developer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bgImage: "./images/photo3",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 6,
      name: "Michael Davis",
      title: "Developer",
      profileImage: " ",
      bgImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 6,
      name: "Michael Davis3333",
      title: "Developer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      bgImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    }
  ];

  const CARD_WIDTH = 280;
  const VISIBLE_CARDS = 3;
  const PAGE_WIDTH = VISIBLE_CARDS * CARD_WIDTH; // Width of one full page
  const TOTAL_PAGES = Math.ceil(cardData.length / VISIBLE_CARDS); // Total pages needed

  // Updated scroll functions for page-based navigation
  const scrollLeft = (scrollRef, currentPage, setCurrentPage) => {
    let newPage;
    if (currentPage === 0) {
      // If at first page, go to last page (infinite loop)
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
      // If at last page, go to first page (infinite loop)
      newPage = 0;
    } else {
      newPage = currentPage + 1;
    }
    
    setCurrentPage(newPage);
    if (scrollRef.current) {
      scrollRef.current.style.transform = `translateX(-${newPage * PAGE_WIDTH}px)`;
    }
  };

  // Mouse wheel scrolling functionality for page-based navigation
  useEffect(() => {
    const handleWheel = (e, scrollRef, currentPage, setCurrentPage) => {
      e.preventDefault();
      
      if (e.deltaY > 0) {
        // Scroll right (next page)
        scrollRight(scrollRef, currentPage, setCurrentPage);
      } else {
        // Scroll left (previous page)
        scrollLeft(scrollRef, currentPage, setCurrentPage);
      }
    };

    const container1 = scrollRef1.current?.parentElement;
    const container2 = scrollRef2.current?.parentElement;

    const wheelHandler1 = (e) => handleWheel(e, scrollRef1, currentPage1, setCurrentPage1);
    const wheelHandler2 = (e) => handleWheel(e, scrollRef2, currentPage2, setCurrentPage2);

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

  const Card = ({ data }) => (
    <div className="bg-gray-900 rounded-xl overflow-hidden flex-shrink-0 w-64 mx-2 shadow-2xl transform hover:scale-105 transition-all duration-300">
      {/* Background Image Header with Profile Photo */}
      <div 
        className="h-36 bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${data.bgImage})`
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Profile Photo */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg">
            <img 
              src={data.profileImage} 
              alt={data.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-4 text-center pt-6">
        <h3 className="text-lg font-bold text-white mb-1">{data.name}</h3>
        <p className="text-cyan-400 text-xs font-medium mb-3">{data.title}</p>
        <p className="text-gray-300 text-xs leading-relaxed mb-4 line-clamp-3">
          {data.description}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-2 justify-center">
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1.5 rounded text-xs font-medium transition-all duration-300 transform hover:scale-105">
            FOLLOW
          </button>
          <button className="border border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white px-4 py-1.5 rounded text-xs font-medium transition-all duration-300 transform hover:scale-105">
            MORE INFO
          </button>
        </div>
      </div>
    </div>
  );

  const CarouselSection = ({ scrollRef, currentPage, setCurrentPage, title }) => (
    <div className="relative mb-16">
      <h2 className="text-3xl font-bold text-center text-white mb-10">{title}</h2>
      
      {/* Left Arrow */}
      <button
        onClick={() => scrollLeft(scrollRef, currentPage, setCurrentPage)}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-gray-800/80 hover:bg-gray-700/80 cursor-pointer shadow-lg backdrop-blur-sm"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right Arrow */}
      <button
        onClick={() => scrollRight(scrollRef, currentPage, setCurrentPage)}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-gray-800/80 hover:bg-gray-700/80 cursor-pointer shadow-lg backdrop-blur-sm"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Cards Container */}
      <div className="overflow-hidden mx-10" style={{ width: `${VISIBLE_CARDS * CARD_WIDTH}px` }}>
        <div 
          ref={scrollRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            width: `${cardData.length * CARD_WIDTH}px`,
            transform: `translateX(-${currentPage * PAGE_WIDTH}px)`
          }}
        >
          {cardData.map((card) => (
            <Card key={card.id} data={card} />
          ))}
        </div>
      </div>

      {/* Page-based Dots Indicator */}
      <div className="flex justify-center mt-8 space-x-3">
        {Array.from({ length: TOTAL_PAGES }).map((_, pageIndex) => (
          <button
            key={pageIndex}
            onClick={() => {
              setCurrentPage(pageIndex);
              if (scrollRef.current) {
                scrollRef.current.style.transform = `translateX(-${pageIndex * PAGE_WIDTH}px)`;
              }
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentPage === pageIndex 
                ? 'bg-orange-500 shadow-lg shadow-orange-500/50' 
                : 'bg-transparent border-2 border-white/60 hover:border-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 py-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* First Carousel */}
        <CarouselSection 
          scrollRef={scrollRef1}
          currentPage={currentPage1}
          setCurrentPage={setCurrentPage1}
          title="Team Members"
        />
        
        {/* Second Carousel */}
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
