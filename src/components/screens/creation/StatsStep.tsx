import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { CharacterClass, CharacterRace, Stats } from '../../../types';
import type { StatInfo, StatKey } from '../../../engine/character/data';
import { CLASS_BY_ID, RACE_BY_ID, STATS_INFO } from '../../../engine/character/data';
import {
  abilityModifier,
  canDecrease,
  canIncrease,
  formatModifier,
  pointsRemaining,
} from '../../../engine/character/creation';

interface StatsStepProps {
  race: CharacterRace;
  characterClass: CharacterClass;
  stats: Stats;
  onChange: (stats: Stats) => void;
  onReset: () => void;
}

const STEP_BTN =
  'flex h-8 w-8 items-center justify-center rounded-md border border-surface-elevated text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-surface-elevated disabled:hover:text-parchment';

interface StatRowProps {
  info: StatInfo;
  base: number;
  final: number;
  modifier: number;
  canDec: boolean;
  canInc: boolean;
  onDec: () => void;
  onInc: () => void;
}

function StatRow({ info, base, final, modifier, canDec, canInc, onDec, onInc }: StatRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-surface-elevated bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-parchment">{info.abbr}</div>
        <div className="truncate text-[11px] leading-tight text-muted">{info.hint}</div>
      </div>
      <button type="button" className={STEP_BTN} disabled={!canDec} onClick={onDec} aria-label={`Lower ${info.abbr}`}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-6 text-center text-lg text-parchment">{base}</span>
      <button type="button" className={STEP_BTN} disabled={!canInc} onClick={onInc} aria-label={`Raise ${info.abbr}`}>
        <Plus className="h-4 w-4" />
      </button>
      <div className="flex w-16 items-baseline justify-end gap-1">
        <span className="text-2xl font-bold text-gold">{final}</span>
        <span className="text-xs text-muted">{formatModifier(modifier)}</span>
      </div>
    </div>
  );
}

export default function StatsStep({ race, characterClass, stats, onChange, onReset }: StatsStepProps) {
  const remaining = pointsRemaining(stats);
  const { bonuses } = RACE_BY_ID[race];
  const cls = CLASS_BY_ID[characterClass];

  const setStat = (key: StatKey, delta: number) => {
    onChange({ ...stats, [key]: stats[key] + delta });
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-center font-serif text-4xl text-gold">Distribute Ability Points</h2>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
        <span className="text-muted">
          Points remaining:{' '}
          <span className={remaining === 0 ? 'font-bold text-danger' : 'font-bold text-gold'}>{remaining}</span>
        </span>
        <span className="text-muted">
          {cls.name} priority: <span className="text-parchment">{cls.primary.map((p) => p.toUpperCase()).join(', ')}</span>
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        {STATS_INFO.map((info) => {
          const base = stats[info.key];
          const final = base + (bonuses[info.key] ?? 0);
          return (
            <StatRow
              key={info.key}
              info={info}
              base={base}
              final={final}
              modifier={abilityModifier(final)}
              canDec={canDecrease(stats, info.key)}
              canInc={canIncrease(stats, info.key)}
              onDec={() => setStat(info.key, -1)}
              onInc={() => setStat(info.key, 1)}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mx-auto flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
      >
        <RotateCcw className="h-4 w-4" /> Reset
      </button>
    </div>
  );
}
