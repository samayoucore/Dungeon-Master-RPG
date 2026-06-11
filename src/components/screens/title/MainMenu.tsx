import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore';
import MenuButton from './MenuButton';

interface MainMenuProps {
  hasSaves: boolean;
  onContinue: () => void;
}

/** Animated game logo and tagline. */
function Logo() {
  return (
    <div className="mb-12 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-serif text-6xl font-bold text-gold md:text-7xl"
      >
        ⚔ МАСТЕР ⚔
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="mt-1 font-serif text-3xl tracking-[0.5em] text-parchment md:text-4xl"
      >
        ПОДЗЕМЕЛИЙ
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 text-sm tracking-[0.3em] text-muted"
      >
        ◆ Процедурное RPG-приключение ◆
      </motion.p>
    </div>
  );
}

/** Title-screen main menu: new game, optional continue, settings. */
export default function MainMenu({ hasSaves, onContinue }: MainMenuProps) {
  const beginCreation = useGameStore((state) => state.beginCreation);
  const setScreen = useGameStore((state) => state.setScreen);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      <Logo />
      <nav className="flex flex-col gap-4">
        <MenuButton variant="primary" onClick={beginCreation}>
          Новая игра
        </MenuButton>
        {hasSaves && <MenuButton onClick={onContinue}>Продолжить</MenuButton>}
        <MenuButton onClick={() => setScreen('settings')}>Настройки</MenuButton>
      </nav>
    </motion.div>
  );
}
