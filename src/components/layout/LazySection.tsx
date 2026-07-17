import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface LazySectionProps {
  id: string;
  minHeight: string;
  children: React.ReactNode;
}

export const LazySection: React.FC<LazySectionProps> = ({ id, minHeight, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '300px 0px 300px 0px', // Empezar a renderizar 300px antes de entrar en viewport
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id={id}
      style={{ minHeight: isVisible ? 'auto' : minHeight }}
      className="relative w-full"
    >
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full"
        >
          {children}
        </motion.div>
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
          {/* Un spinner sutil o texto en el fondo, muy discreto */}
          <div className="animate-pulse font-archivo font-black text-[9px] tracking-[0.3em] text-white/5 uppercase">
            Cargando sección...
          </div>
        </div>
      )}
    </div>
  );
};
