// ============================================================
// Sea Battle AI Opponent — Pirate Edition v2.0
// ============================================================

import { type Position, type AIOpponent, type Cell, type Ship, CellState, AIState, AIDifficulty } from './types';

export function createAI(difficulty: AIDifficulty = AIDifficulty.HARD): AIOpponent { return { difficulty, state: AIState.SEARCH, lastHit: null, hitDirection: null, targets: [] }; }

function getAvailableCells(grid: Cell[][]): Position[] { const avail: Position[] = [], size = grid.length; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const cell = grid[y][x]; if (cell.state === CellState.EMPTY || cell.state === CellState.SHIP) avail.push({ x, y }); } return avail; }
function isAvailable(grid: Cell[][], x: number, y: number): boolean { const size = grid.length; if (x < 0 || x >= size || y < 0 || y >= size) return false; const cell = grid[y][x]; return cell.state === CellState.EMPTY || cell.state === CellState.SHIP; }

export function easyMode(grid: Cell[][]): Position { const avail = getAvailableCells(grid); if (avail.length === 0) return { x: 0, y: 0 }; return avail[Math.floor(Math.random() * avail.length)]; }

export function hardMode(grid: Cell[][], ai: AIOpponent): Position {
  const size = grid.length;
  if (ai.targets.length > 0) { while (ai.targets.length > 0) { const target = ai.targets.shift()!; if (isAvailable(grid, target.x, target.y)) return target; } }
  if (ai.lastHit && ai.state !== AIState.SEARCH) {
    const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    if (ai.hitDirection) { const next = { x: ai.lastHit.x + ai.hitDirection.x, y: ai.lastHit.y + ai.hitDirection.y }; if (isAvailable(grid, next.x, next.y)) return next; if (ai.state === AIState.DESTROY && ai.lastHit) { const oppDir = { x: -ai.hitDirection.x, y: -ai.hitDirection.y }; let startX = ai.lastHit.x, startY = ai.lastHit.y; while (true) { const prevX = startX - ai.hitDirection.x, prevY = startY - ai.hitDirection.y; if (prevX < 0 || prevX >= size || prevY < 0 || prevY >= size || grid[prevY][prevX].state !== CellState.HIT) break; startX = prevX; startY = prevY; } const checkX = startX + oppDir.x, checkY = startY + oppDir.y; if (isAvailable(grid, checkX, checkY)) { ai.hitDirection = oppDir; return { x: checkX, y: checkY }; } } ai.state = AIState.SEARCH; ai.lastHit = null; ai.hitDirection = null; }
    const lastHitPos = ai.lastHit; if (!lastHitPos) return { x: 0, y: 0 }; for (const dir of directions) { const next = { x: lastHitPos.x + dir.x, y: lastHitPos.y + dir.y }; if (isAvailable(grid, next.x, next.y)) ai.targets.push(next); } if (ai.targets.length > 0) return ai.targets.shift()!; ai.state = AIState.SEARCH; ai.lastHit = null; ai.hitDirection = null;
  }
  const avail = getAvailableCells(grid); const checkerboard = avail.filter(p => (p.x + p.y) % 2 === 0); if (checkerboard.length > 0) return checkerboard[Math.floor(Math.random() * checkerboard.length)]; if (avail.length > 0) return avail[Math.floor(Math.random() * avail.length)]; return { x: 0, y: 0 };
}

export function updateAIAfterShot(ai: AIOpponent, pos: Position, isHit: boolean, isSunk: boolean, grid: Cell[][]): AIOpponent {
  const newAi: AIOpponent = { difficulty: ai.difficulty, state: ai.state, lastHit: ai.lastHit, hitDirection: ai.hitDirection, targets: [...ai.targets] }; const size = grid.length;
  if (isSunk) { newAi.state = AIState.SEARCH; newAi.lastHit = null; newAi.hitDirection = null; newAi.targets = []; }
  else if (isHit) { if (newAi.state === AIState.SEARCH) { newAi.state = AIState.TARGET; newAi.lastHit = { ...pos }; newAi.hitDirection = null; for (const dir of [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]) { const next = { x: pos.x + dir.x, y: pos.y + dir.y }; if (isAvailable(grid, next.x, next.y)) newAi.targets.push(next); } } else if (newAi.state === AIState.TARGET && newAi.lastHit) { newAi.hitDirection = { x: pos.x - newAi.lastHit.x, y: pos.y - newAi.lastHit.y }; newAi.state = AIState.DESTROY; newAi.lastHit = { ...pos }; if (newAi.hitDirection) { const next = { x: pos.x + newAi.hitDirection.x, y: pos.y + newAi.hitDirection.y }; if (isAvailable(grid, next.x, next.y)) newAi.targets.push(next); } } else if (newAi.state === AIState.DESTROY) { newAi.lastHit = { ...pos }; if (newAi.hitDirection) { const next = { x: pos.x + newAi.hitDirection.x, y: pos.y + newAi.hitDirection.y }; if (isAvailable(grid, next.x, next.y)) newAi.targets = [next]; else newAi.targets = []; } } }
  else { if (newAi.state === AIState.DESTROY && newAi.hitDirection && newAi.lastHit) { const oppDir = { x: -newAi.hitDirection.x, y: -newAi.hitDirection.y }; let startX = newAi.lastHit.x, startY = newAi.lastHit.y; while (true) { const prevX = startX - newAi.hitDirection!.x, prevY = startY - newAi.hitDirection!.y; if (prevX < 0 || prevX >= size || prevY < 0 || prevY >= size || grid[prevY][prevX].state !== CellState.HIT) break; startX = prevX; startY = prevY; } const checkX = startX + oppDir.x, checkY = startY + oppDir.y; if (isAvailable(grid, checkX, checkY)) { newAi.hitDirection = oppDir; newAi.targets = [{ x: checkX, y: checkY }]; } else newAi.targets = []; } }
  return newAi;
}

export function placeAIShips(grid: Cell[][], shipSizes: number[]): { grid: Cell[][]; ships: Ship[] } { return placeShipsOnGrid(grid, shipSizes, 0); }
export function autoPlacePlayerShips(grid: Cell[][], shipSizes: number[], startShipId: number): { grid: Cell[][]; ships: Ship[] } { return placeShipsOnGrid(grid, shipSizes, startShipId); }

function placeShipsOnGrid(grid: Cell[][], shipSizes: number[], startShipId: number): { grid: Cell[][]; ships: Ship[] } {
  const newGrid = grid.map(r => r.map(c => ({ ...c }))); const ships: Ship[] = []; let shipId = startShipId;
  for (const size of shipSizes) { let placed = false, attempts = 0; while (!placed && attempts < 1000) { attempts++; const orientation = Math.random() < 0.5 ? 'HORIZONTAL' : 'VERTICAL'; const maxX = orientation === 'HORIZONTAL' ? 10 - size : 10, maxY = orientation === 'VERTICAL' ? 10 - size : 10; const x = Math.floor(Math.random() * maxX), y = Math.floor(Math.random() * maxY); let valid = true; const positions: Position[] = []; for (let i = 0; i < size; i++) { const px = orientation === 'HORIZONTAL' ? x + i : x, py = orientation === 'VERTICAL' ? y + i : y; if (px < 0 || px >= 10 || py < 0 || py >= 10) { valid = false; break; } for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = px + dx, ny = py + dy; if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10 && newGrid[ny][nx].state === CellState.SHIP) { valid = false; break; } } if (!valid) break; positions.push({ x: px, y: py }); } if (valid && positions.length === size) { for (const pos of positions) newGrid[pos.y][pos.x] = { state: CellState.SHIP, shipId }; ships.push({ id: shipId, size, positions, hits: [], orientation: orientation as import('./types').Orientation, isSunk: false }); shipId++; placed = true; } } }
  return { grid: newGrid, ships };
}
