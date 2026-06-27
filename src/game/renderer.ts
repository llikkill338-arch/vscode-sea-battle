// ============================================================
// Pirate Sea Battle — Canvas 2D Renderer (ALL screens)
// ============================================================

import {
  COLORS, GRID_SIZE, COL_LABELS, type Grid, type Cursor,
  type FleetStatus, type Message, getCellSymbol,
} from './types';

// ── CRT Effects ──────────────────────────────────────────────

function applyCRTEffects(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  // Scanlines
  ctx.fillStyle = COLORS.scanline;
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1);
  }
  // Vignette
  const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.85);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  // Subtle flicker
  ctx.fillStyle = `rgba(0,255,65,${0.01 + Math.sin(time * 12) * 0.005})`;
  ctx.fillRect(0, 0, w, h);
}

// ── Shared helpers ───────────────────────────────────────────

function drawPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left'): void {
  ctx.font = `${size}px 'Press Start 2P', monospace`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawUIText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left'): void {
  ctx.font = `${size}px 'VT323', monospace`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawPirateFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // Corner ornaments
  const c = 8;
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x, y, c, 2);
  ctx.fillRect(x, y, 2, c);
  ctx.fillRect(x + w - c, y, c, 2);
  ctx.fillRect(x + w - 2, y, 2, c);
  ctx.fillRect(x, y + h - 2, c, 2);
  ctx.fillRect(x, y + h - c, 2, c);
  ctx.fillRect(x + w - c, y + h - 2, c, 2);
  ctx.fillRect(x + w - 2, y + h - c, 2, c);
}

// ── LOADING ──────────────────────────────────────────────────

export function drawLoading(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, progress: number): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  drawPixelText(ctx, 'ЗАГРУЗКА', cx, cy - 40, 24, COLORS.gold, 'center');

  // Loading bar
  const barW = 300;
  const barH = 20;
  const barX = cx - barW / 2;
  const barY = cy + 10;
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = COLORS.playerShip;
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);

  // Percentage
  drawUIText(ctx, `${Math.floor(progress * 100)}%`, cx, barY + barH + 20, 20, COLORS.text, 'center');

  // Decorative waves
  ctx.strokeStyle = COLORS.water;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < barW; i += 4) {
    const waveY = barY + barH + 35 + Math.sin(time * 3 + i * 0.05) * 4;
    ctx.lineTo(barX + i, waveY);
  }
  ctx.stroke();

  applyCRTEffects(ctx, w, h, time);
}

// ── MAIN MENU ────────────────────────────────────────────────

const MENU_ITEMS = [
  '⚔ БОЙ С БОТОМ',
  '👥 1 НА 1',
  '⚙ НАСТРОЙКИ',
  '🚪 ВЫХОД',
];

export function drawMainMenu(ctx: CanvasRenderingContext2D, w: number, h: number, selectedIndex: number, time: number): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;

  // Title
  drawPixelText(ctx, 'МОРСКОЙ БОЙ', cx, 60, 28, COLORS.gold, 'center');
  drawUIText(ctx, '✦ Пиратская стратегия ✦', cx, 95, 22, COLORS.water, 'center');

  // Decorative skull-like shape using text
  drawPixelText(ctx, '☠', cx, 130, 36, COLORS.sunk, 'center');

  // Menu items
  const startY = 180;
  const gap = 55;
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const y = startY + i * gap;
    const isSelected = i === selectedIndex;
    const color = isSelected ? COLORS.gold : COLORS.text;
    const size = isSelected ? 18 : 16;

    if (isSelected) {
      // Highlight background
      ctx.fillStyle = 'rgba(255,215,0,0.08)';
      ctx.fillRect(cx - 220, y - 20, 440, 40);
      drawPirateFrame(ctx, cx - 220, y - 20, 440, 40);
      // Arrow
      drawPixelText(ctx, '►', cx - 200, y + 5, 14, COLORS.gold, 'left');
    }

    drawPixelText(ctx, MENU_ITEMS[i], cx, y + 5, size, color, 'center');
  }

  // Footer hint
  drawUIText(ctx, '↑↓ выбор  |  Enter — подтвердить', cx, h - 30, 16, COLORS.gridLine, 'center');

  applyCRTEffects(ctx, w, h, time);
}

// ── BOT SETUP ────────────────────────────────────────────────

export function drawBotSetup(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  difficulty: string, placement: string, selectedRow: number, time: number,
): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;

  drawPixelText(ctx, 'НАСТРОЙКИ БОЯ', cx, 50, 22, COLORS.gold, 'center');

  const labels = [
    'СЛОЖНОСТЬ:',
    'РАССТАНОВКА:',
  ];
  const values = [
    `◄ ${difficulty === 'easy' ? 'ЛЁГКИЙ' : 'СЛОЖНЫЙ'} ►`,
    `◄ ${placement === 'auto' ? 'АВТО' : 'ВРУЧНУЮ'} ►`,
  ];

  const startY = 110;
  const gap = 60;
  for (let i = 0; i < 2; i++) {
    const y = startY + i * gap;
    const isSel = selectedRow === i;
    const labelColor = isSel ? COLORS.gold : COLORS.text;
    const valColor = isSel ? COLORS.playerShip : COLORS.water;

    drawPixelText(ctx, labels[i], cx - 180, y, 14, labelColor, 'left');
    drawPixelText(ctx, values[i], cx + 20, y, 14, valColor, 'left');

    if (isSel) {
      ctx.fillStyle = 'rgba(255,215,0,0.06)';
      ctx.fillRect(cx - 200, y - 16, 400, 32);
    }
  }

  // Start button
  const btnY = startY + 2 * gap + 20;
  const isBtnSel = selectedRow === 2;
  if (isBtnSel) {
    ctx.fillStyle = 'rgba(0,255,65,0.12)';
    ctx.fillRect(cx - 140, btnY - 18, 280, 36);
    drawPirateFrame(ctx, cx - 140, btnY - 18, 280, 36);
    drawPixelText(ctx, '▶ НАЧАТЬ БОЙ', cx, btnY + 6, 16, COLORS.playerShip, 'center');
  } else {
    drawPixelText(ctx, '▶ НАЧАТЬ БОЙ', cx, btnY + 6, 14, COLORS.text, 'center');
  }

  // Footer hints
  drawUIText(ctx, '↑↓ выбор  |  ←→ изменить  |  Enter — старт', cx, h - 30, 16, COLORS.gridLine, 'center');

  applyCRTEffects(ctx, w, h, time);
}

// ── SHIP PLACEMENT (P1_SETUP / P2_SETUP) ─────────────────────

export function drawSetup(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  grid: Grid, cursor: Cursor, shipsPlaced: number, total: number,
  orientation: string, isValid: boolean, time: number,
  playerLabel: string,
): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const gridOffsetX = cx - 220;
  const gridOffsetY = 80;
  const cellSize = 34;

  // Title
  drawPixelText(ctx, `${playerLabel} — РАССТАНОВКА`, cx, 35, 16, COLORS.gold, 'center');
  drawUIText(ctx, `${shipsPlaced} / ${total} кораблей установлено`, cx, 58, 18, COLORS.text, 'center');

  // Draw grid
  drawGrid(ctx, gridOffsetX, gridOffsetY, cellSize, grid, cursor, false, true, isValid, time);

  // Instructions
  const instrY = gridOffsetY + GRID_SIZE * cellSize + 35;
  drawUIText(ctx, '←↑↓→ передвижение  |  Space — поворот  |  Enter — установить  |  R — авто', cx, instrY, 16, COLORS.gridLine, 'center');

  // Orientation indicator
  drawUIText(ctx, `Ориентация: ${orientation === 'horizontal' ? 'ГОРИЗОНТАЛЬНО' : 'ВЕРТИКАЛЬНО'}`, cx, instrY + 22, 16, COLORS.water, 'center');

  // Ghost preview hint
  if (!isValid) {
    drawPixelText(ctx, 'НЕВОЗМОЖНАЯ ПОЗИЦИЯ!', cx, instrY + 48, 12, COLORS.hit, 'center');
  }

  applyCRTEffects(ctx, w, h, time);
}

// ── BATTLE ───────────────────────────────────────────────────

export function drawBattle(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  playerGrid: Grid, enemyGrid: Grid,
  playerFleet: FleetStatus, enemyFleet: FleetStatus,
  messages: Message[], isPlayerTurn: boolean,
  cursor: Cursor, cursorVisible: boolean, time: number,
): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cellSize = 28;
  const leftGridX = 30;
  const rightGridX = w - 30 - GRID_SIZE * cellSize - 30;
  const gridY = 80;

  // Turn indicator
  const turnText = isPlayerTurn ? '⚔ ВАШ ХОД' : '☠ ХОД БОТА';
  const turnColor = isPlayerTurn ? COLORS.playerShip : COLORS.hit;
  drawPixelText(ctx, turnText, w / 2, 35, 18, turnColor, 'center');

  // Player label + fleet
  drawPixelText(ctx, 'ВАШ ФЛОТ', leftGridX + (GRID_SIZE * cellSize) / 2, gridY - 15, 12, COLORS.playerShip, 'center');
  drawFleetPanel(ctx, leftGridX - 10, gridY, playerFleet, cellSize);

  // Player grid (ships visible)
  drawGrid(ctx, leftGridX, gridY, cellSize, playerGrid, null, false, false, true, time);

  // Enemy label + fleet
  drawPixelText(ctx, 'ПРОТИВНИК', rightGridX + (GRID_SIZE * cellSize) / 2, gridY - 15, 12, COLORS.hit, 'center');
  drawFleetPanel(ctx, rightGridX + GRID_SIZE * cellSize + 20, gridY, enemyFleet, cellSize);

  // Enemy grid (fog of war) with cursor
  drawGrid(ctx, rightGridX, gridY, cellSize, enemyGrid, isPlayerTurn && cursorVisible ? cursor : null, true, false, true, time);

  // Message log
  const logY = gridY + GRID_SIZE * cellSize + 30;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(30, logY, w - 60, 90);
  drawPirateFrame(ctx, 30, logY, w - 60, 90);

  const recentMessages = messages.slice(-4);
  for (let i = 0; i < recentMessages.length; i++) {
    const msg = recentMessages[i];
    let color: string = COLORS.text;
    if (msg.type === 'hit') color = COLORS.hit;
    if (msg.type === 'miss') color = COLORS.miss;
    if (msg.type === 'sunk') color = COLORS.sunk;
    if (msg.type === 'victory') color = COLORS.playerShip;
    if (msg.type === 'defeat') color = COLORS.hit;
    drawUIText(ctx, msg.text, 45, logY + 18 + i * 20, 16, color, 'left');
  }

  // Controls hint
  drawUIText(ctx, '←↑↓→ курсор  |  Enter — огонь', w / 2, h - 15, 14, COLORS.gridLine, 'center');

  applyCRTEffects(ctx, w, h, time);
}

// ── BATTLE 1V1 ───────────────────────────────────────────────

export function drawBattle1v1(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  p1Grid: Grid, p2Grid: Grid,
  p1Fleet: FleetStatus, p2Fleet: FleetStatus,
  messages: Message[], currentPlayer: number,
  cursor: Cursor, cursorVisible: boolean, time: number,
): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cellSize = 28;
  const leftGridX = 30;
  const rightGridX = w - 30 - GRID_SIZE * cellSize - 30;
  const gridY = 80;
  const isP1Turn = currentPlayer === 1;

  // Turn indicator
  const turnText = isP1Turn ? '⚔ ХОД ИГРОКА 1' : '⚔ ХОД ИГРОКА 2';
  const turnColor = isP1Turn ? COLORS.playerShip : COLORS.water;
  drawPixelText(ctx, turnText, w / 2, 35, 18, turnColor, 'center');

  // P1 label + fleet
  drawPixelText(ctx, 'ИГРОК 1', leftGridX + (GRID_SIZE * cellSize) / 2, gridY - 15, 12, COLORS.playerShip, 'center');
  drawFleetPanel(ctx, leftGridX - 10, gridY, p1Fleet, cellSize);
  drawGrid(ctx, leftGridX, gridY, cellSize, p1Grid, null, false, false, true, time);

  // P2 label + fleet
  drawPixelText(ctx, 'ИГРОК 2', rightGridX + (GRID_SIZE * cellSize) / 2, gridY - 15, 12, COLORS.water, 'center');
  drawFleetPanel(ctx, rightGridX + GRID_SIZE * cellSize + 20, gridY, p2Fleet, cellSize);

  // Show enemy grid (opponent's view) — in 1v1 each player sees their own ships
  // But when it's your turn, you shoot at the enemy grid
  const activeCursor = cursorVisible ? cursor : null;
  drawGrid(ctx, rightGridX, gridY, cellSize, p2Grid, isP1Turn ? activeCursor : null, !isP1Turn, false, true, time);

  // Message log
  const logY = gridY + GRID_SIZE * cellSize + 30;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(30, logY, w - 60, 90);
  drawPirateFrame(ctx, 30, logY, w - 60, 90);

  const recentMessages = messages.slice(-4);
  for (let i = 0; i < recentMessages.length; i++) {
    const msg = recentMessages[i];
    let color: string = COLORS.text;
    if (msg.type === 'hit') color = COLORS.hit;
    if (msg.type === 'miss') color = COLORS.miss;
    if (msg.type === 'sunk') color = COLORS.sunk;
    if (msg.type === 'victory') color = COLORS.playerShip;
    if (msg.type === 'defeat') color = COLORS.hit;
    drawUIText(ctx, msg.text, 45, logY + 18 + i * 20, 16, color, 'left');
  }

  drawUIText(ctx, '←↑↓→ курсор  |  Enter — огонь', w / 2, h - 15, 14, COLORS.gridLine, 'center');

  applyCRTEffects(ctx, w, h, time);
}

// ── TRANSITION ───────────────────────────────────────────────

export function drawTransition(ctx: CanvasRenderingContext2D, w: number, h: number, playerName: string, timer: number): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  drawPixelText(ctx, '§ ПЕРЕХОД ХОДА §', cx, cy - 50, 20, COLORS.gold, 'center');
  drawPixelText(ctx, `К ${playerName}...`, cx, cy + 10, 18, COLORS.water, 'center');

  // Countdown
  const seconds = Math.ceil(timer);
  drawPixelText(ctx, `${seconds}`, cx, cy + 60, 36, COLORS.playerShip, 'center');

  // Shield icon
  drawPixelText(ctx, '◉', cx, cy - 90, 40, COLORS.gold, 'center');

  applyCRTEffects(ctx, w, h, 0);
}

// ── SETTINGS ─────────────────────────────────────────────────

export function drawSettings(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;

  drawPixelText(ctx, '⚙ НАСТРОЙКИ', cx, 40, 22, COLORS.gold, 'center');

  const lines = [
    '',
    'ИГРА: Морской Бой — Пиратская стратегия',
    '',
    'УПРАВЛЕНИЕ:',
    '←↑↓→  —  Передвижение курсора',
    'Enter  —  Подтверждение / Огонь',
    'Space  —  Поворот корабля',
    'R  —  Авторасстановка',
    'Escape  —  Назад',
    '',
    'ПРАВИЛА:',
    '• Поле 10×10, координаты А-К',
    '• Флот: 1×4, 2×3, 3×2, 4×1',
    '• Промах: попадание — ещё ход',
    '• Потопление — автомаркировка окрестностей',
    '',
    'Нажмите Enter или Escape для возврата',
  ];

  let y = 80;
  for (const line of lines) {
    if (line.startsWith('•') || line.startsWith('ИГРА') || line.startsWith('УПРА') || line.startsWith('ПРАВ')) {
      drawPixelText(ctx, line, cx, y, 11, COLORS.gold, 'center');
    } else if (line) {
      drawUIText(ctx, line, cx, y, 17, COLORS.text, 'center');
    }
    y += 22;
  }

  applyCRTEffects(ctx, w, h, time);
}

// ── GAME OVER ────────────────────────────────────────────────

export function drawGameOver(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  isVictory: boolean, time: number, blinkVisible: boolean,
  winnerName?: string,
): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  if (isVictory) {
    drawPixelText(ctx, '★ ПОБЕДА! ★', cx, cy - 60, 28, COLORS.gold, 'center');
    drawPixelText(ctx, winnerName || 'ВЫ ПОБЕДИЛИ!', cx, cy - 10, 16, COLORS.playerShip, 'center');
  } else {
    drawPixelText(ctx, '☠ ПОРАЖЕНИЕ ☠', cx, cy - 60, 28, COLORS.hit, 'center');
    drawPixelText(ctx, winnerName || 'Ваш флот разбит!', cx, cy - 10, 16, COLORS.sunk, 'center');
  }

  if (blinkVisible) {
    drawPixelText(ctx, 'Нажмите Enter для продолжения', cx, cy + 50, 12, COLORS.gold, 'center');
  }

  // Decorative
  drawPixelText(ctx, isVictory ? '★' : '☠', cx, cy - 110, 48, isVictory ? COLORS.gold : COLORS.hit, 'center');

  applyCRTEffects(ctx, w, h, time);
}

// ── Grid drawing (shared) ────────────────────────────────────

function drawGrid(
  ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number,
  cellSize: number, grid: Grid, cursor: Cursor | null,
  isEnemyView: boolean, showGhost: boolean, ghostValid: boolean,
  time: number,
): void {
  // Column labels
  ctx.font = `${Math.floor(cellSize * 0.55)}px 'VT323', monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gridLine;
  for (let x = 0; x < GRID_SIZE; x++) {
    ctx.fillText(COL_LABELS[x], offsetX + x * cellSize + cellSize / 2, offsetY - 6);
  }

  // Row labels
  ctx.textAlign = 'right';
  for (let y = 0; y < GRID_SIZE; y++) {
    ctx.fillText(`${y + 1}`, offsetX - 6, offsetY + y * cellSize + cellSize / 2 + 5);
  }

  // Cells
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cellX = offsetX + x * cellSize;
      const cellY = offsetY + y * cellSize;
      const cell = grid.cells[y][x];

      // Base
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);

      // Cell content
      switch (cell) {
        case 'ship':
          if (!isEnemyView) {
            ctx.fillStyle = COLORS.playerShip;
            ctx.fillRect(cellX + 3, cellY + 3, cellSize - 6, cellSize - 6);
          } else {
            ctx.fillStyle = 'rgba(0,255,255,0.03)';
            ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
          }
          break;
        case 'hit':
          ctx.fillStyle = COLORS.hit;
          ctx.font = `${Math.floor(cellSize * 0.7)}px 'VT323', monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('✖', cellX + cellSize / 2, cellY + cellSize / 2 + 5);
          break;
        case 'miss':
          ctx.fillStyle = COLORS.miss;
          ctx.beginPath();
          ctx.arc(cellX + cellSize / 2, cellY + cellSize / 2, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'sunk':
          ctx.fillStyle = 'rgba(255,102,0,0.3)';
          ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
          ctx.fillStyle = COLORS.sunk;
          ctx.font = `${Math.floor(cellSize * 0.6)}px 'VT323', monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('#', cellX + cellSize / 2, cellY + cellSize / 2 + 5);
          break;
        default:
          ctx.fillStyle = 'rgba(0,255,255,0.03)';
          ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
          break;
      }

      // Grid line
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(cellX, cellY, cellSize, cellSize);
    }
  }

  // Cursor
  if (cursor) {
    const cx = offsetX + cursor.x * cellSize;
    const cy = offsetY + cursor.y * cellSize;
    const pulse = Math.sin(time * 6) * 0.3 + 0.7;

    ctx.strokeStyle = `rgba(255,255,0,${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

    ctx.fillStyle = `rgba(255,255,0,${pulse * 0.3})`;
    ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

    // [+] symbol
    ctx.fillStyle = COLORS.cursor;
    ctx.font = `${Math.floor(cellSize * 0.6)}px 'VT323', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('[+]', cx + cellSize / 2, cy + cellSize / 2 + 5);
  }
}

// ── Fleet panel ──────────────────────────────────────────────

function drawFleetPanel(ctx: CanvasRenderingContext2D, x: number, y: number, fleet: FleetStatus, cellSize: number): void {
  const panelW = 20;
  const shipSize = 8;
  let drawY = y;

  ctx.font = `10px 'VT323', monospace`;
  ctx.textAlign = 'left';

  for (const ship of fleet.ships) {
    const color = ship.sunk ? COLORS.sunk : COLORS.playerShip;
    ctx.fillStyle = color;
    for (let i = 0; i < ship.size; i++) {
      ctx.fillRect(x + (shipSize + 2) * i, drawY, shipSize, shipSize);
    }
    if (ship.sunk) {
      ctx.strokeStyle = COLORS.hit;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 2, drawY - 2);
      ctx.lineTo(x + ship.size * (shipSize + 2), drawY + shipSize + 2);
      ctx.stroke();
    }
    drawY += shipSize + 6;
  }
}

// ── EXIT screen ──────────────────────────────────────────────

export function drawExit(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  drawPixelText(ctx, '🚪 ВЫХОД', cx, cy - 40, 24, COLORS.gold, 'center');
  drawPixelText(ctx, 'Нажмите F5 для перезапуска', cx, cy + 20, 14, COLORS.text, 'center');

  applyCRTEffects(ctx, w, h, time);
}
