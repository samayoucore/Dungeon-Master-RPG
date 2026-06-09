import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface MenuButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
}

const VARIANTS = {
  primary: 'bg-gold text-dungeon font-semibold hover:bg-gold/90',
  ghost: 'border border-surface-elevated text-parchment hover:border-gold hover:text-gold',
} as const;

/** Title-menu button with a springy hover nudge to the right. */
export default function MenuButton({ onClick, children, variant = 'ghost' }: MenuButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 10 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`w-64 rounded-md px-6 py-3 text-left text-lg tracking-wide transition-colors ${VARIANTS[variant]}`}
    >
      {children}
    </motion.button>
  );
}
