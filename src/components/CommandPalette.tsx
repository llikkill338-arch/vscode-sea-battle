import { useState, useEffect, useRef } from 'react';
import { useVSCode } from '@/context/VSCodeContext';
import { FileCode, GitBranch, Terminal, Layout, Gamepad2, HelpCircle, FolderPlus, Save } from 'lucide-react';

const commands = [
  { id: 'git-history', label: 'Git: View History', icon: GitBranch, shortcut: '', action: 'git' },
  { id: 'new-terminal', label: 'Terminal: Create New Terminal', icon: Terminal, shortcut: 'Ctrl+`', action: 'terminal' },
  { id: 'new-file', label: 'File: New File', icon: FolderPlus, shortcut: 'Ctrl+N', action: 'newFile' },
  { id: 'save', label: 'File: Save', icon: Save, shortcut: 'Ctrl+S', action: 'save' },
  { id: 'toggle-sidebar', label: 'View: Toggle Sidebar', icon: Layout, shortcut: 'Ctrl+B', action: 'toggleSidebar' },
  { id: 'toggle-terminal', label: 'View: Toggle Terminal', icon: Terminal, shortcut: 'Ctrl+J', action: 'toggleTerminal' },
  { id: 'start-game', label: 'Game: Start Sea Battle', icon: Gamepad2, shortcut: '', action: 'startGame' },
  { id: 'about', label: 'Help: About', icon: HelpCircle, shortcut: '', action: 'about' },
];

export default function CommandPalette() {
  const { setIsCommandPaletteOpen, setIsTerminalOpen, setIsSidebarOpen, newUntitledFile, setActiveSidebarPanel } = useVSCode();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(i => Math.min(filtered.length - 1, i + 1)); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(i => Math.max(0, i - 1)); break;
      case 'Enter': e.preventDefault(); executeCommand(filtered[selectedIndex]?.action); break;
      case 'Escape': e.preventDefault(); setIsCommandPaletteOpen(false); break;
    }
  };

  const executeCommand = (action: string) => {
    switch (action) {
      case 'terminal': case 'toggleTerminal': setIsTerminalOpen(true); break;
      case 'toggleSidebar': setIsSidebarOpen(p => !p); break;
      case 'newFile': newUntitledFile(); break;
      case 'git': setActiveSidebarPanel('git'); setIsSidebarOpen(true); break;
    }
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} onClick={() => setIsCommandPaletteOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden" style={{ background: '#252526', border: '1px solid #3e3e42', borderRadius: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-3" style={{ borderBottom: '1px solid #3e3e42' }}>
          <span style={{ color: '#d4d4d4', fontSize: 16 }}>{'>'}</span>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }} onKeyDown={handleKeyDown} className="flex-1 bg-transparent outline-none px-2" style={{ height: 40, color: '#d4d4d4', fontSize: 14 }} placeholder="Type a command..." />
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {filtered.map((cmd, i) => { const Icon = cmd.icon; return (
            <div key={cmd.id} onClick={() => executeCommand(cmd.action)} className="flex items-center gap-2 px-3 cursor-pointer" style={{ height: 32, background: i === selectedIndex ? '#04395e' : 'transparent', color: i === selectedIndex ? '#ffffff' : '#cccccc', fontSize: 13 }} onMouseEnter={() => setSelectedIndex(i)}>
              <Icon size={14} style={{ color: '#858585' }} />
              <span className="flex-1">{cmd.label}</span>
              {cmd.shortcut && <span style={{ color: '#858585', fontSize: 11 }}>{cmd.shortcut}</span>}
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
