<div align="center">

# ⚔️ Dungeon Oracle

### A procedural browser RPG with an AI Dungeon Master

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-4.5-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

<br/>

*Descend into a procedurally generated dungeon. Every room is unique.<br/>Every action is answered by an AI Dungeon Master who remembers your story.*

</div>

---

## ✨ Features

- **🗺 Procedural Dungeon Generation** — BSP algorithm creates a unique dungeon every run. No two playthroughs are the same
- **🤖 AI Dungeon Master** — Powered by Groq (Llama 3.1 70B). Reacts intelligently to anything you type, remembers your story, awards loot and triggers events dynamically
- **⚔️ D&D 5e Combat** — Full turn-based combat with initiative, attack rolls, critical hits, status effects and enemy AI behaviours
- **🧙 6 Classes & 6 Races** — Fighter, Rogue, Wizard, Cleric, Ranger, Bard × Human, Elf, Dwarf, Halfling, Half-Orc, Tiefling — each with unique stats and features
- **🎲 Real Dice Mechanics** — d4 through d20 with advantage/disadvantage, animated 3D dice roller
- **🌫 Fog of War** — Canvas map reveals as you explore, adjacent rooms shown dimly
- **📦 Inventory & Equipment** — 9 equipment slots, drag-and-drop loot, weight system
- **📜 Dynamic Narrative Engine** — 200+ templates × 500+ context variables generate thousands of unique room descriptions without any AI
- **🔊 Procedural Audio** — All sound effects generated via Web Audio API — zero audio files
- **💾 3 Save Slots** — Autosave every 3 turns, full state serialization to localStorage
- **📱 Fully Responsive** — Tab navigation on mobile, full layout on desktop

---

## 🎮 How to Play

1. **Create your hero** — pick a race, class, name and distribute ability points
2. **Explore the dungeon** — move between rooms, each described uniquely by the AI DM
3. **Take actions** — type anything: *"Я осматриваю руны на стене"*, *"Пытаюсь взобраться наверх"*, *"Атакую гоблина"*
4. **Fight enemies** — turn-based combat with dice rolls, abilities and loot
5. **Survive** — descend deeper, level up, find legendary gear, defeat the boss

> **Tip:** Add a free Groq API key in Settings to unlock the full AI Dungeon Master experience. Get one at [console.groq.com](https://console.groq.com) — no credit card required.

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

> The game works fully without an API key — the narrative engine uses template-based generation as a fallback. Add a Groq key in Settings for AI-powered responses.

---

## 🏗️ Architecture

The key design decision is the **separation of the game engine from React**. Everything in `src/engine/` is pure TypeScript with zero framework dependencies — it can be tested in isolation, reused, or ported to another frontend.

```
src/
├── engine/               # Pure TypeScript — no React imports
│   ├── dungeon/          # BSP generation, room population, bestiary
│   ├── narrative/        # Template engine, context variables, DM responses
│   ├── combat/           # Dice system, turn resolution, status effects
│   ├── character/        # Creation, stat calculation, levelling
│   ├── ai/               # Groq service, message history, system prompts
│   └── audio/            # Procedural sound generation (Web Audio API)
│
├── store/                # Zustand store — single source of truth
├── components/           # React UI layer
│   ├── screens/          # Full-screen views (Title, Game, CharCreation...)
│   ├── game/             # In-game panels (NarrativeLog, CombatPanel, Map...)
│   ├── character/        # CharacterSheet, InventoryPanel
│   └── ui/               # Reusable atoms (TypewriterText, Toast, DiceRoller)
├── types/                # All TypeScript interfaces in one place
└── utils/                # Save/load, formatting helpers
```

### Narrative Engine

Room descriptions are generated without any AI — a template system picks from 200+ patterns and substitutes contextual variables:

```
Template: "You enter a {size} {room_type}. {lighting}. {smell}."
Context:   size="cramped", room_type="crypt", lighting="Pale moss glows dimly",
           smell="The air reeks of decay"
Result:    "You enter a cramped crypt. Pale moss glows dimly. The air reeks of decay."
```

With ~500 variables across biomes, time-of-day, character state and room history, the same template generates thousands of unique variations.

### BSP Dungeon Generator

```
1. Start with the full map rectangle (80×60 tiles)
2. Recursively split into sub-spaces (random 40–60% split ratio)
3. Place a room in each leaf node (random size within bounds)
4. Connect adjacent rooms with L-shaped corridors
5. Assign room types and populate with enemies/loot
```

### AI Dungeon Master

The game state is serialised and injected into every Groq request as a system prompt. The model returns structured JSON with fields for `narrative`, `combatStart`, `itemFound`, `requiresRoll`, etc. — the frontend applies each mechanic programmatically:

```
Player types → buildSystemPrompt(gameState) → Groq API → parse DMResponse → apply mechanics
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI layer with strict typing |
| Vite | Fast dev server and bundler |
| Tailwind CSS | Utility-first dark fantasy styling |
| Zustand + Immer | Global game state with immutable updates |
| Framer Motion | Animations (dice, transitions, combat) |
| Canvas API | Dungeon map with fog of war |
| Groq API (Llama 3.1 70B) | Free AI Dungeon Master |
| Web Audio API | Procedural sound effects, zero audio files |
| localStorage | 3-slot save system with autosave |

---

## 📸 Screenshots

| Title Screen | Character Creation | Game Screen |
|---|---|---|
| ![Title](https://via.placeholder.com/280x160/0d1117/c9a227?text=Title+Screen) | ![Creation](https://via.placeholder.com/280x160/0d1117/c9a227?text=Character+Creation) | ![Game](https://via.placeholder.com/280x160/0d1117/c9a227?text=Game+Screen) |

| Combat | Dungeon Map | Inventory |
|---|---|---|
| ![Combat](https://via.placeholder.com/280x160/0d1117/8b1a1a?text=Combat+System) | ![Map](https://via.placeholder.com/280x160/0d1117/c9a227?text=Dungeon+Map) | ![Inv](https://via.placeholder.com/280x160/0d1117/c9a227?text=Inventory) |

---

## 🗺️ Roadmap

- [ ] **Multiplayer co-op** — two players in the same dungeon via Firebase Realtime DB
- [ ] **Leaderboard** — global top runs by floor reached and enemies defeated
- [ ] **Multiple floors** — descend deeper with increasing difficulty and new biomes
- [ ] **Spell system** — full spellcasting with slots, spell lists per class
- [ ] **Crafting** — combine items found in the dungeon
- [ ] **Boss lore** — unique AI-generated backstory for each boss encounter
- [ ] **Cloud saves** — sync progress across devices via Google Auth

---

## 📄 License

MIT © [your-name](https://github.com/your-username)

---

<div align="center">

Made with ⚔️ and too many d20 rolls

*If this project helped you or impressed you, consider leaving a ⭐*

</div>
