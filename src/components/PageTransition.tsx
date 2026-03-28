import React from 'react';
import { motion, type Transition } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -15,
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for spring-like apple feel
  duration: 0.4,
};

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function PageTransition({ children, className = '', style = {} }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {children}
    </motion.div>
  );
}
