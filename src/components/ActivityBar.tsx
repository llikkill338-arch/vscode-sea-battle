import { Files, Search, GitBranch, Play, Blocks, User, Settings } from 'lucide-react';
import { useVSCode, type SidebarPanel } from '@/context/VSCodeContext';

const topIcons: { id: SidebarPanel; icon: React.ElementType; label: string }[] = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'debug', icon: Play, label: 'Run and Debug' },
  { id: 'extensions', icon: Blocks, label: 'Extensions' },
];

const bottomIcons: { id: string; icon: React.ElementType; label: string }[] = [
  { id: 'account', icon: User, label: 'Account' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function ActivityBar() {
  const { activeSidebarPanel, setActiveSidebarPanel, isSidebarOpen, setIsSidebarOpen } = useVSCode();

  const handleClick = (id: SidebarPanel) => {
    if (activeSidebarPanel === id && isSidebarOpen) { setIsSidebarOpen(false); }
    else { setActiveSidebarPanel(id); setIsSidebarOpen(true); }
  };

  return (
    <div className="flex flex-col justify-between items-center" style={{ width: 48, background: '#333333' }}>
      <div className="flex flex-col">
        {topIcons.map(({ id, icon: Icon, label }) => {
          const isActive = activeSidebarPanel === id && isSidebarOpen;
          return (
            <button key={id} onClick={() => handleClick(id)} title={label} className="flex items-center justify-center relative" style={{ width: 48, height: 48, cursor: 'pointer' }}>
              {isActive && <div className="absolute left-0 top-2 bottom-2" style={{ width: 2, background: 'white' }} />}
              <Icon size={24} style={{ color: isActive ? '#ffffff' : '#858585', opacity: isActive ? 1 : 0.6 }} />
            </button>
          );
        })}
      </div>
      <div className="flex flex-col">
        {bottomIcons.map(({ id, icon: Icon, label }) => (
          <button key={id} title={label} className="flex items-center justify-center" style={{ width: 48, height: 48, cursor: 'pointer' }}>
            <Icon size={24} style={{ color: '#858585', opacity: 0.6 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
