import { useState } from 'react';
import { Dices } from 'lucide-react';
import type { DMRequiresRoll } from '../../engine/ai/types';
import { rollRaw } from '../../engine/combat/dice';
import { useSound } from '../../hooks/useSound';
import DiceRoller from './DiceRoller';
import type { DiceOutcome } from './DiceRoller';
import { STAT_RU } from './statLabels';

interface SkillCheckCardProps {
  roll: DMRequiresRoll;
  /** Ability modifier added to the d20. */
  modifier: number;
  /** Fired once the roll animation settles. */
  onResolve: (success: boolean, total: number) => void;
}

interface RollState {
  d20: number;
  total: number;
  outcome: DiceOutcome;
}

/** Inline d20 skill check prompted by the DM; rolls once, then resolves. */
export default function SkillCheckCard({ roll, modifier, onResolve }: SkillCheckCardProps) {
  const [state, setState] = useState<RollState | null>(null);
  const { play } = useSound();

  const sign = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  const doRoll = () => {
    if (state) return;
    const d20 = rollRaw(20);
    const total = d20 + modifier;
    const outcome: DiceOutcome =
      d20 === 20 ? 'crit' : d20 === 1 ? 'fail' : total >= roll.dc ? 'hit' : 'miss';
    play('dice_roll');
    setState({ d20, total, outcome });
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-gold/50 bg-dungeon/60 p-3">
      <p className="font-serif text-sm text-parchment">{roll.description}</p>
      <p className="text-xs text-muted">
        Бросок d20 {sign} модификатор {STAT_RU[roll.stat]} (Сложность {roll.dc})
      </p>
      {state ? (
        <div className="flex items-center justify-center">
          <DiceRoller
            result={state.d20}
            sides={20}
            outcome={state.outcome}
            onAnimationEnd={() => onResolve(state.total >= roll.dc, state.total)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={doRoll}
          className="flex items-center justify-center gap-2 rounded-md bg-gold px-3 py-2 text-sm font-semibold text-dungeon transition-colors hover:bg-gold/90"
        >
          <Dices className="h-4 w-4" /> Бросить кубик!
        </button>
      )}
    </div>
  );
}
