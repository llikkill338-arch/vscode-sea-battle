import { GitBranch, AlertCircle, AlertTriangle, Radio, Bell, Smile } from 'lucide-react';
import { useVSCode } from '@/context/VSCodeContext';

export default function StatusBar() {
  const { cursorPosition } = useVSCode();

  return (
    <div className="flex items-center justify-between px-2" style={{ height: 22, background: '#007acc', color: '#ffffff', fontSize: 12 }}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded">
          <GitBranch size={12} />
          <span>main</span>
        </div>
        <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded">
          <AlertCircle size={12} />
          <span>0</span>
          <AlertTriangle size={12} />
          <span>0</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-3">
        <span className="cursor-pointer hover:bg-white/20 px-1 rounded">Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
        <span className="cursor-pointer hover:bg-white/20 px-1 rounded">UTF-8</span>
        <span className="cursor-pointer hover:bg-white/20 px-1 rounded">LF</span>
        <span className="cursor-pointer hover:bg-white/20 px-1 rounded">C++</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Radio size={12} className="cursor-pointer hover:bg-white/20" />
        <Bell size={12} className="cursor-pointer hover:bg-white/20" />
        <Smile size={12} className="cursor-pointer hover:bg-white/20" />
      </div>
    </div>
  );
}
