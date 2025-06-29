import { useState, useEffect } from 'react';

export const useScrollDirection = (threshold: number = 10) => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      if (direction !== scrollDirection && Math.abs(scrollY - lastScrollY) > threshold) {
        setScrollDirection(direction);
      }
      
      setIsAtTop(scrollY < 10);
      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };

    const handleScroll = () => {
      requestAnimationFrame(updateScrollDirection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollDirection, lastScrollY, threshold]);

  return { scrollDirection, isAtTop };
};