// ============================================================
// Pirate Sea Battle — Type Definitions, Constants & Utilities
// ============================================================

export const COLORS = {
  bg: '#0a0a0f',
  water: '#00ffff',
  playerShip: '#00ff41',
  hit: '#ff0040',
  miss: '#555555',
  cursor: '#ffff00',
  sunk: '#ff6600',
  gold: '#ffd700',
  text: '#e0e0e0',
  gridLine: 'rgba(0,255,65,0.25)',
  scanline: 'rgba(0,255,65,0.03)',
} as const;

export type GameState =
  | 'LOADING'
  | 'MAIN_MENU'
  | 'BOT_SETUP'
  | 'P1_SETUP'
  | 'P2_SETUP'
  | 'BATTLE'
  | 'BATTLE_1V1'
  | 'TRANSITION'
  | 'GAME_OVER'
  | 'SETTINGS'
  | 'EXIT';

export type Difficulty = 'easy' | 'hard';
export type PlacementMode = 'auto' | 'manual';
export type Orientation = 'horizontal' | 'vertical';
export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export interface ShipConfig {
  size: number;
  count: number;
  label: string;
}

export const SHIPS: ShipConfig[] = [
  { size: 4, count: 1, label: '\u0427\u0435\u0442\u044b\u0440\u0451\u0445\u043f\u0430\u043b\u0443\u0431\u043d\u044b\u0439' },
  { size: 3, count: 2, label: '\u0422\u0440\u0451\u0445\u043f\u0430\u043b\u0443\u0431\u043d\u044b\u0439' },
  { size: 2, count: 3, label: '\u0414\u0432\u0443\u0445\u043f\u0430\u043b\u0443\u0431\u043d\u044b\u0439' },
  { size: 1, count: 4, label: '\u041e\u0434\u043d\u043e\u043f\u0430\u043b\u0443\u0431\u043d\u044b\u0439' },
];

export const GRID_SIZE = 10;
export const COL_LABELS = ['\u0410', '\u0411', '\u0412', '\u0413', '\u0414', '\u0415', '\u0416', '\u0417', '\u0418', '\u041a'];

export interface Ship {
  x: number;
  y: number;
  size: number;
  orientation: Orientation;
  hits: number;
  sunk: boolean;
}

export interface Grid {
  cells: CellState[][];
  ships: Ship[];
}

export interface Cursor {
  x: number;
  y: number;
}

export interface Message {
  text: string;
  time: number;
  type: 'info' | 'hit' | 'miss' | 'sunk' | 'victory' | 'defeat';
}

export interface FleetStatus {
  total: number;
  sunk: number;
  ships: { size: number; sunk: boolean }[];
}

export function createEmptyGrid(): Grid {
  const cells: CellState[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    cells[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      cells[y][x] = 'empty';
    }
  }
  return { cells, ships: [] };
}

export function cloneGrid(grid: Grid): Grid {
  return {
    cells: grid.cells.map(row => [...row]),
    ships: grid.ships.map(s => ({ ...s, hits: s.hits, sunk: s.sunk })),
  };
}

export function canPlaceShip(grid: Grid, x: number, y: number, size: number, orientation: Orientation): boolean {
  if (orientation === 'horizontal') {
    if (x + size > GRID_SIZE) return false;
    for (let i = 0; i < size; i++) {
      if (!isCellFree(grid, x + i, y)) return false;
    }
  } else {
    if (y + size > GRID_SIZE) return false;
    for (let i = 0; i < size; i++) {
      if (!isCellFree(grid, x, y + i)) return false;
    }
  }
  return true;
}

export function isCellFree(grid: Grid, x: number, y: number): boolean {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        if (grid.cells[ny][nx] === 'ship' || grid.cells[ny][nx] === 'sunk') return false;
      }
    }
  }
  return true;
}

export function placeShip(grid: Grid, x: number, y: number, size: number, orientation: Orientation): Ship {
  const ship: Ship = { x, y, size, orientation, hits: 0, sunk: false };
  if (orientation === 'horizontal') {
    for (let i = 0; i < size; i++) {
      grid.cells[y][x + i] = 'ship';
    }
  } else {
    for (let i = 0; i < size; i++) {
      grid.cells[y + i][x] = 'ship';
    }
  }
  grid.ships.push(ship);
  return ship;
}

export function autoPlaceShips(grid: Grid): void {
  grid.cells = createEmptyGrid().cells;
  grid.ships = [];
  for (const shipConfig of SHIPS) {
    for (let c = 0; c < shipConfig.count; c++) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 500) {
        attempts++;
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const orientation: Orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        if (canPlaceShip(grid, x, y, shipConfig.size, orientation)) {
          placeShip(grid, x, y, shipConfig.size, orientation);
          placed = true;
        }
      }
    }
  }
}

export function fireAt(grid: Grid, x: number, y: number): { hit: boolean; sunk: boolean; shipSize: number } {
  const cell = grid.cells[y][x];
  if (cell === 'ship') {
    grid.cells[y][x] = 'hit';
    const ship = grid.ships.find(s => {
      if (s.orientation === 'horizontal') {
        return y === s.y && x >= s.x && x < s.x + s.size;
      } else {
        return x === s.x && y >= s.y && y < s.y + s.size;
      }
    });
    if (ship) {
      ship.hits++;
      if (ship.hits >= ship.size) {
        ship.sunk = true;
        markAura(grid, ship);
        return { hit: true, sunk: true, shipSize: ship.size };
      }
      return { hit: true, sunk: false, shipSize: ship.size };
    }
    return { hit: true, sunk: false, shipSize: 0 };
  } else if (cell === 'empty') {
    grid.cells[y][x] = 'miss';
    return { hit: false, sunk: false, shipSize: 0 };
  }
  return { hit: false, sunk: false, shipSize: 0 };
}

export function markAura(grid: Grid, ship: Ship): void {
  if (ship.orientation === 'horizontal') {
    for (let i = 0; i < ship.size; i++) {
      grid.cells[ship.y][ship.x + i] = 'sunk';
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= ship.size; dx++) {
        const nx = ship.x + dx;
        const ny = ship.y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (grid.cells[ny][nx] === 'empty') {
            grid.cells[ny][nx] = 'miss';
          }
        }
      }
    }
  } else {
    for (let i = 0; i < ship.size; i++) {
      grid.cells[ship.y + i][ship.x] = 'sunk';
    }
    for (let dy = -1; dy <= ship.size; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = ship.x + dx;
        const ny = ship.y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (grid.cells[ny][nx] === 'empty') {
            grid.cells[ny][nx] = 'miss';
          }
        }
      }
    }
  }
}

export function getFleetStatus(grid: Grid): FleetStatus {
  const ships = grid.ships.map(s => ({ size: s.size, sunk: s.sunk }));
  return {
    total: ships.length,
    sunk: ships.filter(s => s.sunk).length,
    ships,
  };
}

export function isAllShipsSunk(grid: Grid): boolean {
  return grid.ships.length > 0 && grid.ships.every(s => s.sunk);
}

export function getShipsToPlace(placed: Ship[]): { size: number; label: string }[] {
  const result: { size: number; label: string }[] = [];
  for (const config of SHIPS) {
    const placedCount = placed.filter(s => s.size === config.size).length;
    for (let i = placedCount; i < config.count; i++) {
      result.push({ size: config.size, label: config.label });
    }
  }
  return result;
}

export function getCellSymbol(cell: CellState, isEnemy: boolean): string {
  switch (cell) {
    case 'empty': return '~';
    case 'ship': return isEnemy ? '~' : '\u2588';
    case 'hit': return '\u2716';
    case 'miss': return '\u2022';
    case 'sunk': return '#';
    default: return '~';
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
