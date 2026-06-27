import { useRef, useEffect, useState } from 'react';
import { useVSCode } from '@/context/VSCodeContext';
import GameCanvas from './GameCanvas';

export default function Terminal() {
  const { isTerminalOpen, setIsTerminalOpen } = useVSCode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  if (!isTerminalOpen) return null;

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full relative" style={{ background: '#0a0a0f' }}>
      {/* Terminal Tab Bar */}
      <div className="flex items-center" style={{ height: 35, background: '#252526', borderBottom: '1px solid #3e3e42' }}>
        {['TERMINAL', 'OUTPUT', 'PROBLEMS', 'DEBUG CONSOLE'].map((tab, i) => (
          <div key={tab} className="flex items-center px-3" style={{ height: 35, fontSize: 11, color: i === 0 ? '#cccccc' : '#858585', borderBottom: i === 0 ? '1px solid #1e1e1e' : 'none', background: i === 0 ? '#0a0a0f' : 'transparent', cursor: 'pointer' }}>
            {tab}
          </div>
        ))}
        <button onClick={() => setIsTerminalOpen(false)} className="ml-auto mr-2" style={{ color: '#858585', fontSize: 14, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {dimensions.width > 0 && dimensions.height > 0 && (
          <GameCanvas width={dimensions.width} height={dimensions.height} />
        )}
      </div>
    </div>
  );
}
