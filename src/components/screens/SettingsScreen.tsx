import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Eye, EyeOff, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { isSoundEnabled, setSoundEnabled } from '../../hooks/useSound';
import { soundEngine } from '../../engine/audio/soundEngine';
import { groqService } from '../../engine/ai/groqService';
import { getDifficulty, setDifficulty } from '../../engine/difficulty';
import type { Difficulty } from '../../engine/difficulty';
import { deleteSave, SAVE_SLOT_COUNT } from '../../utils/save';
import Toast, { useToasts } from '../ui/Toast';

type ConnectionState = 'unconfigured' | 'connected' | 'invalid';

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'easy', label: 'Легко', hint: 'Враги −20% HP, +10% лута' },
  { value: 'normal', label: 'Нормально', hint: 'Без изменений' },
  { value: 'hardcore', label: 'Хардкор', hint: 'Враги +30% HP, нет автосохранения' },
];

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-surface-elevated bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const { toasts, push } = useToasts();

  // --- AI / Groq ---
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [configured, setConfigured] = useState(groqService.isConfigured());
  const [testResult, setTestResult] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [testing, setTesting] = useState(false);

  // --- Gameplay ---
  const [difficulty, setDifficultyState] = useState<Difficulty>(getDifficulty());

  // --- Sound ---
  const [sound, setSound] = useState(isSoundEnabled());

  // --- Danger zone ---
  const [confirmWipe, setConfirmWipe] = useState(false);

  const connection: ConnectionState = !configured
    ? 'unconfigured'
    : testResult === 'invalid'
      ? 'invalid'
      : 'connected';

  const saveKey = () => {
    const key = keyInput.trim();
    if (!key) return;
    groqService.setApiKey(key);
    setConfigured(true);
    setTestResult('unknown');
    push('✓ Ключ сохранён', 'success');
  };

  const testConnection = async () => {
    // Persist whatever is in the field first, so "type then test" just works.
    const key = keyInput.trim();
    if (key) {
      groqService.setApiKey(key);
      setConfigured(true);
    }
    if (!groqService.isConfigured()) {
      push('✗ Сначала введите ключ', 'error');
      return;
    }
    setTesting(true);
    const ok = await groqService.testConnection();
    setTesting(false);
    setTestResult(ok ? 'valid' : 'invalid');
    push(ok ? '✓ Подключено!' : '✗ Неверный ключ', ok ? 'success' : 'error');
  };

  const deleteKey = () => {
    groqService.clearApiKey();
    setConfigured(false);
    setKeyInput('');
    setTestResult('unknown');
    push('Ключ удалён', 'success');
  };

  const chooseDifficulty = (value: Difficulty) => {
    setDifficultyState(value);
    setDifficulty(value);
    if (sound) soundEngine.play('menu_click');
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) soundEngine.play('menu_click');
  };

  const wipeSaves = () => {
    for (let slot = 0; slot < SAVE_SLOT_COUNT; slot += 1) deleteSave(slot);
    setConfirmWipe(false);
    push('Все сохранения удалены', 'success');
  };

  const statusDot =
    connection === 'connected'
      ? { cls: 'bg-green-500', label: 'Подключено' }
      : connection === 'invalid'
        ? { cls: 'bg-danger', label: 'Неверный ключ' }
        : { cls: 'bg-muted', label: 'Не настроено' };

  return (
    <div className="min-h-screen overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setScreen('title')}
            className="group flex items-center gap-2 text-muted transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Назад
          </button>
          <h1 className="font-serif text-3xl text-gold">Настройки</h1>
          <span className="w-16" />
        </div>

        {/* --- Dungeon Master (AI) --- */}
        <SectionCard title="🤖 Мастер Подземелья (AI)">
          <p className="text-sm text-muted">
            Добавь бесплатный ключ Groq API, чтобы Мастер Подземелья живо реагировал на твои
            действия.
          </p>
          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold transition-colors hover:underline"
          >
            Получить бесплатный ключ на console.groq.com →
          </a>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder="gsk_..."
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-surface-elevated bg-dungeon px-3 py-2 pr-10 text-sm text-parchment placeholder:text-muted/60 focus:border-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Скрыть ключ' : 'Показать ключ'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition-colors hover:text-gold"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveKey}
              disabled={keyInput.trim().length === 0}
              className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-dungeon transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Сохранить ключ
            </button>
            <button
              type="button"
              onClick={() => void testConnection()}
              disabled={testing}
              className="rounded-md border border-surface-elevated px-3 py-2 text-sm text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {testing ? 'Проверка…' : 'Проверить подключение'}
            </button>
            {configured && (
              <button
                type="button"
                onClick={deleteKey}
                className="flex items-center gap-1 rounded-md border border-danger/50 px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" /> Удалить ключ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot.cls}`} />
            <span className="text-muted">{statusDot.label}</span>
          </div>
        </SectionCard>

        {/* --- Gameplay --- */}
        <SectionCard title="Игровой процесс">
          <p className="text-sm text-muted">Сложность</p>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((option) => {
              const active = difficulty === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => chooseDifficulty(option.value)}
                  className={`flex flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors ${
                    active
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-surface-elevated text-parchment hover:border-gold/60'
                  }`}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-muted">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* --- Sound --- */}
        <SectionCard title="Звук">
          <button
            type="button"
            onClick={toggleSound}
            className="flex w-full items-center justify-between rounded-md border border-surface-elevated bg-dungeon px-4 py-3 transition-colors hover:border-gold"
          >
            <span className="flex items-center gap-2 text-parchment">
              {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />} Звуковые
              эффекты
            </span>
            <span
              className={`relative h-6 w-11 rounded-full transition-colors ${sound ? 'bg-gold' : 'bg-surface-elevated'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-dungeon transition-all ${sound ? 'left-[22px]' : 'left-0.5'}`}
              />
            </span>
          </button>
        </SectionCard>

        {/* --- Danger zone --- */}
        <SectionCard title="Опасная зона">
          {confirmWipe ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-parchment">
                Удалить все сохранения? Это действие необратимо.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={wipeSaves}
                  className="rounded-md bg-danger px-3 py-2 text-sm font-semibold text-parchment transition-colors hover:bg-danger/80"
                >
                  Да, удалить всё
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmWipe(false)}
                  className="rounded-md border border-surface-elevated px-3 py-2 text-sm text-muted transition-colors hover:text-parchment"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmWipe(true)}
              className="flex items-center gap-2 self-start rounded-md border border-danger/50 px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" /> Удалить все сохранения
            </button>
          )}
        </SectionCard>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
