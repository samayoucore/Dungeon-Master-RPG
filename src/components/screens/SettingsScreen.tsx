import { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { isSoundEnabled, setSoundEnabled } from '../../hooks/useSound';
import { soundEngine } from '../../engine/audio/soundEngine';

export default function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [sound, setSound] = useState(isSoundEnabled());

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) soundEngine.play('menu_click');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <h1 className="font-serif text-4xl text-gold">Настройки</h1>

      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={toggleSound}
          className="flex w-full items-center justify-between rounded-lg border border-surface-elevated bg-surface px-4 py-3 transition-colors hover:border-gold"
        >
          <span className="flex items-center gap-2 text-parchment">
            {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />} Звуковые эффекты
          </span>
          <span className={`relative h-6 w-11 rounded-full transition-colors ${sound ? 'bg-gold' : 'bg-surface-elevated'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-dungeon transition-all ${sound ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setScreen('title')}
        className="group flex items-center gap-2 text-muted transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Назад в меню
      </button>
    </div>
  );
}
