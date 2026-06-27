# VS Code Web Replica + Pirate Sea Battle

Interactive web replica of Visual Studio Code with a fully playable **Pirate Sea Battle** (Морской Бой) game running in the integrated terminal.

## Live Demo

[https://7dzmycyb7vhl2.kimi.page](https://7dzmycyb7vhl2.kimi.page)

## Features

### VS Code Interface
- **Activity Bar** — Explorer, Search, Source Control, Debug, Extensions icons
- **File Explorer** — Full C++ project tree with file icons, search filter, Open Editors
- **Git Panel** — 8+ commits, diff viewer, staged/unstaged changes
- **Search Panel** — Find-in-files with match highlighting
- **Code Editor** — Minimap, breadcrumbs, C++ syntax highlighting, line numbers
- **Command Palette** — Ctrl+Shift+P with 8+ commands
- **Status Bar** — Branch, cursor position, UTF-8, C++ mode

### Pirate Sea Battle Game
- **4 Game Phases**: Title -> Difficulty Select -> Setup -> Battle -> Game Over
- **Pirate Theme** — Russian text, pirate phrases, retro 80s neon aesthetic
- **Difficulty Selection** — Easy (random) / Hard (smart AI with hunt/destroy)
- **Fleet**: 1x4 Линкор, 2x3 Крейсер, 3x2 Эсминец, 4x1 Торпедный катер
- **Aura Marking** — Auto-mark surrounding cells when ship sunk (ореол)
- **Random First Turn** — 50/50 coin flip
- **Fleet Status Panel** — Live ship status for both sides
- **Auto-Placement** — Press 'R' for instant ship placement
- **Russian Grid Labels** — А, Б, В, Г, Д, Е, Ж, З, И, К
- **CRT Effects** — Scanlines, vignette, flicker, neon glow
- **Animations** — Hit explosions, miss ripples, sink flashes, text bursts

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3.4
- HTML5 Canvas 2D (game rendering)
- shadcn/ui components

## Game Controls

| Key | Action |
|-----|--------|
| `Arrow Keys` | Move cursor / aim |
| `Space` | Rotate ship (setup) |
| `Enter` | Fire / Place ship / Select |
| `R` | Auto-place ships |

## Architecture

```
src/
 components/       # VS Code UI components
 game/            # Sea Battle game engine (separate from UI)
  types.ts        # Game types, pirate phrases, colors
  SeaBattleGame.ts # Core game logic + state machine
  renderer.ts     # Canvas 2D rendering
  ai.ts           # Bot AI (easy + hard)
 lib/
  cppHighlighter.ts # C++ syntax highlighting
  fileContents.ts   # C++ source code for editor
 context/
  VSCodeContext.tsx # Global state management
```

## License

MIT
