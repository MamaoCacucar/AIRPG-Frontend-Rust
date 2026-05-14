import React, { useRef, useState, useEffect } from 'react';
import styles from './PosterGridStyle.module.css';

export function PosterGrid({ children }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      // Margem de 1px para evitar bugs de arredondamento em algumas resoluções
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [children]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      // Avança o tamanho aproximado de 1 poster por vez
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.wrapper}>
      {showLeft && (
        <button className={`${styles.scrollButton} ${styles.left}`} onClick={() => scroll('left')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}
      
      <div className={styles.gridContainer} ref={scrollRef} onScroll={handleScroll}>
        {children}
      </div>

      {showRight && (
        <button className={`${styles.scrollButton} ${styles.right}`} onClick={() => scroll('right')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}