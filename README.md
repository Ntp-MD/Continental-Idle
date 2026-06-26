# Continental Idle

An idle/incremental game built with Vue 3 + TypeScript + Vite.

## Features

- 37 themes across 6 continents
- Prestige system with favor multipliers
- Staff & assassin management
- Takeover mechanics
- Event system with raids
- Skill tree with 5 branches
- Offline progress
- In-game wiki

## Project Structure

```
src/
  components/
    layout/     # GameHeader, BuildingList, WorldMap, BuffBar
    panels/     # StaffPanel, PrestigePanel, SkillTreePanel, etc.
    overlays/   # StartScreen, EventPrompt, TutorialOverlay, etc.
  composables/  # useToast
  data/         # Game data (themes, buildings, staff, events, etc.)
    wiki/       # Wiki content definitions
  engine/       # Game logic modules
  styles/       # Global CSS (base, layout, components)
  types/        # TypeScript type definitions
tests/          # Test scripts (run with tsx)
docs/           # Documentation
```

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Type-check and build for production
npm run preview    # Preview production build
npm test           # Run gameplay tests
npm run test:all   # Run full feature test suite
```

## Tech Stack

- Vue 3 with `<script setup>` SFCs
- TypeScript (strict mode)
- Vite
- D3.js + topojson-client (world map)
