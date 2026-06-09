export type DiceOutcome = 'crit' | 'fail' | 'hit' | 'miss';

interface DiceRollerProps {
  /** Null = idle (no roll yet). */
  result: number | null;
  sides: number;
  outcome?: DiceOutcome;
  onAnimationEnd?: () => void;
}

const OUTCOME_LABEL: Record<DiceOutcome, { text: string; cls: string }> = {
  crit: { text: 'CRITICAL HIT!', cls: 'text-gold crit-pulse' },
  fail: { text: 'CRITICAL FAIL', cls: 'text-danger' },
  hit: { text: 'HIT', cls: 'text-green-400' },
  miss: { text: 'MISS', cls: 'text-muted' },
};

/** Animated die: idle wobble, a tumbling roll on each new result, outcome label. */
export default function DiceRoller({ result, sides, outcome, onAnimationEnd }: DiceRollerProps) {
  const idle = result === null;
  const bg =
    outcome === 'crit'
      ? 'bg-gold text-dungeon shadow-[0_0_20px_rgba(201,162,39,0.7)]'
      : outcome === 'fail'
        ? 'bg-danger text-parchment'
        : 'bg-surface-elevated text-parchment';
  const tag = outcome ? OUTCOME_LABEL[outcome] : null;

  return (
    <div className="flex flex-col items-center gap-2" style={{ perspective: '400px' }}>
      <div
        key={idle ? 'idle' : `${result}-${sides}`}
        onAnimationEnd={() => {
          if (!idle) onAnimationEnd?.();
        }}
        className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-surface-elevated font-serif font-bold leading-none ${bg} ${idle ? 'dice-idle' : 'dice-roll'}`}
      >
        <span className="text-xl">{idle ? '?' : result}</span>
        <span className="text-[9px] font-normal opacity-70">d{sides}</span>
      </div>
      {tag && <span className={`text-xs font-bold ${tag.cls}`}>{tag.text}</span>}
    </div>
  );
}
