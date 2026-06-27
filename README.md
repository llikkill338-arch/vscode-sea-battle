# VS Code Web Replica + Pirate Sea Battle

Interactive web replica of Visual Studio Code featuring a standalone Pirate Sea Battle game launcher.

## 🎮 Live Demo

**VS Code Replica:** [https://7dzmycyb7vhl2.kimi.page](https://7dzmycyb7vhl2.kimi.page)

**Standalone Game:** [https://7dzmycyb7vhl2.kimi.page](https://7dzmycyb7vhl2.kimi.page) (click "Launch Game" in terminal)

## 🏴‍☠️ Standalone Game Features

### 4 Main Menu Items
1. **⚔ Бой с ботом** — Battle against AI bot
   - Choose difficulty: Easy (random) / Hard (smart hunt/destroy AI)
   - Choose placement: Auto / Manual
   - Navigate with ↑↓, change with ←→, Enter to start
2. **👥 1 на 1** — Two players on one PC
   - Players take turns placing ships
   - 3-second timer between turns
   - Battle with turn switching
3. **⚙ Настройки** — Game info & controls
4. **🚪 Выход** — Exit game

### Game Mechanics
- **10×10 grid** with Russian labels А-К (no Й)
- **Fleet:** 1×4 Линкор, 2×3 Крейсер, 3×2 Эсминец, 4×1 Торпедный катер
- **Aura marking** (autovycherkivanie): surrounding cells auto-marked as miss
- **Random first turn** (50/50)
- **Pirate phrases** for hit/miss/sunk/victory/defeat
- **CRT effects:** scanlines, vignette, flicker
- **Neon glow** on all interactive elements

## 🖥️ VS Code Interface

- **Activity Bar** — Explorer, Search, Source Control, Debug, Extensions
- **File Explorer** — Full C++ project tree with file icons
- **Git Panel** — 9 commits, diff viewer, staged/unstaged changes
- **Code Editor** — Minimap, breadcrumbs, C++ syntax highlighting
- **Command Palette** — Ctrl+Shift+P
- **Terminal** — Launch button for standalone game

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| VS Code UI | React 19 + TypeScript + Tailwind CSS + shadcn/ui |
| Standalone Game | Vanilla TypeScript + HTML5 Canvas 2D |
| Build Tool | Vite |
| Fonts | Press Start 2P, VT323, JetBrains Mono |

## 📁 Project Structure

```
VS Code Replica/
├── src/components/     # VS Code UI components
│   ├── VSCodeShell.tsx
│   ├── Editor.tsx      # Code editor + minimap
│   ├── Terminal.tsx    # Game launcher
│   ├── GitPanel.tsx
│   └── ...
├── src/game/           # In-VS-Code game engine
└── ...

Standalone Game/
├── src/
│   ├── types.ts        # Game types & constants
│   ├── ai.ts           # Bot AI (easy + hard)
│   ├── game.ts         # State machine
│   ├── renderer.ts     # Canvas 2D rendering
│   ├── input.ts        # Keyboard handler
│   └── main.ts         # Entry point
└── index.html
```

## 🎮 Controls

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate menu / move cursor |
| `←` `→` | Change option value |
| `Enter` | Confirm / fire |
| `Space` | Rotate ship |
| `R` | Auto-place ships |

## 📜 License

MIT
