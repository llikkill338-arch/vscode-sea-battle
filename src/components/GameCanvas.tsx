import { useRef, useEffect, useCallback } from 'react';
import { SeaBattleGame } from '@/game/SeaBattleGame';

interface GameCanvasProps {
  width: number;
  height: number;
}

export default function GameCanvas({ width, height }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SeaBattleGame | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new SeaBattleGame();
    gameRef.current = game;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      game.update(dt, now);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        game.render(ctx, width, height);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [width, height]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
    gameRef.current?.handleKeyDown(e.key);
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    gameRef.current?.handleKeyUp(e.key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        cursor: 'crosshair',
      }}
    />
  );
}
