import { useState, useCallback, useRef, useEffect } from 'react';
import { useVSCode } from '@/context/VSCodeContext';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import Editor from './Editor';
import Terminal from './Terminal';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';

export default function VSCodeShell() {
  const { isSidebarOpen, isTerminalOpen, sidebarWidth, setSidebarWidth, terminalHeight, setTerminalHeight, isCommandPaletteOpen } = useVSCode();

  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSidebarResizeStart = useCallback(() => setIsResizingSidebar(true), []);
  const handleTerminalResizeStart = useCallback(() => setIsResizingTerminal(true), []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(150, Math.min(400, e.clientX - 48));
        setSidebarWidth(newWidth);
      }
      if (isResizingTerminal) {
        const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
        const newHeight = Math.max(100, Math.min(400, containerHeight - e.clientY));
        setTerminalHeight(newHeight);
      }
    };
    const handleMouseUp = () => { setIsResizingSidebar(false); setIsResizingTerminal(false); };
    if (isResizingSidebar || isResizingTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [isResizingSidebar, isResizingTerminal, setSidebarWidth, setTerminalHeight]);

  return (
    <div ref={containerRef} className="flex flex-col h-screen w-screen overflow-hidden select-none" style={{ background: '#1e1e1e', fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13 }}>
      {/* Title Bar */}
      <div className="flex items-center justify-center" style={{ height: 30, background: '#3c3c3c', color: '#cccccc', fontSize: 12, WebkitAppRegion: 'drag' }}>
        <span>battleship-cpp — Visual Studio Code</span>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="flex relative" style={{ width: sidebarWidth, background: '#252526', borderRight: '1px solid #3e3e42' }}>
            <Sidebar />
            {/* Sidebar resize handle */}
            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500" style={{ zIndex: 10 }} onMouseDown={handleSidebarResizeStart} />
          </div>
        )}

        {/* Editor + Terminal */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ background: '#1e1e1e' }}>
          {/* Tab Bar */}
          <TabBar />

          {/* Editor */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <Editor />
          </div>

          {/* Terminal Panel */}
          {isTerminalOpen && (
            <div className="relative flex flex-col" style={{ height: terminalHeight, background: '#1e1e1e', borderTop: '1px solid #3e3e42' }}>
              <Terminal />
              {/* Terminal resize handle */}
              <div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500" style={{ zIndex: 10 }} onMouseDown={handleTerminalResizeStart} />
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Command Palette Overlay */}
      {isCommandPaletteOpen && <CommandPalette />}
    </div>
  );
}
