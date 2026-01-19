import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`
        bg-gradient-to-r from-white/5 via-white/10 to-white/5
        bg-[length:200%_100%] rounded-lg
        ${className}
      `}
    />
  );
};

export const StepSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <LoadingSkeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TerminalSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <LoadingSkeleton key={i} className="h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
      ))}
    </div>
  );
};
