// ============================================================
// Sea Battle (Morskaya Bitva) — Main Game Engine
// Pirate Edition v2.0 — Aura marking, difficulty select, fleet status
// ============================================================

import { type Cell, type Position, type Ship, type Animation, type LogMessage, type AIOpponent, type FleetStatus, CellState, GamePhase, Orientation, AnimationType, AIDifficulty, DEFAULT_CONFIG, SHIP_NAMES, getTotalShips, getRandomPhrase, formatCoordinate } from './types';
import { createAI, easyMode, hardMode, updateAIAfterShot, placeAIShips, autoPlacePlayerShips } from './ai';
import { drawTitleScreen, drawDifficultyScreen, drawSetupScreen, drawBattleScreen, drawGameOverScreen } from './renderer';

const LOG_COLORS = { water: '#00ffff', playerShip: '#00ff41', hit: '#ff0040', miss: '#858585', sunk: '#ff6600', gold: '#ffd700', warning: '#ffaa00' };

export class SeaBattleGame {
  playerGrid: Cell[][] = []; enemyGrid: Cell[][] = [];
  playerShips: Ship[] = []; enemyShips: Ship[] = [];
  phase: GamePhase = GamePhase.TITLE; isPlayerTurn = true; isVictory = false;
  selectedDifficulty: AIDifficulty = AIDifficulty.HARD; difficultyCursor = 0;
  setupCursor: Position = { x: 0, y: 0 }; setupOrientation: Orientation = Orientation.HORIZONTAL;
  shipsToPlace: number[] = []; currentShipIndex = 0;
  battleCursor: Position = { x: 0, y: 0 };
  ai: AIOpponent = createAI(AIDifficulty.HARD);
  animations: Animation[] = []; messageLog: LogMessage[] = [];
  cursorVisible = true; blinkTimer = 0; titleBlinkVisible = true; titleBlinkTimer = 0;
  time = 0; keysPressed = new Set<string>(); lastKeyTime: Record<string, number> = {}; keyRepeatDelay = 150;
  aiTurnTimer = 0; aiTurnDelay = 800; isAIThinking = false;
  playerShots = 0; playerHits = 0; enemyShots = 0; enemyHits = 0;
  onInvalidate?: () => void;

  constructor() { this.init(); }

  init(): void {
    this.playerGrid = this.createEmptyGrid(); this.enemyGrid = this.createEmptyGrid();
    this.playerShips = []; this.enemyShips = [];
    this.phase = GamePhase.TITLE; this.isPlayerTurn = true; this.isVictory = false;
    this.animations = []; this.messageLog = []; this.time = 0;
    this.aiTurnTimer = 0; this.isAIThinking = false;
    this.playerShots = 0; this.playerHits = 0; this.enemyShots = 0; this.enemyHits = 0;
    this.selectedDifficulty = AIDifficulty.HARD; this.difficultyCursor = 0;
    this.shipsToPlace = []; for (const ship of DEFAULT_CONFIG.ships) { for (let i = 0; i < ship.count; i++) this.shipsToPlace.push(ship.size); }
    this.currentShipIndex = 0; this.setupCursor = { x: 0, y: 0 }; this.setupOrientation = Orientation.HORIZONTAL;
    this.battleCursor = { x: 0, y: 0 }; this.ai = createAI(AIDifficulty.HARD);
  }

  createEmptyGrid(): Cell[][] { const s = DEFAULT_CONFIG.gridSize; return Array.from({ length: s }, () => Array.from({ length: s }, () => ({ state: CellState.EMPTY, shipId: null }))); }

  startGame(): void { this.init(); this.phase = GamePhase.DIFFICULTY_SELECT; this.addLog('Выбери сложность, капитан!', LOG_COLORS.gold); }
  selectDifficulty(difficulty: AIDifficulty): void { this.selectedDifficulty = difficulty; this.ai = createAI(difficulty); this.phase = GamePhase.SETUP; this.playerGrid = this.createEmptyGrid(); this.enemyGrid = this.createEmptyGrid(); this.playerShips = []; this.currentShipIndex = 0; this.addLog(getRandomPhrase('setupStart'), LOG_COLORS.water); this.addLog('Стрелки — движение, Пробел — поворот, Enter — установка', LOG_COLORS.miss); this.addLog('Нажми R для авто-расстановки', LOG_COLORS.gold); }
  restart(): void { this.startGame(); }

  isValidShipPlacement(grid: Cell[][], x: number, y: number, size: number, orientation: Orientation): boolean {
    const gridSize = grid.length;
    for (let i = 0; i < size; i++) { const px = orientation === Orientation.HORIZONTAL ? x + i : x; const py = orientation === Orientation.VERTICAL ? y + i : y; if (px < 0 || px >= gridSize || py < 0 || py >= gridSize) return false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = px + dx, ny = py + dy; if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && grid[ny][nx].state === CellState.SHIP) return false; } }
    return true;
  }

  placeShip(grid: Cell[][], x: number, y: number, size: number, orientation: Orientation, shipId: number): { grid: Cell[][]; ship: Ship } {
    const newGrid = grid.map(r => r.map(c => ({ ...c }))); const positions: Position[] = [];
    for (let i = 0; i < size; i++) { const px = orientation === Orientation.HORIZONTAL ? x + i : x; const py = orientation === Orientation.VERTICAL ? y + i : y; newGrid[py][px] = { state: CellState.SHIP, shipId }; positions.push({ x: px, y: py }); }
    return { grid: newGrid, ship: { id: shipId, size, positions, hits: [], orientation, isSunk: false } };
  }

  tryPlaceShip(): boolean {
    if (this.currentShipIndex >= this.shipsToPlace.length) return false;
    const shipSize = this.shipsToPlace[this.currentShipIndex]; const { x, y } = this.setupCursor;
    if (!this.isValidShipPlacement(this.playerGrid, x, y, shipSize, this.setupOrientation)) { this.addLog('Нельзя разместить здесь! Слишком близко к другому кораблю.', LOG_COLORS.hit); return false; }
    const shipId = this.playerShips.length; const { grid, ship } = this.placeShip(this.playerGrid, x, y, shipSize, this.setupOrientation, shipId);
    this.playerGrid = grid; this.playerShips.push(ship); this.currentShipIndex++;
    this.addLog(`${SHIP_NAMES[shipSize] || 'Корабль'} размещен! (${this.currentShipIndex}/${getTotalShips()})`, LOG_COLORS.playerShip);
    if (this.currentShipIndex >= this.shipsToPlace.length) this.finishSetup(); return true;
  }

  autoPlacePlayer(): void {
    const remainingSizes = this.shipsToPlace.slice(this.currentShipIndex); if (remainingSizes.length === 0) return;
    const result = autoPlacePlayerShips(this.playerGrid, remainingSizes, this.playerShips.length); this.playerGrid = result.grid;
    for (const ship of result.ships) { this.playerShips.push(ship); this.currentShipIndex++; }
    this.addLog(getRandomPhrase('autoPlace'), LOG_COLORS.gold); this.finishSetup();
  }

  private finishSetup(): void {
    const shipSizes: number[] = []; for (const s of DEFAULT_CONFIG.ships) for (let i = 0; i < s.count; i++) shipSizes.push(s.size);
    const result = placeAIShips(this.enemyGrid, shipSizes); this.enemyGrid = result.grid; this.enemyShips = result.ships;
    this.isPlayerTurn = Math.random() < 0.5;
    this.addLog('Все корабли на позициях!', LOG_COLORS.playerShip);
    setTimeout(() => { this.phase = GamePhase.BATTLE; this.addLog(getRandomPhrase('battleStart'), LOG_COLORS.hit); if (this.isPlayerTurn) this.addLog('Первый ход за тобой, капитан!', LOG_COLORS.gold); else { this.isAIThinking = true; this.addLog('Враг ходит первым! Приготовиться!', LOG_COLORS.warning); } this.onInvalidate?.(); }, 600);
  }

  markAuraAroundShip(grid: Cell[][], ship: Ship): Cell[][] {
    const newGrid = grid.map(r => r.map(c => ({ ...c }))); const size = grid.length;
    for (const pos of ship.positions) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; const nx = pos.x + dx, ny = pos.y + dy; if (nx >= 0 && nx < size && ny >= 0 && ny < size && newGrid[ny][nx].state === CellState.EMPTY) newGrid[ny][nx] = { state: CellState.MISS, shipId: null }; }
    return newGrid;
  }

  playerFire(): boolean {
    if (!this.isPlayerTurn || this.phase !== GamePhase.BATTLE) return false;
    const { x, y } = this.battleCursor; const cell = this.enemyGrid[y][x];
    if (cell.state === CellState.HIT || cell.state === CellState.MISS || cell.state === CellState.SUNK) { this.addLog('Сюда уже стреляли! Выбери другую клетку.', LOG_COLORS.warning); return false; }
    this.playerShots++; let newGrid = this.enemyGrid.map(r => r.map(c => ({ ...c })));
    if (cell.state === CellState.SHIP) {
      newGrid[y][x] = { state: CellState.HIT, shipId: cell.shipId }; this.enemyGrid = newGrid; this.playerHits++;
      const ship = this.enemyShips.find(s => s.id === cell.shipId);
      if (ship) { ship.hits.push({ x, y }); if (ship.hits.length === ship.size) { ship.isSunk = true; for (const p of ship.positions) this.enemyGrid[p.y][p.x] = { state: CellState.SUNK, shipId: ship.id }; this.enemyGrid = this.markAuraAroundShip(this.enemyGrid, ship); this.addLog(`УБИЛ! ${SHIP_NAMES[ship.size] || 'Корабль'} потоплен!`, LOG_COLORS.sunk); this.addLog(getRandomPhrase('playerSunk'), LOG_COLORS.sunk); this.addAnimation(x + 10, y, AnimationType.SINK_FLASH, 6); } else { this.addLog(`РАНИЛ! Попадание в ${SHIP_NAMES[ship.size] || 'Корабль'} на ${formatCoordinate(x, y)}!`, LOG_COLORS.hit); this.addLog(getRandomPhrase('playerHit'), LOG_COLORS.hit); } }
      this.addAnimation(x + 10, y, AnimationType.HIT_EXPLOSION, 4); this.addTextBurst(x + 10, y, '*БУМ*', LOG_COLORS.hit);
      if (this.checkWin(this.enemyShips)) { this.isVictory = true; setTimeout(() => { this.phase = GamePhase.GAME_OVER; this.onInvalidate?.(); }, 1200); } return true;
    } else {
      newGrid[y][x] = { state: CellState.MISS, shipId: null }; this.enemyGrid = newGrid;
      this.addLog(`Мимо! Выстрел в ${formatCoordinate(x, y)}.`, LOG_COLORS.miss); this.addLog(getRandomPhrase('playerMiss'), LOG_COLORS.miss);
      this.addAnimation(x + 10, y, AnimationType.MISS_RIPPLE, 4); this.addTextBurst(x + 10, y, '*плюх*', LOG_COLORS.miss);
      this.isPlayerTurn = false; this.isAIThinking = true; this.aiTurnTimer = 0; return true;
    }
  }

  aiFire(): void {
    const pos = this.ai.difficulty === AIDifficulty.EASY ? easyMode(this.playerGrid) : hardMode(this.playerGrid, this.ai);
    const cell = this.playerGrid[pos.y][pos.x]; let newGrid = this.playerGrid.map(r => r.map(c => ({ ...c })));
    let isHit = false, isSunk = false; this.enemyShots++;
    if (cell.state === CellState.SHIP) {
      newGrid[pos.y][pos.x] = { state: CellState.HIT, shipId: cell.shipId }; isHit = true; this.enemyHits++;
      const ship = this.playerShips.find(s => s.id === cell.shipId);
      if (ship) { ship.hits.push(pos); if (ship.hits.length === ship.size) { ship.isSunk = true; isSunk = true; for (const p of ship.positions) newGrid[p.y][p.x] = { state: CellState.SUNK, shipId: ship.id }; newGrid = this.markAuraAroundShip(newGrid, ship); this.addLog(`Враг потопил ${SHIP_NAMES[ship.size] || 'Корабль'}!`, LOG_COLORS.sunk); this.addLog(getRandomPhrase('aiSunk'), LOG_COLORS.sunk); this.addAnimation(pos.x, pos.y, AnimationType.SINK_FLASH, 6); } else { this.addLog(`Враг ранил ${SHIP_NAMES[ship.size] || 'Корабль'} на ${formatCoordinate(pos.x, pos.y)}!`, LOG_COLORS.hit); this.addLog(getRandomPhrase('aiHit'), LOG_COLORS.hit); } }
      this.addAnimation(pos.x, pos.y, AnimationType.HIT_EXPLOSION, 4);
    } else { newGrid[pos.y][pos.x] = { state: CellState.MISS, shipId: null }; this.addLog(`Враг промахнулся на ${formatCoordinate(pos.x, pos.y)}.`, LOG_COLORS.miss); this.addLog(getRandomPhrase('aiMiss'), LOG_COLORS.miss); this.addAnimation(pos.x, pos.y, AnimationType.MISS_RIPPLE, 4); }
    this.playerGrid = newGrid; this.ai = updateAIAfterShot(this.ai, pos, isHit, isSunk, this.playerGrid);
    if (this.checkWin(this.playerShips)) { this.isVictory = false; setTimeout(() => { this.phase = GamePhase.GAME_OVER; this.onInvalidate?.(); }, 1200); return; }
    if (isHit && !isSunk) this.aiTurnTimer = 0; else { this.isPlayerTurn = true; this.isAIThinking = false; }
  }

  checkWin(ships: Ship[]): boolean { return ships.length > 0 && ships.every(s => s.isSunk); }

  getFleetStatus(ships: Ship[]): FleetStatus {
    const sunkShips = ships.filter(s => s.isSunk).length; const totalDecks = ships.reduce((sum, s) => sum + s.size, 0); const remainingDecks = ships.reduce((sum, s) => sum + (s.size - s.hits.length), 0);
    return { totalShips: ships.length, sunkShips, remainingDecks, totalDecks, ships: ships.map(s => ({ size: s.size, name: SHIP_NAMES[s.size] || 'Корабль', isSunk: s.isSunk })) };
  }

  addAnimation(x: number, y: number, type: AnimationType, maxFrames: number): void { this.animations.push({ type, x, y, frame: 0, maxFrames, timer: 0 }); }
  addTextBurst(x: number, y: number, text: string, color: string): void { this.animations.push({ type: AnimationType.TEXT_BURST, x, y, frame: 0, maxFrames: 8, timer: 0, text, color }); }
  updateAnimations(dt: number): void { for (const a of this.animations) { a.timer += dt; if (a.timer > 100) { a.timer = 0; a.frame++; } } this.animations = this.animations.filter(a => a.frame < a.maxFrames); }
  addLog(text: string, color: string): void { this.messageLog.push({ text, color, timestamp: Date.now() }); if (this.messageLog.length > 25) this.messageLog = this.messageLog.slice(-25); }

  handleKeyDown(key: string): void {
    this.keysPressed.add(key);
    switch (this.phase) { case GamePhase.TITLE: if (key === 'Enter') { this.startGame(); this.onInvalidate?.(); } break; case GamePhase.DIFFICULTY_SELECT: this.handleDifficultyInput(key); break; case GamePhase.SETUP: this.handleSetupInput(key); break; case GamePhase.BATTLE: this.handleBattleInput(key); break; case GamePhase.GAME_OVER: if (key === 'Enter') { this.restart(); this.onInvalidate?.(); } break; }
  }
  handleKeyUp(key: string): void { this.keysPressed.delete(key); this.lastKeyTime[key] = 0; }

  private handleDifficultyInput(key: string): void {
    switch (key) { case 'ArrowUp': case 'ArrowDown': this.difficultyCursor = this.difficultyCursor === 0 ? 1 : 0; break; case 'Enter': this.selectedDifficulty = this.difficultyCursor === 0 ? AIDifficulty.EASY : AIDifficulty.HARD; this.selectDifficulty(this.selectedDifficulty); break; }
    this.onInvalidate?.();
  }

  private handleSetupInput(key: string): void {
    const gridSize = DEFAULT_CONFIG.gridSize;
    switch (key) { case 'ArrowUp': this.setupCursor.y = Math.max(0, this.setupCursor.y - 1); break; case 'ArrowDown': this.setupCursor.y = Math.min(gridSize - 1, this.setupCursor.y + 1); break; case 'ArrowLeft': this.setupCursor.x = Math.max(0, this.setupCursor.x - 1); break; case 'ArrowRight': this.setupCursor.x = Math.min(gridSize - 1, this.setupCursor.x + 1); break; case ' ': { const isH = this.setupOrientation === Orientation.HORIZONTAL; if (this.currentShipIndex < this.shipsToPlace.length) { const size = this.shipsToPlace[this.currentShipIndex]; if (!isH) this.setupCursor.x = Math.min(gridSize - size, this.setupCursor.x); else this.setupCursor.y = Math.min(gridSize - size, this.setupCursor.y); } this.setupOrientation = isH ? Orientation.VERTICAL : Orientation.HORIZONTAL; break; } case 'Enter': case 'r': case 'R': if (key === 'r' || key === 'R') this.autoPlacePlayer(); else this.tryPlaceShip(); break; }
    if (this.currentShipIndex < this.shipsToPlace.length) { const size = this.shipsToPlace[this.currentShipIndex]; if (this.setupOrientation === Orientation.HORIZONTAL) this.setupCursor.x = Math.min(gridSize - size, this.setupCursor.x); else this.setupCursor.y = Math.min(gridSize - size, this.setupCursor.y); }
    this.onInvalidate?.();
  }

  private handleBattleInput(key: string): void { if (!this.isPlayerTurn || this.isAIThinking) return; const gridSize = DEFAULT_CONFIG.gridSize; switch (key) { case 'ArrowUp': this.battleCursor.y = Math.max(0, this.battleCursor.y - 1); break; case 'ArrowDown': this.battleCursor.y = Math.min(gridSize - 1, this.battleCursor.y + 1); break; case 'ArrowLeft': this.battleCursor.x = Math.max(0, this.battleCursor.x - 1); break; case 'ArrowRight': this.battleCursor.x = Math.min(gridSize - 1, this.battleCursor.x + 1); break; case 'Enter': this.playerFire(); break; } this.onInvalidate?.(); }
  handleContinuousInput(): void { const now = Date.now(); for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) if (this.keysPressed.has(key)) { const last = this.lastKeyTime[key] || 0; if (now - last > this.keyRepeatDelay) { this.lastKeyTime[key] = now; this.handleKeyDown(key); } } }

  update(dt: number): void {
    this.time += dt / 1000; this.blinkTimer += dt; if (this.blinkTimer > 500) { this.blinkTimer = 0; this.cursorVisible = !this.cursorVisible; }
    this.titleBlinkTimer += dt; if (this.titleBlinkTimer > 700) { this.titleBlinkTimer = 0; this.titleBlinkVisible = !this.titleBlinkVisible; }
    this.updateAnimations(dt); this.handleContinuousInput();
    if (this.phase === GamePhase.BATTLE && !this.isPlayerTurn && this.isAIThinking) { this.aiTurnTimer += dt; if (this.aiTurnTimer >= this.aiTurnDelay) { this.aiTurnTimer = 0; this.aiFire(); this.onInvalidate?.(); } }
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    switch (this.phase) {
      case GamePhase.TITLE: drawTitleScreen(ctx, w, h, this.time, this.titleBlinkVisible); break;
      case GamePhase.DIFFICULTY_SELECT: drawDifficultyScreen(ctx, w, h, this.time, this.difficultyCursor, this.titleBlinkVisible); break;
      case GamePhase.SETUP: { const cs = this.shipsToPlace[this.currentShipIndex] || 0; const isV = this.currentShipIndex < this.shipsToPlace.length ? this.isValidShipPlacement(this.playerGrid, this.setupCursor.x, this.setupCursor.y, cs, this.setupOrientation) : false; drawSetupScreen(ctx, w, h, this.time, this.playerGrid, this.setupCursor, this.cursorVisible, cs, this.setupOrientation, isV, this.currentShipIndex, getTotalShips(), this.playerShips); break; }
      case GamePhase.BATTLE: drawBattleScreen(ctx, w, h, this.time, this.playerGrid, this.enemyGrid, this.isPlayerTurn ? this.battleCursor : null, this.cursorVisible, this.isPlayerTurn, this.messageLog, this.getFleetStatus(this.playerShips), this.getFleetStatus(this.enemyShips), this.animations, this.battleCursor); break;
      case GamePhase.GAME_OVER: drawGameOverScreen(ctx, w, h, this.time, this.isVictory, this.titleBlinkVisible, this.messageLog); break;
    }
  }
}

export { GamePhase, CellState, Orientation, AnimationType, AIDifficulty, getTotalShips };
export type { Cell, Position, Ship, Animation, LogMessage };
