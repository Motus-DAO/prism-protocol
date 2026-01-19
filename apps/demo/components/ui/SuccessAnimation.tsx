import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ show, onComplete }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);

      // Complete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(34, 197, 94, 0.5)',
                  '0 0 60px rgba(34, 197, 94, 0.8)',
                  '0 0 20px rgba(34, 197, 94, 0.5)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* Confetti particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 0,
              }}
              animate={{
                x: particle.x * 5,
                y: particle.y * 5 + 100,
                opacity: 0,
                scale: 1,
                rotate: particle.rotation,
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                left: '50%',
                top: '50%',
              }}
            />
          ))}

          {/* Ring pulse */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                ease: 'easeOut',
              }}
              className="absolute w-24 h-24 rounded-full border-4 border-green-400"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
