import { useVSCode } from '@/context/VSCodeContext';
import { GitBranch, Check, History } from 'lucide-react';

const commitHistory = [
  { hash: 'a1b2c3d', message: 'init: project structure and CMake', time: '2 hours ago' },
  { hash: 'e4f5g6h', message: 'feat: Board class with grid and ship placement', time: '1 hour ago' },
  { hash: 'i7j8k9l', message: 'feat: Ship class with hit detection', time: '55 min ago' },
  { hash: 'm0n1o2p', message: 'feat: Player class and fleet management', time: '40 min ago' },
  { hash: 'q3r4s5t', message: 'feat: AI bot with smart targeting', time: '30 min ago' },
  { hash: 'u6v7w8x', message: 'feat: main game loop and menu', time: '20 min ago' },
  { hash: 'y9z0a1b', message: 'feat: retro terminal UI and animations', time: '15 min ago' },
  { hash: 'c2d3e4f', message: 'docs: README and build instructions', time: '10 min ago' },
  { hash: 'g5h6i7j', message: 'feat: pirate theme v2.0 with aura marking', time: '5 min ago' },
];

const statusColors: Record<string, string> = { M: '#e2c08d', A: '#587c0c', U: '#73c991', D: '#f44747' };

export default function GitPanel() {
  const { stagedChanges, unstagedChanges, toggleStaged, selectedCommit, setSelectedCommit } = useVSCode();

  return (
    <div className="h-full flex flex-col" style={{ color: '#cccccc', fontSize: 13 }}>
      <div className="flex items-center justify-between px-2 py-2" style={{ borderBottom: '1px solid #3e3e42' }}>
        <span className="uppercase" style={{ fontSize: 11, fontWeight: 600 }}>Source Control</span>
        <div className="flex items-center gap-1" style={{ fontSize: 12, color: '#cccccc' }}><GitBranch size={12} />main</div>
      </div>

      {/* Commit message */}
      <div className="px-2 py-2"><textarea placeholder="Message (Ctrl+Enter to commit)" className="w-full px-1 py-1 resize-none" style={{ background: '#3c3c3c', border: '1px solid #3e3e42', color: '#cccccc', fontSize: 12, borderRadius: 2, height: 50 }} /></div>
      <div className="px-2 pb-2"><button className="flex items-center justify-center gap-1 w-full py-1" style={{ background: '#0e639c', color: '#fff', borderRadius: 2, fontSize: 12, cursor: 'pointer' }}><Check size={12} /> Commit</button></div>

      {/* Changes */}
      <div className="flex-1 overflow-auto">
        {unstagedChanges.length > 0 && (
          <div>
            <div className="px-2 py-1 uppercase" style={{ fontSize: 10, color: '#858585', fontWeight: 600 }}>Changes ({unstagedChanges.length})</div>
            {unstagedChanges.map(c => (
              <div key={c.file} className="flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-white/5" onClick={() => toggleStaged(c.file)}>
                <input type="checkbox" checked={c.staged} onChange={() => toggleStaged(c.file)} className="mr-1" />
                <span style={{ color: statusColors[c.status], fontSize: 11, fontWeight: 'bold', minWidth: 16 }}>{c.status}</span>
                <span className="truncate flex-1">{c.file}</span>
                <span style={{ color: '#587c0c', fontSize: 10 }}>+{c.additions}</span>
                <span style={{ color: '#f44747', fontSize: 10 }}>-{c.deletions}</span>
              </div>
            ))}
          </div>
        )}

        {stagedChanges.length > 0 && (
          <div className="mt-2">
            <div className="px-2 py-1 uppercase" style={{ fontSize: 10, color: '#858585', fontWeight: 600 }}>Staged Changes ({stagedChanges.length})</div>
            {stagedChanges.map(c => (
              <div key={c.file} className="flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-white/5" onClick={() => toggleStaged(c.file)}>
                <input type="checkbox" checked={c.staged} onChange={() => toggleStaged(c.file)} className="mr-1" />
                <span style={{ color: statusColors[c.status], fontSize: 11, fontWeight: 'bold', minWidth: 16 }}>{c.status}</span>
                <span className="truncate flex-1">{c.file}</span>
              </div>
            ))}
          </div>
        )}

        {/* Commit History */}
        <div className="mt-3">
          <div className="px-2 py-1 flex items-center gap-1 uppercase" style={{ fontSize: 10, color: '#858585', fontWeight: 600 }}><History size={10} />Commits</div>
          {commitHistory.map(commit => (
            <div key={commit.hash} className="flex items-start gap-2 px-2 py-1 cursor-pointer hover:bg-white/5" style={{ background: selectedCommit === commit.hash ? '#37373d' : 'transparent' }} onClick={() => setSelectedCommit(commit.hash)}>
              <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: '#007acc', color: '#fff', fontSize: 10, fontWeight: 'bold' }}>V</div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 12 }}>{commit.message}</div>
                <div className="flex items-center gap-2" style={{ fontSize: 10, color: '#858585' }}><span>{commit.hash}</span><span>{commit.time}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
