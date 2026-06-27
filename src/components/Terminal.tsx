import { useRef, useEffect, useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { useVSCode } from '@/context/VSCodeContext';
import GameCanvas from './GameCanvas';

export default function Terminal() {
  const { isTerminalOpen, setIsTerminalOpen } = useVSCode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState('TERMINAL');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  if (!isTerminalOpen) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full relative"
      style={{ background: '#0a0a0f' }}
    >
      {/* Terminal Tab Bar */}
      <div
        className="flex items-center select-none"
        style={{
          height: 35,
          background: '#252526',
          borderBottom: '1px solid #3e3e42',
          flexShrink: 0,
        }}
      >
        {['TERMINAL', 'OUTPUT', 'PROBLEMS', 'DEBUG CONSOLE'].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center px-3 h-full cursor-pointer"
            style={{
              fontSize: 11,
              color: activeTab === tab ? '#cccccc' : '#858585',
              borderBottom:
                activeTab === tab
                  ? '1px solid #0a0a0f'
                  : '1px solid transparent',
              background: activeTab === tab ? '#0a0a0f' : 'transparent',
            }}
          >
            {tab}
          </div>
        ))}
        <div className="flex items-center ml-auto">
          <button
            className="flex items-center justify-center hover:bg-white/10"
            style={{ width: 28, height: 28, cursor: 'pointer', color: '#858585' }}
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
          <button
            className="flex items-center justify-center hover:bg-white/10"
            style={{ width: 28, height: 28, cursor: 'pointer', color: '#858585' }}
            title="Kill Terminal"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setIsTerminalOpen(false)}
            className="flex items-center justify-center hover:bg-white/10 mr-1"
            style={{ width: 28, height: 28, cursor: 'pointer', color: '#858585' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'TERMINAL' &&
          canvasSize.width > 0 &&
          canvasSize.height > 0 && (
            <GameCanvas
              width={canvasSize.width}
              height={canvasSize.height}
            />
          )}
        {activeTab !== 'TERMINAL' && (
          <div className="flex items-center justify-center h-full">
            <span
              style={{
                fontSize: 13,
                color: '#858585',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {activeTab} panel is empty
            </span>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 right-0 cursor-row-resize hover:bg-blue-500"
        style={{ height: 4, zIndex: 10 }}
      />
    </div>
  );
}
