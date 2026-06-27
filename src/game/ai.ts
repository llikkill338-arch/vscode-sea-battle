// ============================================================
// Pirate Sea Battle — AI & Placement Logic
// ============================================================

import {
  type Grid, type Ship, type Cursor, type Message,
  COLORS, GRID_SIZE, COL_LABELS, SHIPS,
  createEmptyGrid, canPlaceShip, placeShip, autoPlaceShips, fireAt, markAura,
  isAllShipsSunk, getFleetStatus, cloneGrid,
} from './types';

// ─── helpers ───

function isInside(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function isFreeForShot(grid: Grid, x: number, y: number): boolean {
  if (!isInside(x, y)) return false;
  const c = grid.cells[y][x];
  return c === 'empty' || c === 'ship';
}

// ─── easy AI ───

export function easyAI(grid: Grid): Cursor {
  const free: Cursor[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (isFreeForShot(grid, x, y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
}

// ─── hard AI (checkerboard + hunt & destroy) ───

export interface HardAIState {
  mode: 'search' | 'hunt' | 'destroy';
  lastHit: Cursor | null;
  direction: number; // 0=up,1=right,2=down,3=left
  directionsTried: boolean[];
  origin: Cursor | null;
}

export function createHardAIState(): HardAIState {
  return { mode: 'search', lastHit: null, direction: 0, directionsTried: [false, false, false, false], origin: null };
}

const DIR_DX = [0, 1, 0, -1];
const DIR_DY = [-1, 0, 1, 0];

function getCheckerboardCells(grid: Grid): Cursor[] {
  const result: Cursor[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if ((x + y) % 2 === 0 && isFreeForShot(grid, x, y)) result.push({ x, y });
    }
  }
  return result;
}

export function hardAI(grid: Grid, state: HardAIState): { cursor: Cursor; state: HardAIState } {
  let s = { ...state };

  // Try current line in destroy mode
  if (s.mode === 'destroy' && s.lastHit) {
    const nx = s.lastHit.x + DIR_DX[s.direction];
    const ny = s.lastHit.y + DIR_DY[s.direction];
    if (isInside(nx, ny) && isFreeForShot(grid, nx, ny)) {
      return { cursor: { x: nx, y: ny }, state: s };
    }
    // Line blocked, try opposite direction from origin
    if (s.origin) {
      const oppDir = (s.direction + 2) % 4;
      s.direction = oppDir;
      s.lastHit = { ...s.origin };
      const ox = s.origin.x + DIR_DX[oppDir];
      const oy = s.origin.y + DIR_DY[oppDir];
      if (isInside(ox, oy) && isFreeForShot(grid, ox, oy)) {
        return { cursor: { x: ox, y: oy }, state: s };
      }
    }
    // Both directions exhausted
    s.mode = 'search';
    s.lastHit = null;
    s.origin = null;
    s.directionsTried = [false, false, false, false];
  }

  // Hunt mode: try adjacent cells
  if (s.mode === 'hunt' && s.lastHit) {
    for (let d = 0; d < 4; d++) {
      if (s.directionsTried[d]) continue;
      const nx = s.lastHit.x + DIR_DX[d];
      const ny = s.lastHit.y + DIR_DY[d];
      if (isInside(nx, ny) && isFreeForShot(grid, nx, ny)) {
        s.direction = d;
        s.directionsTried[d] = true;
        return { cursor: { x: nx, y: ny }, state: s };
      }
      s.directionsTried[d] = true;
    }
    // All directions exhausted
    s.mode = 'search';
    s.lastHit = null;
    s.origin = null;
    s.directionsTried = [false, false, false, false];
  }

  // Search mode: checkerboard pattern
  const checkerboard = getCheckerboardCells(grid);
  if (checkerboard.length > 0) {
    return { cursor: checkerboard[Math.floor(Math.random() * checkerboard.length)], state: s };
  }
  // Fallback: any free cell
  const free: Cursor[] = [];
  for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) if (isFreeForShot(grid, x, y)) free.push({ x, y });
  if (free.length > 0) return { cursor: free[Math.floor(Math.random() * free.length)], state: s };
  return { cursor: { x: 0, y: 0 }, state: s };
}

export function updateHardAI(state: HardAIState, hit: boolean, sunk: boolean): HardAIState {
  const s = { ...state };
  if (sunk) {
    s.mode = 'search';
    s.lastHit = null;
    s.origin = null;
    s.directionsTried = [false, false, false, false];
  } else if (hit) {
    if (s.mode === 'search') {
      s.mode = 'hunt';
      s.origin = s.lastHit ? { ...s.lastHit } : null;
      s.directionsTried = [false, false, false, false];
    } else if (s.mode === 'hunt') {
      s.mode = 'destroy';
    }
    // Update lastHit after the shot lands
  }
  return s;
}

export { createEmptyGrid, canPlaceShip, placeShip, autoPlaceShips, fireAt, markAura, isAllShipsSunk, getFleetStatus, cloneGrid, isInside };
