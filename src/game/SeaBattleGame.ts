// ============================================================
// Pirate Sea Battle — Main Game Engine (State Machine)
// ============================================================

import {
  type GameState, type Difficulty, type PlacementMode, type Orientation,
  type Grid, type Cursor, type Message, type FleetStatus,
  type Ship,
  GRID_SIZE, SHIPS, COLORS,
  createEmptyGrid, canPlaceShip, placeShip, autoPlaceShips,
  fireAt, getFleetStatus, isAllShipsSunk, getShipsToPlace,
} from './types';

import { resetAI, makeBotMove, autoPlace } from './ai';

import {
  drawLoading, drawMainMenu, drawBotSetup, drawSetup,
  drawBattle, drawBattle1v1, drawSettings, drawGameOver,
  drawTransition, drawExit,
} from './renderer';

export class SeaBattleGame {
  // ── State ──────────────────────────────────────────────
  private state: GameState = 'LOADING';

  // Timing
  private loadingProgress = 0;
  private loadingTimer = 0;
  private time = 0;

  // Menu
  private menuIndex = 0;

  // Bot setup
  private botDifficulty: Difficulty = 'easy';
  private botPlacement: PlacementMode = 'auto';
  private botSetupRow = 0;

  // Player grids
  private p1Grid: Grid = createEmptyGrid();
  private p2Grid: Grid = createEmptyGrid();
  private enemyGrid: Grid = createEmptyGrid();

  // Placement
  private placementCursor: Cursor = { x: 0, y: 0 };
  private placementOrientation: Orientation = 'horizontal';
  private p1ShipsPlaced: Ship[] = [];
  private p2ShipsPlaced: Ship[] = [];

  // Battle
  private battleCursor: Cursor = { x: 0, y: 0 };
  private isPlayerTurn = true;
  private current1v1Player = 1;
  private messages: Message[] = [];
  private cursorVisible = true;
  private cursorBlinkTimer = 0;
  private botThinkingTimer = 0;
  private isBotThinking = false;

  // Transition
  private transitionTimer = 0;

  // Game over
  private gameOverVictory = false;
  private gameOverWinner = '';
  private blinkTimer = 0;
  private blinkVisible = true;

  // Settings
  private settingsTime = 0;

  // 1v1 placement flow tracking
  private is1v1Mode = false;

  constructor() {
    this.state = 'LOADING';
    this.loadingProgress = 0;
    this.loadingTimer = 0;
    this.time = 0;
  }

  // ── Update ─────────────────────────────────────────────

  update(dt: number, time: number): void {
    this.time = time;

    switch (this.state) {
      case 'LOADING':
        this.loadingTimer += dt;
        this.loadingProgress = Math.min(this.loadingTimer / 2, 1);
        if (this.loadingTimer >= 2) {
          this.state = 'MAIN_MENU';
        }
        break;

      case 'BATTLE':
        this.cursorBlinkTimer += dt;
        if (this.cursorBlinkTimer > 0.5) {
          this.cursorBlinkTimer = 0;
          this.cursorVisible = !this.cursorVisible;
        }
        this.handleBotTurn(dt);
        break;

      case 'BATTLE_1V1':
        this.cursorBlinkTimer += dt;
        if (this.cursorBlinkTimer > 0.5) {
          this.cursorBlinkTimer = 0;
          this.cursorVisible = !this.cursorVisible;
        }
        break;

      case 'TRANSITION':
        this.transitionTimer -= dt;
        if (this.transitionTimer <= 0) {
          this.state = 'BATTLE_1V1';
        }
        break;

      case 'GAME_OVER':
        this.blinkTimer += dt;
        if (this.blinkTimer > 0.6) {
          this.blinkTimer = 0;
          this.blinkVisible = !this.blinkVisible;
        }
        break;

      case 'SETTINGS':
        this.settingsTime = time;
        break;

      case 'MAIN_MENU':
      case 'BOT_SETUP':
      case 'P1_SETUP':
      case 'P2_SETUP':
      case 'EXIT':
        // Static screens, no timers needed
        break;
    }
  }

  private handleBotTurn(dt: number): void {
    if (!this.isPlayerTurn && !this.isBotThinking) {
      this.isBotThinking = true;
      this.botThinkingTimer = 0.8; // Slight delay before bot fires
    }

    if (this.isBotThinking) {
      this.botThinkingTimer -= dt;
      if (this.botThinkingTimer <= 0) {
        this.isBotThinking = false;
        const move = makeBotMove(this.p1Grid, this.botDifficulty);

        let msgText = `Бот стреляет ${COL_LABELS[move.x]}${move.y + 1}: `;
        if (move.result.sunk) {
          msgText += `ПОТОПЛЕН! (${move.result.shipSize} пал.)`;
          this.addMessage(msgText, 'sunk');
        } else if (move.result.hit) {
          msgText += 'ПОПАДАНИЕ!';
          this.addMessage(msgText, 'hit');
        } else {
          msgText += 'МИМО...';
          this.addMessage(msgText, 'miss');
        }

        if (isAllShipsSunk(this.p1Grid)) {
          this.gameOverVictory = false;
          this.gameOverWinner = 'БОТ';
          this.addMessage('Ваш флот разбит! Поражение...', 'defeat');
          this.state = 'GAME_OVER';
          return;
        }

        if (!move.result.hit) {
          this.isPlayerTurn = true;
        } else {
          // Bot gets another turn on hit, continue loop
          this.isBotThinking = true;
          this.botThinkingTimer = 0.5;
        }
      }
    }
  }

  // ── Render ─────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.clearRect(0, 0, w, h);

    switch (this.state) {
      case 'LOADING':
        drawLoading(ctx, w, h, this.time, this.loadingProgress);
        break;

      case 'MAIN_MENU':
        drawMainMenu(ctx, w, h, this.menuIndex, this.time);
        break;

      case 'BOT_SETUP':
        drawBotSetup(ctx, w, h, this.botDifficulty, this.botPlacement, this.botSetupRow, this.time);
        break;

      case 'P1_SETUP': {
        const shipsToPlace = getShipsToPlace(this.p1ShipsPlaced);
        const currentShip = shipsToPlace[0];
        const isValid = currentShip ? canPlaceShip(
          this.p1Grid, this.placementCursor.x, this.placementCursor.y,
          currentShip.size, this.placementOrientation,
        ) : true;
        const totalShips = SHIPS.reduce((s, c) => s + c.count, 0);
        drawSetup(ctx, w, h, this.p1Grid, this.placementCursor,
          this.p1ShipsPlaced.length, totalShips,
          this.placementOrientation, isValid, this.time,
          'ИГРОК 1');
        break;
      }

      case 'P2_SETUP': {
        const shipsToPlace = getShipsToPlace(this.p2ShipsPlaced);
        const currentShip = shipsToPlace[0];
        const isValid = currentShip ? canPlaceShip(
          this.p2Grid, this.placementCursor.x, this.placementCursor.y,
          currentShip.size, this.placementOrientation,
        ) : true;
        const totalShips = SHIPS.reduce((s, c) => s + c.count, 0);
        drawSetup(ctx, w, h, this.p2Grid, this.placementCursor,
          this.p2ShipsPlaced.length, totalShips,
          this.placementOrientation, isValid, this.time,
          'ИГРОК 2');
        break;
      }

      case 'BATTLE':
        drawBattle(ctx, w, h, this.p1Grid, this.enemyGrid,
          getFleetStatus(this.p1Grid), getFleetStatus(this.enemyGrid),
          this.messages, this.isPlayerTurn, this.battleCursor,
          this.cursorVisible, this.time);
        break;

      case 'BATTLE_1V1': {
        const isP1Turn = this.current1v1Player === 1;
        const activeGrid = isP1Turn ? this.p2Grid : this.p1Grid;
        const inactiveGrid = isP1Turn ? this.p1Grid : this.p2Grid;
        const activeFleet = getFleetStatus(activeGrid);
        const inactiveFleet = getFleetStatus(inactiveGrid);
        drawBattle1v1(ctx, w, h, inactiveGrid, activeGrid,
          inactiveFleet, activeFleet, this.messages,
          this.current1v1Player, this.battleCursor,
          this.cursorVisible, this.time);
        break;
      }

      case 'TRANSITION': {
        const pName = this.current1v1Player === 1 ? 'Игроку 1' : 'Игроку 2';
        drawTransition(ctx, w, h, pName, this.transitionTimer);
        break;
      }

      case 'GAME_OVER':
        drawGameOver(ctx, w, h, this.gameOverVictory, this.time,
          this.blinkVisible, this.gameOverWinner);
        break;

      case 'SETTINGS':
        drawSettings(ctx, w, h, this.time);
        break;

      case 'EXIT':
        drawExit(ctx, w, h, this.time);
        break;
    }
  }

  // ── Input ──────────────────────────────────────────────

  handleKeyDown(key: string): void {
    switch (this.state) {
      case 'MAIN_MENU':
        this.handleMenuInput(key);
        break;
      case 'BOT_SETUP':
        this.handleBotSetupInput(key);
        break;
      case 'P1_SETUP':
        this.handlePlacementInput(key, 1);
        break;
      case 'P2_SETUP':
        this.handlePlacementInput(key, 2);
        break;
      case 'BATTLE':
        this.handleBattleInput(key);
        break;
      case 'BATTLE_1V1':
        this.handleBattle1v1Input(key);
        break;
      case 'GAME_OVER':
        if (key === 'Enter') {
          this.resetToMenu();
        }
        break;
      case 'SETTINGS':
        if (key === 'Enter' || key === 'Escape') {
          this.state = 'MAIN_MENU';
        }
        break;
      case 'EXIT':
        // Do nothing, wait for F5
        break;
    }
  }

  handleKeyUp(_key: string): void {
    // No key-up handling needed
  }

  // ── Input handlers ─────────────────────────────────────

  private handleMenuInput(key: string): void {
    switch (key) {
      case 'ArrowUp':
        this.menuIndex = (this.menuIndex - 1 + 4) % 4;
        break;
      case 'ArrowDown':
        this.menuIndex = (this.menuIndex + 1) % 4;
        break;
      case 'Enter':
        this.activateMenuItem(this.menuIndex);
        break;
    }
  }

  private activateMenuItem(index: number): void {
    switch (index) {
      case 0: // BOT_SETUP
        this.state = 'BOT_SETUP';
        this.botSetupRow = 0;
        this.is1v1Mode = false;
        break;
      case 1: // 1v1
        this.is1v1Mode = true;
        this.start1v1Placement();
        break;
      case 2: // Settings
        this.state = 'SETTINGS';
        break;
      case 3: // Exit
        this.state = 'EXIT';
        break;
    }
  }

  private handleBotSetupInput(key: string): void {
    switch (key) {
      case 'ArrowUp':
        this.botSetupRow = (this.botSetupRow - 1 + 3) % 3;
        break;
      case 'ArrowDown':
        this.botSetupRow = (this.botSetupRow + 1) % 3;
        break;
      case 'ArrowLeft':
        if (this.botSetupRow === 0) {
          this.botDifficulty = this.botDifficulty === 'easy' ? 'hard' : 'easy';
        } else if (this.botSetupRow === 1) {
          this.botPlacement = this.botPlacement === 'auto' ? 'manual' : 'auto';
        }
        break;
      case 'ArrowRight':
        if (this.botSetupRow === 0) {
          this.botDifficulty = this.botDifficulty === 'easy' ? 'hard' : 'easy';
        } else if (this.botSetupRow === 1) {
          this.botPlacement = this.botPlacement === 'auto' ? 'manual' : 'auto';
        }
        break;
      case 'Enter':
        if (this.botSetupRow === 2) {
          this.startBotBattle();
        }
        break;
      case 'Escape':
        this.state = 'MAIN_MENU';
        break;
    }
  }

  private startBotBattle(): void {
    // Reset grids
    this.p1Grid = createEmptyGrid();
    this.enemyGrid = createEmptyGrid();
    this.p1ShipsPlaced = [];
    this.messages = [];
    resetAI();

    if (this.botPlacement === 'auto') {
      // Auto-place both
      autoPlace(this.p1Grid);
      this.p1Grid.ships.forEach(s => this.p1ShipsPlaced.push(s));
      autoPlace(this.enemyGrid);
      this.startBattle();
    } else {
      // Manual placement for player, auto for bot
      autoPlace(this.enemyGrid);
      this.placementCursor = { x: 0, y: 0 };
      this.placementOrientation = 'horizontal';
      this.state = 'P1_SETUP';
      this.is1v1Mode = false;
    }
  }

  private start1v1Placement(): void {
    this.p1Grid = createEmptyGrid();
    this.p2Grid = createEmptyGrid();
    this.p1ShipsPlaced = [];
    this.p2ShipsPlaced = [];
    this.messages = [];
    this.placementCursor = { x: 0, y: 0 };
    this.placementOrientation = 'horizontal';
    this.state = 'P1_SETUP';
  }

  private handlePlacementInput(key: string, player: number): void {
    const grid = player === 1 ? this.p1Grid : this.p2Grid;
    const placed = player === 1 ? this.p1ShipsPlaced : this.p2ShipsPlaced;
    const shipsToPlace = getShipsToPlace(placed);

    if (shipsToPlace.length === 0) {
      // All ships placed
      if (player === 1 && this.is1v1Mode) {
        this.state = 'P2_SETUP';
        this.placementCursor = { x: 0, y: 0 };
        this.placementOrientation = 'horizontal';
        return;
      } else if (player === 2 && this.is1v1Mode) {
        this.start1v1Battle();
        return;
      } else if (player === 1 && !this.is1v1Mode) {
        this.startBattle();
        return;
      }
    }

    const currentShip = shipsToPlace[0];

    switch (key) {
      case 'ArrowUp':
        this.placementCursor.y = Math.max(0, this.placementCursor.y - 1);
        break;
      case 'ArrowDown':
        this.placementCursor.y = Math.min(GRID_SIZE - 1, this.placementCursor.y + 1);
        break;
      case 'ArrowLeft':
        this.placementCursor.x = Math.max(0, this.placementCursor.x - 1);
        break;
      case 'ArrowRight':
        this.placementCursor.x = Math.min(GRID_SIZE - 1, this.placementCursor.x + 1);
        break;
      case ' ': // Space to rotate
        this.placementOrientation = this.placementOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        break;
      case 'Enter': {
        const size = currentShip.size;
        if (canPlaceShip(grid, this.placementCursor.x, this.placementCursor.y, size, this.placementOrientation)) {
          const ship = placeShip(grid, this.placementCursor.x, this.placementCursor.y, size, this.placementOrientation);
          placed.push(ship);
          // Check if all placed
          const remaining = getShipsToPlace(placed);
          if (remaining.length === 0) {
            if (player === 1 && this.is1v1Mode) {
              this.state = 'P2_SETUP';
              this.placementCursor = { x: 0, y: 0 };
              this.placementOrientation = 'horizontal';
            } else if (player === 2 && this.is1v1Mode) {
              this.start1v1Battle();
            } else {
              this.startBattle();
            }
          }
        }
        break;
      }
      case 'r':
      case 'R': {
        // Auto-place all remaining
        grid.cells = createEmptyGrid().cells;
        grid.ships = [];
        // Keep already placed ships
        for (const s of placed) {
          if (s.orientation === 'horizontal') {
            for (let i = 0; i < s.size; i++) grid.cells[s.y][s.x + i] = 'ship';
          } else {
            for (let i = 0; i < s.size; i++) grid.cells[s.y + i][s.x] = 'ship';
          }
          grid.ships.push(s);
        }
        // Place remaining
        const remainingShips = getShipsToPlace(placed);
        for (const rs of remainingShips) {
          let placedOk = false;
          for (let attempts = 0; attempts < 500 && !placedOk; attempts++) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            const orient: Orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
            if (canPlaceShip(grid, x, y, rs.size, orient)) {
              const s = placeShip(grid, x, y, rs.size, orient);
              placed.push(s);
              placedOk = true;
            }
          }
        }
        if (player === 1 && this.is1v1Mode) {
          this.state = 'P2_SETUP';
          this.placementCursor = { x: 0, y: 0 };
          this.placementOrientation = 'horizontal';
        } else if (player === 2 && this.is1v1Mode) {
          this.start1v1Battle();
        } else {
          this.startBattle();
        }
        break;
      }
      case 'Escape':
        this.resetToMenu();
        break;
    }
  }

  private startBattle(): void {
    this.battleCursor = { x: 0, y: 0 };
    this.isPlayerTurn = Math.random() > 0.5;
    this.messages = [];
    this.cursorVisible = true;
    this.isBotThinking = false;
    this.botThinkingTimer = 0;
    resetAI();

    if (this.isPlayerTurn) {
      this.addMessage('Вы ходите первым!', 'info');
    } else {
      this.addMessage('Бот ходит первым!', 'info');
    }

    this.state = 'BATTLE';
  }

  private start1v1Battle(): void {
    this.battleCursor = { x: 0, y: 0 };
    this.current1v1Player = Math.random() > 0.5 ? 1 : 2;
    this.messages = [];
    this.cursorVisible = true;
    resetAI();

    this.addMessage(`Игрок ${this.current1v1Player} ходит первым!`, 'info');
    this.state = 'BATTLE_1V1';
  }

  private handleBattleInput(key: string): void {
    if (!this.isPlayerTurn) return; // Bot is thinking

    switch (key) {
      case 'ArrowUp':
        this.battleCursor.y = Math.max(0, this.battleCursor.y - 1);
        break;
      case 'ArrowDown':
        this.battleCursor.y = Math.min(GRID_SIZE - 1, this.battleCursor.y + 1);
        break;
      case 'ArrowLeft':
        this.battleCursor.x = Math.max(0, this.battleCursor.x - 1);
        break;
      case 'ArrowRight':
        this.battleCursor.x = Math.min(GRID_SIZE - 1, this.battleCursor.x + 1);
        break;
      case 'Enter':
        this.playerFire(this.enemyGrid, this.battleCursor.x, this.battleCursor.y);
        break;
      case 'Escape':
        this.resetToMenu();
        break;
    }
  }

  private handleBattle1v1Input(key: string): void {
    switch (key) {
      case 'ArrowUp':
        this.battleCursor.y = Math.max(0, this.battleCursor.y - 1);
        break;
      case 'ArrowDown':
        this.battleCursor.y = Math.min(GRID_SIZE - 1, this.battleCursor.y + 1);
        break;
      case 'ArrowLeft':
        this.battleCursor.x = Math.max(0, this.battleCursor.x - 1);
        break;
      case 'ArrowRight':
        this.battleCursor.x = Math.min(GRID_SIZE - 1, this.battleCursor.x + 1);
        break;
      case 'Enter': {
        const targetGrid = this.current1v1Player === 1 ? this.p2Grid : this.p1Grid;
        const result = fireAt(targetGrid, this.battleCursor.x, this.battleCursor.y);
        const label = COL_LABELS[this.battleCursor.x];
        const row = this.battleCursor.y + 1;
        const playerName = this.current1v1Player === 1 ? 'ИГРОК 1' : 'ИГРОК 2';

        let msg = `${playerName} → ${label}${row}: `;
        if (result.sunk) {
          msg += `ПОТОПЛЕН!`;
          this.addMessage(msg, 'sunk');
        } else if (result.hit) {
          msg += `ПОПАДАНИЕ!`;
          this.addMessage(msg, 'hit');
        } else {
          msg += `МИМО...`;
          this.addMessage(msg, 'miss');
        }

        if (isAllShipsSunk(targetGrid)) {
          this.gameOverVictory = true;
          this.gameOverWinner = playerName;
          this.addMessage(`${playerName} ПОБЕЖДАЕТ!`, 'victory');
          this.state = 'GAME_OVER';
          return;
        }

        if (!result.hit) {
          // Switch player with transition
          this.current1v1Player = this.current1v1Player === 1 ? 2 : 1;
          this.transitionTimer = 3;
          this.state = 'TRANSITION';
          this.battleCursor = { x: 0, y: 0 };
        }
        // Hit = same player continues
        break;
      }
      case 'Escape':
        this.resetToMenu();
        break;
    }
  }

  private playerFire(grid: Grid, x: number, y: number): void {
    const cell = grid.cells[y][x];
    if (cell === 'hit' || cell === 'miss' || cell === 'sunk') {
      return; // Already fired here
    }

    const result = fireAt(grid, x, y);
    const label = COL_LABELS[x];
    const row = y + 1;

    if (result.sunk) {
      this.addMessage(`Вы → ${label}${row}: ПОТОПЛЕН! (${result.shipSize} пал.)`, 'sunk');
    } else if (result.hit) {
      this.addMessage(`Вы → ${label}${row}: ПОПАДАНИЕ!`, 'hit');
    } else {
      this.addMessage(`Вы → ${label}${row}: МИМО...`, 'miss');
    }

    if (isAllShipsSunk(grid)) {
      this.gameOverVictory = true;
      this.gameOverWinner = 'ВЫ';
      this.addMessage('Вы уничтожили вражеский флот! ПОБЕДА!', 'victory');
      this.state = 'GAME_OVER';
      return;
    }

    if (!result.hit) {
      this.isPlayerTurn = false;
      this.isBotThinking = false;
    }
  }

  private addMessage(text: string, type: 'info' | 'hit' | 'miss' | 'sunk' | 'victory' | 'defeat'): void {
    this.messages.push({ text, time: this.time, type });
    if (this.messages.length > 20) {
      this.messages.shift();
    }
  }

  private resetToMenu(): void {
    this.state = 'MAIN_MENU';
    this.menuIndex = 0;
    this.p1Grid = createEmptyGrid();
    this.p2Grid = createEmptyGrid();
    this.enemyGrid = createEmptyGrid();
    this.p1ShipsPlaced = [];
    this.p2ShipsPlaced = [];
    this.messages = [];
    this.is1v1Mode = false;
    resetAI();
  }
}

// Export labels for renderer
const COL_LABELS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];
