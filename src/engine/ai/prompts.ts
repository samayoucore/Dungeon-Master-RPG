// ============================================================================
// System & user prompt construction for the Dungeon Master LLM.
// Everything the model emits must be in Russian; only the JSON keys stay
// English. Pure functions — no runtime state, no React.
// ============================================================================

import type {
  Biome,
  Character,
  CombatState,
  Item,
  Quest,
  Room,
  RoomType,
} from '../../types';

/** Snapshot of the world handed to the DM on every turn. */
export interface GameContext {
  character: Character;
  currentRoom: Room;
  inventory: Item[];
  quests: Quest[];
  /** Last 5 narration/action lines from the narrative log. */
  recentEvents: string[];
  floor: number;
  biome: Biome;
  /** Current combat state; null outside of battle. */
  combat: CombatState | null;
}

const ROOM_TYPE_RU: Record<RoomType, string> = {
  entrance: 'вход',
  corridor: 'коридор',
  barracks: 'казарма',
  library: 'библиотека',
  crypt: 'крипта',
  treasure: 'сокровищница',
  boss: 'логово босса',
  shop: 'лавка торговца',
  puzzle: 'комната-загадка',
  trap: 'комната с ловушкой',
  throne: 'тронный зал',
};

const BIOME_RU: Record<Biome, string> = {
  crypt: 'Крипта',
  forest: 'Лес',
  castle: 'Замок',
  cave: 'Пещера',
  ruins: 'Руины',
};

/** Bestiary ids the DM is allowed to spawn via combatStart. */
const AVAILABLE_ENEMY_IDS = 'goblin, skeleton, zombie, orc, dark_mage, troll';

function joinOr(values: string[], empty: string): string {
  return values.length > 0 ? values.join(', ') : empty;
}

/** Assemble the full system prompt from the live game context. */
export function buildSystemPrompt(ctx: GameContext): string {
  const { character: c, currentRoom: room } = ctx;

  const enemyNames = room.enemies.map((e) => e.name);
  const enemyLine =
    enemyNames.length > 0 ? `ДА — ${enemyNames.join(', ')}` : 'нет';
  const itemLine = joinOr(
    room.items.map((i) => i.name),
    'нет',
  );
  const questLine = joinOr(
    ctx.quests.filter((q) => q.status === 'active').map((q) => q.title),
    'нет',
  );
  const inventoryLine = joinOr(
    ctx.inventory.map((i) => i.name),
    'пусто',
  );
  const recent = ctx.recentEvents.length > 0 ? ctx.recentEvents.join('\n') : '—';

  return `Ты — Мастер Подземелья тёмной фэнтезийной RPG. Твоя роль: описывать события, реагировать на действия игрока, управлять миром.

ТЕКУЩЕЕ СОСТОЯНИЕ ИГРЫ:
- Герой: ${c.name}, Уровень ${c.level} ${c.race} ${c.class}, HP ${c.hp}/${c.maxHp}, AC ${c.ac}
- Местоположение: комната типа ${ROOM_TYPE_RU[room.type]}, Этаж ${ctx.floor} (${BIOME_RU[ctx.biome]})
- Враги в комнате: ${enemyLine}
- Предметы в комнате: ${itemLine}
- Активные квесты: ${questLine}
- Инвентарь: ${inventoryLine}

ПОСЛЕДНИЕ СОБЫТИЯ:
${recent}

ПРАВИЛА ОТВЕТА:
0. ЯЗЫК: Всегда отвечай на русском языке. Все поля "narrative", "description" и "requiresRoll.description" должны быть на русском. Только ключи JSON остаются на английском. Без исключений.

1. Всегда отвечай валидным JSON по схеме ниже.

2. Поле "narrative" обязательно — 1–3 атмосферных предложения от второго лица ("Ты видишь...", "Перед тобой...").

3. Отвечай кратко. Без длинных монологов.

4. Выдерживай тон тёмного фэнтези: мрачно, атмосферно, изредка чёрный юмор.

5. Реагируй на конкретное действие и контекст текущей комнаты.

6. Если в комнате есть враги и игрок атакует — установи combatStart с id врагов. Доступные id: ${AVAILABLE_ENEMY_IDS}.

7. При обыске/исследовании — иногда выдавай предметы через itemFound или золото через goldChange. Чаще всего common предметы.

8. Для действий требующих навыков (взлом замка, прыжок, убеждение NPC) — используй requiresRoll с подходящим статом и DC (10=легко, 15=средне, 20=сложно).

9. На бессмысленные или невозможные действия — атмосферный ответ что "ничего не происходит".

10. narrationOnly: true если это просто текст без механик.

СХЕМА JSON:
{
  "narrative": "строка (обязательно, на русском)",
  "combatStart": { "enemyIds": ["строка"] } | null,
  "itemFound": { "name": "строка", "type": "строка",
                 "description": "строка", "icon": "строка",
                 "rarity": "строка", "value": число } | null,
  "goldChange": число | null,
  "xpGained": число | null,
  "requiresRoll": { "stat": "str|dex|con|int|wis|cha",
                    "dc": число,
                    "description": "строка на русском" } | null,
  "narrationOnly": boolean
}`;
}

/** The per-turn user message: the action plus a small live status line. */
export function buildUserMessage(action: string, ctx: GameContext): string {
  const { character: c } = ctx;
  return `Действие игрока: "${action}"
Текущий HP: ${c.hp}/${c.maxHp}`;
}
