import { useRef, useEffect, useCallback, useState } from 'react';
import { SeaBattleGame } from '@/game/SeaBattleGame';

interface GameCanvasProps { width: number; height: number; }

export default function GameCanvas({ width, height }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SeaBattleGame | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (gameRef.current) return;
    const game = new SeaBattleGame();
    gameRef.current = game;
    game.onInvalidate = () => {};
    return () => { gameRef.current = null; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const game = gameRef.current;
    if (!game) return;
    lastTimeRef.current = performance.now();
    const gameLoop = (timestamp: number) => {
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      game.update(Math.min(dt, 100));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      game.render(ctx, width, height);
      animFrameRef.current = requestAnimationFrame(gameLoop);
    };
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => { cancelAnimationFrame(animFrameRef.current); };
  }, [width, height]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const game = gameRef.current;
    if (!game) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) e.preventDefault();
    game.handleKeyDown(e.key);
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const game = gameRef.current;
    if (!game) return;
    game.handleKeyUp(e.key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) { canvas.focus(); setIsFocused(document.activeElement === canvas); }
  }, []);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={(e) => { e.currentTarget.focus(); setIsFocused(true); }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', outline: 'none', cursor: 'crosshair', boxShadow: isFocused ? 'inset 0 0 15px rgba(0,255,65,0.15)' : 'inset 0 0 15px rgba(255,0,0,0.1)', transition: 'box-shadow 0.3s' }}
    />
  );
}
