// ============================================================================
// In-memory chat transcript for the Dungeon Master. A module-level singleton
// so it survives React re-renders. Trimmed to the most recent N exchanges to
// keep token usage (and cost) bounded.
// ============================================================================

import type { ChatMessage, DMResponse } from './types';

export class MessageHistory {
  private history: ChatMessage[] = [];
  private readonly maxPairs = 8;

  /** Append a message, dropping the oldest pair once over the cap. */
  add(role: ChatMessage['role'], content: string): void {
    this.history.push({ role, content });
    while (this.history.length > this.maxPairs * 2) {
      this.history.shift();
    }
  }

  /** A defensive copy of the transcript (callers must not mutate ours). */
  getHistory(): ChatMessage[] {
    return this.history.map((message) => ({ ...message }));
  }

  addUserAction(action: string): void {
    this.add('user', action);
  }

  /** Store the DM reply as the assistant's JSON turn. */
  addDMResponse(response: DMResponse): void {
    this.add('assistant', JSON.stringify(response));
  }

  clear(): void {
    this.history = [];
  }
}

export const messageHistory = new MessageHistory();
