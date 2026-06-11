// ============================================================================
// Groq API client for the Dungeon Master. Groq is OpenAI-compatible, so this
// speaks the /chat/completions protocol. The API key lives in localStorage and
// is never logged. A module-level singleton (groqService) is exported.
// ============================================================================

import type { ItemRarity, ItemType, Stats } from '../../types';
import type { ChatMessage, DMItemFound, DMRequiresRoll, DMResponse } from './types';
import { buildSystemPrompt, buildUserMessage } from './prompts';
import type { GameContext } from './prompts';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const STORAGE_KEY = 'dm_groq_key';
// The design doc named "llama-3.1-70b-versatile", but Groq decommissioned that
// model; "llama-3.3-70b-versatile" is its drop-in successor. Swap here if Groq
// rotates models again.
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 400;
const TEMPERATURE = 0.85;
/** Cap the transcript we forward to the model (last 10 pairs => 20 messages). */
const MAX_HISTORY_MESSAGES = 20;

export type GroqErrorCode = 'NO_API_KEY' | 'RATE_LIMIT' | 'NETWORK' | 'INVALID_KEY' | 'PARSE_ERROR';

export class GroqError extends Error {
  readonly code: GroqErrorCode;

  constructor(code: GroqErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'GroqError';
  }
}

// --- Validation helpers (narrow untrusted LLM JSON without `any`) -----------

const ITEM_TYPES: ReadonlySet<ItemType> = new Set<ItemType>([
  'weapon',
  'armor',
  'shield',
  'potion',
  'artifact',
  'quest',
  'misc',
]);

const ITEM_RARITIES: ReadonlySet<ItemRarity> = new Set<ItemRarity>([
  'common',
  'uncommon',
  'rare',
  'very-rare',
  'legendary',
]);

const STAT_KEYS: ReadonlySet<keyof Stats> = new Set<keyof Stats>([
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function parseItemFound(value: unknown): DMItemFound | undefined {
  if (!isRecord(value)) return undefined;
  const name = asString(value.name);
  const description = asString(value.description);
  if (!name || !description) return undefined;
  const rawType = asString(value.type);
  const rawRarity = asString(value.rarity);
  const type: ItemType =
    rawType && ITEM_TYPES.has(rawType as ItemType) ? (rawType as ItemType) : 'misc';
  const rarity: ItemRarity =
    rawRarity && ITEM_RARITIES.has(rawRarity as ItemRarity) ? (rawRarity as ItemRarity) : 'common';
  return {
    name,
    type,
    description,
    icon: asString(value.icon) ?? '📦',
    rarity,
    value: asFiniteNumber(value.value) ?? 0,
  };
}

function parseRequiresRoll(value: unknown): DMRequiresRoll | undefined {
  if (!isRecord(value)) return undefined;
  const rawStat = asString(value.stat);
  const dc = asFiniteNumber(value.dc);
  const description = asString(value.description);
  if (!rawStat || !STAT_KEYS.has(rawStat as keyof Stats) || dc === undefined || !description) {
    return undefined;
  }
  return { stat: rawStat as keyof Stats, dc: Math.round(dc), description };
}

function parseCombatStart(value: unknown): { enemyIds: string[] } | undefined {
  if (!isRecord(value) || !Array.isArray(value.enemyIds)) return undefined;
  const enemyIds = value.enemyIds.filter((id): id is string => typeof id === 'string');
  return enemyIds.length > 0 ? { enemyIds } : undefined;
}

function parseQuestUpdate(value: unknown): { questId: string; objectiveId: string } | undefined {
  if (!isRecord(value)) return undefined;
  const questId = asString(value.questId);
  const objectiveId = asString(value.objectiveId);
  return questId && objectiveId ? { questId, objectiveId } : undefined;
}

/** Turn untrusted parsed JSON into a strict DMResponse, or null if invalid. */
function toDMResponse(value: unknown): DMResponse | null {
  if (!isRecord(value)) return null;
  const narrative = asString(value.narrative);
  if (!narrative) return null;

  const combatStart = parseCombatStart(value.combatStart);
  const itemFound = parseItemFound(value.itemFound);
  const goldChange = asFiniteNumber(value.goldChange);
  const xpGained = asFiniteNumber(value.xpGained);
  const requiresRoll = parseRequiresRoll(value.requiresRoll);
  const questUpdate = parseQuestUpdate(value.questUpdate);

  const hasMechanics =
    combatStart !== undefined ||
    itemFound !== undefined ||
    (goldChange !== undefined && goldChange !== 0) ||
    (xpGained !== undefined && xpGained !== 0) ||
    requiresRoll !== undefined ||
    questUpdate !== undefined;

  const response: DMResponse = {
    narrative,
    narrationOnly: typeof value.narrationOnly === 'boolean' ? value.narrationOnly : !hasMechanics,
  };
  if (combatStart) response.combatStart = combatStart;
  if (itemFound) response.itemFound = itemFound;
  if (goldChange !== undefined && goldChange !== 0) response.goldChange = Math.round(goldChange);
  if (xpGained !== undefined && xpGained !== 0) response.xpGained = Math.round(xpGained);
  if (requiresRoll) response.requiresRoll = requiresRoll;
  if (questUpdate) response.questUpdate = questUpdate;
  return response;
}

/** Pull choices[0].message.content out of an OpenAI-shaped response. */
function extractContent(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.choices)) return null;
  const first: unknown = data.choices[0];
  if (!isRecord(first) || !isRecord(first.message)) return null;
  return asString(first.message.content) ?? null;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqService {
  private getApiKey(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /** Persist the user's API key. */
  setApiKey(key: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }

  clearApiKey(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  isConfigured(): boolean {
    return !!this.getApiKey();
  }

  /** Map a fetch Response status to the appropriate GroqError. */
  private errorForStatus(status: number): GroqError {
    if (status === 401) return new GroqError('INVALID_KEY', 'Invalid API key');
    if (status === 429) return new GroqError('RATE_LIMIT', 'Rate limit exceeded');
    return new GroqError('NETWORK', 'Network error');
  }

  /** Low-level chat call. Throws GroqError on any failure. */
  private async request(messages: GroqMessage[], maxTokens: number): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new GroqError('NO_API_KEY', 'No API key configured');

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: maxTokens,
          temperature: TEMPERATURE,
          messages,
          response_format: { type: 'json_object' },
        }),
      });
    } catch {
      // DNS / offline / CORS — never surface the request details.
      throw new GroqError('NETWORK', 'Network error');
    }

    if (!response.ok) throw this.errorForStatus(response.status);

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new GroqError('PARSE_ERROR', 'Malformed response body');
    }
    const content = extractContent(data);
    if (content === null) throw new GroqError('PARSE_ERROR', 'Missing message content');
    return content;
  }

  /** Send the player's action and return the DM's structured reply. */
  async sendMessage(
    userAction: string,
    gameContext: GameContext,
    history: ChatMessage[],
  ): Promise<DMResponse> {
    const messages: GroqMessage[] = [
      { role: 'system', content: buildSystemPrompt(gameContext) },
      ...history.slice(-MAX_HISTORY_MESSAGES).map(
        (message): GroqMessage => ({ role: message.role, content: message.content }),
      ),
      { role: 'user', content: buildUserMessage(userAction, gameContext) },
    ];

    const content = await this.request(messages, MAX_TOKENS);

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new GroqError('PARSE_ERROR', 'Response was not valid JSON');
    }
    const dmResponse = toDMResponse(parsed);
    if (!dmResponse) throw new GroqError('PARSE_ERROR', 'Response missing narrative');
    return dmResponse;
  }

  /** Lightweight connectivity check used by the Settings screen. */
  async testConnection(): Promise<boolean> {
    try {
      await this.request(
        [
          { role: 'system', content: 'Ты тестовый ассистент. Отвечай только JSON.' },
          { role: 'user', content: 'Ответь одним словом: ОК. Формат: {"narrative":"ОК"}' },
        ],
        16,
      );
      return true;
    } catch {
      return false;
    }
  }
}

export const groqService = new GroqService();
