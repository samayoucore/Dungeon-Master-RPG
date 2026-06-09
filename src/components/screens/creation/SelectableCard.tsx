import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SelectableCardProps {
  icon: string;
  title: string;
  selected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}

/** Reusable selectable option card (race / class / background) with gold highlight. */
export default function SelectableCard({ icon, title, selected, onSelect, children }: SelectableCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors ${
        selected
          ? 'border-gold bg-gold/10 shadow-[0_0_18px_rgba(201,162,39,0.25)]'
          : 'border-surface-elevated bg-surface hover:border-gold/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <span className="font-serif text-xl text-parchment">{title}</span>
      </div>
      {children}
    </motion.button>
  );
}
