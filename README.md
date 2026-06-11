<div align="center">

# ⚔️ Dungeon Oracle

### A procedural browser RPG with an AI Dungeon Master

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-4.5-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs)

<br/>

*Descend into a procedurally generated dungeon. Every room is unique.<br/>Every action is answered by an AI Dungeon Master who remembers your story.*

</div>

---

## ✨ Features

- **🤖 Living AI Dungeon Master** — Powered by Groq (Llama 3.1 70B). Reacts intelligently to anything you type in natural language, remembers past events, dynamically triggers combat, grants loot, requests skill rolls and drives the story forward
- **🗺 Procedural Dungeon Generation** — BSP algorithm creates a unique dungeon layout every run with varied room types, enemies and secrets
- **⚔️ D&D 5e Combat** — Full turn-based combat with initiative, attack rolls, critical hits, status effects and enemy AI behaviours (aggressive, tactical, berserker, coward, support)
- **🧙 6 Classes & 6 Races** — Fighter, Rogue, Wizard, Cleric, Ranger, Bard × Human, Elf, Dwarf, Halfling, Half-Orc, Tiefling — each with unique stats and level-up features
- **🎲 Real Dice Mechanics** — d4 through d20 with advantage/disadvantage, animated 3D dice roller, critical hits double damage dice
- **🌫 Fog of War** — Canvas map reveals as you explore, adjacent rooms shown dimly
- **📦 Inventory & Equipment** — 9 equipment slots, weight system, item rarity tiers
- **🔊 Procedural Audio** — All sound effects generated via Web Audio API — zero audio files
- **💾 3 Save Slots** — Autosave every 3 turns, full state serialization to localStorage
- **📱 Fully Responsive** — Tab navigation on mobile, full three-panel layout on desktop

---

## 🎮 How to Play

1. **Create your hero** — pick a race, class, name and distribute ability points via point-buy
2. **Explore the dungeon** — move between rooms, each introduced with an atmospheric description
3. **Type anything to the AI DM** — *"Осматриваю руны на стене"*, *"Пытаюсь взломать сундук"*, *"Говорю с торговцем"* — the AI reacts to your exact words and the current game state
4. **Fight enemies** — the AI initiates combat when appropriate; turn-based system takes over with dice rolls and abilities
5. **Survive** — descend deeper, level up, find legendary gear, defeat the boss

> **Tip:** Add a free Groq API key in Settings to unlock the AI Dungeon Master. Get one at [console.groq.com](https://console.groq.com) — no credit card required, 14 000 free requests per day.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/dungeon-oracle.git
cd dungeon-oracle

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) and begin your adventure.

> The game works without an API key — a keyword-based fallback handles basic commands. Add a Groq key in Settings for the full AI experience.

---

## 🏗️ Architecture

The key design decision is the **separation of the game engine from React**. Everything in `src/engine/` is pure TypeScript with zero framework dependencies — fully testable in isolation.

```
src/
├── engine/               # Pure TypeScript — no React imports
│   ├── dungeon/          # BSP generation, room population, bestiary, loot tables
│   ├── narrative/        # Template engine for room intros + AI response handling
│   ├── combat/           # Dice system, turn resolution, status effects, enemy AI
│   ├── character/        # Creation, stat calculation, levelling, class features
│   ├── ai/               # Groq service, message history, system prompt builder
│   └── audio/            # Procedural sound generation (Web Audio API)
│
├── store/                # Zustand store — single source of truth for all game state
├── components/
│   ├── screens/          # Full-screen views (Title, Game, CharCreation, GameOver...)
│   ├── game/             # In-game panels (NarrativeLog, CombatPanel, Map, Input...)
│   ├── character/        # CharacterSheet, InventoryPanel
│   └── ui/               # Atoms (TypewriterText, Toast, DiceRoller)
├── types/                # All TypeScript interfaces in one place
└── utils/                # Save/load, formatting helpers
```

### AI Dungeon Master

The AI DM is the heart of the game. On every player action, the full game state is serialised and sent to Groq as a structured system prompt. The model responds with JSON that the frontend parses and applies as real game mechanics:

```
Player types action
       ↓
buildSystemPrompt(character, room, inventory, quests, recentEvents)
       ↓
POST https://api.groq.com/openai/v1/chat/completions
  model: llama-3.1-70b-versatile
  response_format: { type: "json_object" }
       ↓
Parse DMResponse {
  narrative: "Ты замечаешь мерцание за старым алтарём...",
  itemFound: { name: "Свиток огненного шара", rarity: "rare", ... },
  requiresRoll: { stat: "int", dc: 14, description: "Попытка прочитать руны" },
  combatStart: null,
  xpGained: 25
}
       ↓
Apply each field as a game mechanic → update store → render
```

The message history (last 8 exchanges) is sent with every request so the AI remembers what happened earlier in the session. The system prompt is rebuilt on every turn to reflect the current HP, room, inventory and active quests.

### Dual Narrative System

The game uses two narrative layers:

**Template engine** — instant, no API needed. Fires when entering a new room. Picks from 200+ patterns and substitutes contextual variables (biome, lighting, smell, enemy presence, character HP):

```
Template: "Ты входишь в {size} {room_type}. {lighting}. {smell}."
→ "Ты входишь в тесный склеп. Бледный мох тускло светится. Запах тлена висит в воздухе."
```

**AI DM** — fires on every player action. Receives the full game context and returns a narrative response plus optional mechanics (loot, combat, skill checks, XP). This is what makes the game feel alive.

### BSP Dungeon Generator

```
1. Start with the full map rectangle (80×60 tiles)
2. Recursively split into sub-spaces at a random 40–60% ratio
3. Place a room in each leaf node with random size within bounds
4. Connect adjacent rooms with L-shaped corridors
5. Assign room types (entrance, barracks, crypt, library, trap, boss...)
6. Populate with enemies and loot based on room type and floor depth
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI layer, strict typing throughout |
| Vite | Fast dev server and bundler |
| Tailwind CSS | Dark fantasy utility-first styling |
| Zustand + Immer | Global game state, immutable updates |
| Framer Motion | Animations (dice rolls, screen transitions, combat) |
| Canvas API | Dungeon map with fog of war |
| Groq API (Llama 3.1 70B) | Free AI Dungeon Master, ~600ms response time |
| Web Audio API | Procedural sound effects, zero audio files |
| localStorage | 3-slot save system with autosave every 3 turns |

---

<div align="center">

Made with ⚔️ and too many d20 rolls

*If this project impressed you, consider leaving a ⭐*

</div>
