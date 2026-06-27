import { useVSCode, type TabFile } from '@/context/VSCodeContext';
import { X, Plus, FileCode, FileText, Wrench } from 'lucide-react';

const fileIcons: Record<string, React.ReactNode> = {
  'main.cpp': <FileCode size={14} />, 'Board.cpp': <FileCode size={14} />, 'Board.h': <FileCode size={14} />,
  'Ship.cpp': <FileCode size={14} />, 'Ship.h': <FileCode size={14} />, 'Player.cpp': <FileCode size={14} />,
  'Player.h': <FileCode size={14} />, 'Game.cpp': <FileCode size={14} />, 'Game.h': <FileCode size={14} />,
  'utils.cpp': <FileCode size={14} />, 'utils.h': <FileCode size={14} />,
  'README.md': <FileText size={14} />, 'Makefile': <Wrench size={14} />,
};

export default function TabBar() {
  const { openTabs, setOpenTabs, activeTab, setActiveTab, newUntitledFile } = useVSCode();

  const closeTab = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.name !== name);
    setOpenTabs(newTabs);
    if (activeTab === name && newTabs.length > 0) setActiveTab(newTabs[0].name);
  };

  return (
    <div className="flex items-center overflow-x-auto" style={{ height: 35, background: '#2d2d30', borderBottom: '1px solid #3e3e42' }}>
      {openTabs.map((tab: TabFile) => {
        const isActive = activeTab === tab.name;
        return (
          <div key={tab.name} onClick={() => setActiveTab(tab.name)} onMouseDown={(e) => e.button === 1 && closeTab(tab.name, e as unknown as React.MouseEvent)} className="flex items-center gap-1 px-2 cursor-pointer flex-shrink-0" style={{ height: 35, fontSize: 12, minWidth: 80, maxWidth: 200, background: isActive ? '#1e1e1e' : '#2d2d30', color: isActive ? '#cccccc' : '#969696', borderRight: '1px solid #3e3e42' }}>
            <span style={{ color: isActive ? '#519aba' : '#858585' }}>{fileIcons[tab.name] || <FileCode size={14} />}</span>
            <span className="truncate flex-1">{tab.name}</span>
            {tab.isDirty && <span style={{ color: '#cccccc' }}>●</span>}
            <button onClick={(e) => closeTab(tab.name, e)} className="hover:bg-white/20 rounded-sm ml-1" style={{ color: '#858585', fontSize: 10, cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        );
      })}
      <button onClick={newUntitledFile} className="flex items-center justify-center hover:bg-white/10 ml-1" style={{ width: 28, height: 28, cursor: 'pointer', color: '#858585', borderRadius: 4 }}>
        <Plus size={14} />
      </button>
    </div>
  );
}
