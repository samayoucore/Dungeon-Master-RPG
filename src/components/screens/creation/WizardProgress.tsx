interface WizardProgressProps {
  steps: string[];
  current: number;
}

type StepState = 'done' | 'active' | 'todo';

function circleClass(state: StepState): string {
  if (state === 'active') return 'border-gold bg-gold text-dungeon';
  if (state === 'done') return 'border-gold bg-gold/20 text-gold';
  return 'border-surface-elevated text-muted';
}

/** Top wizard progress bar: numbered, connected steps with state colours. */
export default function WizardProgress({ steps, current }: WizardProgressProps) {
  return (
    <ol className="mx-auto flex w-full max-w-3xl items-start">
      {steps.map((label, index) => {
        const state: StepState = index < current ? 'done' : index === current ? 'active' : 'todo';
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${index === 0 ? 'opacity-0' : index <= current ? 'bg-gold' : 'bg-surface-elevated'}`}
              />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${circleClass(state)}`}
              >
                {index + 1}
              </span>
              <span
                className={`h-0.5 flex-1 ${index === steps.length - 1 ? 'opacity-0' : index < current ? 'bg-gold' : 'bg-surface-elevated'}`}
              />
            </div>
            <span className={`text-center text-xs ${state === 'active' ? 'text-gold' : 'text-muted'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
