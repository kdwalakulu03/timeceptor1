/**
 * ProductModal — Reusable full-screen popup wrapper for sub-product pages.
 * Each product renders inside this modal so it's individually debuggable & expandable.
 */
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  children: React.ReactNode;
}

export function ProductModal({ open, onClose, title, icon, children }: ProductModalProps) {
  // Close on Escape key
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl mx-4 mt-8 mb-8 max-h-[90vh] overflow-y-auto rounded-xl border border-gold/20 bg-[#0a0a1e] shadow-2xl"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(244,161,29,0.3) transparent' }}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-gold/15 bg-[#0a0a1e]/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h2 className="font-display text-lg text-gold font-semibold tracking-wide">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-cream-dim/60 hover:text-gold"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
