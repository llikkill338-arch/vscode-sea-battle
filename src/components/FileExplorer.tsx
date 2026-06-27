import { useState } from 'react';
import { useVSCode } from '@/context/VSCodeContext';
import { ChevronRight, ChevronDown, Folder, FileText, Settings, FileCode } from 'lucide-react';

interface FileTreeItem { name: string; type: 'folder' | 'file'; children?: FileTreeItem[]; }

const fileTree: FileTreeItem[] = [
  { name: '.vscode', type: 'folder', children: [{ name: 'settings.json', type: 'file' }, { name: 'tasks.json', type: 'file' }] },
  { name: 'src', type: 'folder', children: [{ name: 'main.cpp', type: 'file' }, { name: 'Board.cpp', type: 'file' }, { name: 'Board.h', type: 'file' }, { name: 'Ship.cpp', type: 'file' }, { name: 'Ship.h', type: 'file' }, { name: 'Player.cpp', type: 'file' }, { name: 'Player.h', type: 'file' }, { name: 'Game.cpp', type: 'file' }, { name: 'Game.h', type: 'file' }, { name: 'utils.cpp', type: 'file' }, { name: 'utils.h', type: 'file' }] },
  { name: 'include', type: 'folder', children: [] },
  { name: 'assets', type: 'folder', children: [{ name: 'sprites', type: 'folder', children: [] }, { name: 'sounds', type: 'folder', children: [] }] },
  { name: 'README.md', type: 'file' },
  { name: 'Makefile', type: 'file' },
];

function getFileIcon(name: string) {
  if (name.endsWith('.cpp') || name.endsWith('.h')) return <FileCode size={14} style={{ color: '#519aba' }} />;
  if (name.endsWith('.md')) return <FileText size={14} style={{ color: '#519aba' }} />;
  if (name === 'Makefile') return <Settings size={14} style={{ color: '#858585' }} />;
  if (name.endsWith('.json')) return <FileText size={14} style={{ color: '#cbcb41' }} />;
  return <FileText size={14} style={{ color: '#858585' }} />;
}

function FileTreeItemComponent({ item, depth = 0 }: { item: FileTreeItem; depth?: number }) {
  const { activeTab, setActiveTab, openTabs, setOpenTabs, collapsedFolders, setCollapsedFolders } = useVSCode();
  const [localCollapsed, setLocalCollapsed] = useState(depth > 0);
  const isCollapsed = collapsedFolders.has(item.name) || localCollapsed;

  const toggleFolder = () => {
    if (item.type === 'folder') {
      const next = new Set(collapsedFolders);
      if (next.has(item.name)) next.delete(item.name); else next.add(item.name);
      setCollapsedFolders(next);
      setLocalCollapsed(!localCollapsed);
    }
  };

  const openFile = () => {
    if (item.type === 'file') {
      if (!openTabs.find(t => t.name === item.name)) setOpenTabs([...openTabs, { name: item.name, isDirty: false }]);
      setActiveTab(item.name);
    }
  };

  const isActive = activeTab === item.name;

  return (
    <div>
      <div className="flex items-center gap-1 cursor-pointer" style={{ paddingLeft: depth * 12 + 8, paddingTop: 2, paddingBottom: 2, background: isActive ? '#37373d' : 'transparent', borderLeft: isActive ? '1px solid #007acc' : '1px solid transparent' }} onClick={() => { toggleFolder(); openFile(); }}>
        {item.type === 'folder' && (isCollapsed ? <ChevronRight size={12} style={{ color: '#858585' }} /> : <ChevronDown size={12} style={{ color: '#858585' }} />)}
        {item.type === 'folder' ? <Folder size={14} style={{ color: '#dcb67a' }} /> : getFileIcon(item.name)}
        <span style={{ fontSize: 13, color: isActive ? '#cccccc' : '#cccccc' }}>{item.name}</span>
      </div>
      {item.type === 'folder' && !isCollapsed && item.children?.map((child, i) => <FileTreeItemComponent key={i} item={child} depth={depth + 1} />)}
    </div>
  );
}

export default function FileExplorer() {
  const { openTabs, setOpenTabs, setActiveTab, activeTab } = useVSCode();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full flex flex-col" style={{ color: '#cccccc' }}>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="uppercase" style={{ fontSize: 11, fontWeight: 600, color: '#bbbbbb' }}>Explorer</span>
      </div>
      <div className="px-2 py-1 font-semibold" style={{ fontSize: 12 }}>BATTLESHIP-CPP</div>

      {/* Open Editors */}
      <div className="px-2 mt-1">
        <div className="uppercase mb-1" style={{ fontSize: 10, color: '#858585', fontWeight: 600 }}>Open Editors</div>
        {openTabs.map(tab => (
          <div key={tab.name} className="flex items-center gap-1 cursor-pointer py-0.5" style={{ fontSize: 12, background: activeTab === tab.name ? '#2a2d2e' : 'transparent' }} onClick={() => setActiveTab(tab.name)}>
            {getFileIcon(tab.name)}<span>{tab.name}</span>{tab.isDirty && <span style={{ color: '#cccccc' }}>●</span>}
            <button className="ml-auto hover:bg-white/20" onClick={() => setOpenTabs(openTabs.filter(t => t.name !== tab.name))}>✕</button>
          </div>
        ))}
      </div>

      {/* Search filter */}
      <div className="px-2 mt-2"><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter files..." className="w-full px-1" style={{ background: '#3c3c3c', border: '1px solid #3e3e42', color: '#cccccc', fontSize: 12, borderRadius: 2 }} /></div>

      {/* File tree */}
      <div className="flex-1 overflow-auto mt-1">
        {fileTree.map((item, i) => <FileTreeItemComponent key={i} item={item} />)}
      </div>
    </div>
  );
}
