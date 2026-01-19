import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <FaCheckCircle className="text-green-400" />,
    error: <FaExclamationCircle className="text-red-400" />,
    info: <FaInfoCircle className="text-cyan-400" />,
  };

  const colors = {
    success: 'border-green-400/30 bg-green-500/10',
    error: 'border-red-400/30 bg-red-500/10',
    info: 'border-cyan-400/30 bg-cyan-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl
        ${colors[type]} shadow-lg min-w-[280px] max-w-md
      `}
    >
      <div className="text-xl flex-shrink-0">
        {icons[type]}
      </div>
      <p className="text-sm text-white/90 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/50 hover:text-white/80 transition-colors flex-shrink-0"
      >
        <FaTimes />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
