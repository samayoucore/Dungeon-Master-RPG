import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface PlaceholderScreenProps {
  title: string;
  /** Development phase that will implement this screen. */
  phase: string;
}

/** Temporary screen for features delivered in a later development phase. */
export default function PlaceholderScreen({ title, phase }: PlaceholderScreenProps) {
  const setScreen = useGameStore((state) => state.setScreen);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-5xl text-gold"
      >
        {title}
      </motion.h1>
      <span className="rounded-full border border-surface-elevated px-4 py-1 text-xs uppercase tracking-[0.3em] text-muted">
        {phase}
      </span>
      <button
        type="button"
        onClick={() => setScreen('title')}
        className="group mt-2 flex items-center gap-2 text-muted transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to title
      </button>
    </div>
  );
}
