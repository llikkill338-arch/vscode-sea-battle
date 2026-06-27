// ============================================================
// Sea Battle (Morskaya Bitva) — Type Definitions  
// Pirate Edition v2.0
// ============================================================

export const CellState = { EMPTY: 0, SHIP: 1, HIT: 2, MISS: 3, SUNK: 4 } as const;
export type CellState = (typeof CellState)[keyof typeof CellState];

export const GamePhase = { TITLE: 'TITLE', DIFFICULTY_SELECT: 'DIFFICULTY_SELECT', SETUP: 'SETUP', BATTLE: 'BATTLE', GAME_OVER: 'GAME_OVER' } as const;
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export const Orientation = { HORIZONTAL: 'HORIZONTAL', VERTICAL: 'VERTICAL' } as const;
export type Orientation = (typeof Orientation)[keyof typeof Orientation];

export const AnimationType = { HIT_EXPLOSION: 'HIT_EXPLOSION', MISS_RIPPLE: 'MISS_RIPPLE', SINK_FLASH: 'SINK_FLASH', TEXT_BURST: 'TEXT_BURST' } as const;
export type AnimationType = (typeof AnimationType)[keyof typeof AnimationType];

export const AIDifficulty = { EASY: 'EASY', HARD: 'HARD' } as const;
export type AIDifficulty = (typeof AIDifficulty)[keyof typeof AIDifficulty];

export const AIState = { SEARCH: 'SEARCH', TARGET: 'TARGET', DESTROY: 'DESTROY' } as const;
export type AIState = (typeof AIState)[keyof typeof AIState];

export const HitResult = { MISS: 'MISS', HIT: 'HIT', SUNK: 'SUNK', ALREADY_HIT: 'ALREADY_HIT' } as const;
export type HitResult = (typeof HitResult)[keyof typeof HitResult];

export interface Position { x: number; y: number; }
export interface Ship { id: number; size: number; positions: Position[]; hits: Position[]; orientation: Orientation; isSunk: boolean; }
export interface ShipTemplate { size: number; count: number; }
export interface Cell { state: CellState; shipId: number | null; }
export interface Animation { type: AnimationType; x: number; y: number; frame: number; maxFrames: number; timer: number; text?: string; color?: string; }
export interface LogMessage { text: string; color: string; timestamp: number; }
export interface AIOpponent { difficulty: AIDifficulty; state: AIState; lastHit: Position | null; hitDirection: Position | null; targets: Position[]; }
export interface FleetShipStatus { size: number; name: string; isSunk: boolean; }
export interface FleetStatus { totalShips: number; sunkShips: number; remainingDecks: number; totalDecks: number; ships: FleetShipStatus[]; }
export interface GameConfig { gridSize: number; cellSize: number; cellGap: number; ships: ShipTemplate[]; }

export const DEFAULT_CONFIG: GameConfig = { gridSize: 10, cellSize: 28, cellGap: 2, ships: [{ size: 4, count: 1 }, { size: 3, count: 2 }, { size: 2, count: 3 }, { size: 1, count: 4 }] };

export const COLORS = { background: '#0a0a0f', water: '#00ffff', playerShip: '#00ff41', enemyShip: '#ff00ff', hit: '#ff0040', miss: '#555555', cursor: '#ffff00', sunk: '#ff6600', title: '#00ff41', text: '#e0e0e0', gold: '#ffd700', amber: '#ffaa00', scanline: 'rgba(0, 255, 65, 0.03)', gridLine: 'rgba(0, 255, 65, 0.25)', label: '#00ff41' };

export const COLUMN_LABELS = ['А','Б','В','Г','Д','Е','Ж','З','И','К'];
export const SHIP_NAMES: Record<number, string> = { 4: 'Линкор', 3: 'Крейсер', 2: 'Эсминец', 1: 'Торпедный катер' };

export const PIRATE_PHRASES = {
  playerHit: ['Прямо в цель! Ядро попало!', 'БАБАХ! Корпус пробит!', 'Отличный выстрел, капитан!', 'Враг горит! Еще один!', 'Попадание! Аррр!', 'Прямо по палубе! Ха!', 'Огонь! Огонь! Попадание!'],
  playerMiss: ['Мимо... Только волны.', 'Промах! Чертов шторм...', 'Ничего, следующий точнее!', 'Пусто! Одна вода...', 'Волна помешала выстрелу...', 'Неудача! Перезаряжаем!'],
  playerSunk: ['КОРАБЛЬ НА ДНО! Потоплен!', 'Уничтожен! В бездну, вражеский пес!', 'Этот корабль больше не всплывет!', 'Аррр! Великолепная работа!', 'На дно! Трофей наш!', 'Потоплен! Празднуем, матросы!'],
  aiHit: ['Нас подбили! Пробоина!', 'Вражеское ядро попало!', 'Корабль горит! Тушить!', 'Попадание по нам! Держитесь!'],
  aiMiss: ['Враг промахнулся! Удача с нами!', 'Мимо! Даже не близко!', 'Ха! Дрожащие руки у врага!', 'Промах! Госпожа Удача улыбается!'],
  aiSunk: ['Наш корабль потоплен! Капитан!', 'О нет... Корабль ушел ко дну...', 'Потеря! Но мы не сдадимся!', 'Враг уничтожил наш корабль!'],
  victory: ['ПОЛНАЯ ПОБЕДА! Вражеский флот уничтожен!', 'Мы владеем морем! Все враги на дне!', 'Триумф! Ни один вражеский корабль не уцелел!'],
  defeat: ['Поражение... Весь наш флот потоплен...', 'Мы проиграли этот бой... Но не войну!', 'Все корабли ушли ко дну... Возмездие придет!'],
  battleStart: ['БОЙ НАЧАЛСЯ! К орудиям!', 'Враг на горизонте! Огонь!', 'Первый выстрел! Да будет бой!'],
  setupStart: ['Расставь флот, капитан!', 'Размести корабли перед боем!'],
  autoPlace: ['Авто-расстановка выполнена! Готовься к бою!', 'Корабли на позициях! К бою!'],
} as const;

export function getRandomPhrase(category: keyof typeof PIRATE_PHRASES): string { const phrases = PIRATE_PHRASES[category]; return phrases[Math.floor(Math.random() * phrases.length)]; }
export function getTotalShips(config: GameConfig = DEFAULT_CONFIG): number { return config.ships.reduce((sum, s) => sum + s.count, 0); }
export function getTotalShipCells(config: GameConfig = DEFAULT_CONFIG): number { return config.ships.reduce((sum, s) => sum + s.size * s.count, 0); }
export function formatCoordinate(x: number, y: number): string { return `${COLUMN_LABELS[x]}${y + 1}`; }
