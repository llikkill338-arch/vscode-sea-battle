import { useVSCode } from '@/context/VSCodeContext';
import FileExplorer from './FileExplorer';
import GitPanel from './GitPanel';
import SearchPanel from './SearchPanel';

export default function Sidebar() {
  const { activeSidebarPanel } = useVSCode();

  return (
    <div className="w-full h-full overflow-auto" style={{ background: '#252526' }}>
      {activeSidebarPanel === 'explorer' && <FileExplorer />}
      {activeSidebarPanel === 'search' && <SearchPanel />}
      {activeSidebarPanel === 'git' && <GitPanel />}
      {activeSidebarPanel === 'debug' && (
        <div className="p-4" style={{ color: '#cccccc' }}>
          <div className="text-xs uppercase mb-2" style={{ color: '#bbbbbb', fontWeight: 600 }}>Run and Debug</div>
          <div className="text-sm" style={{ color: '#858585' }}>Open a file which can be debugged or run...</div>
        </div>
      )}
      {activeSidebarPanel === 'extensions' && (
        <div className="p-4" style={{ color: '#cccccc' }}>
          <div className="text-xs uppercase mb-2" style={{ color: '#bbbbbb', fontWeight: 600 }}>Extensions</div>
          <div className="text-sm" style={{ color: '#858585' }}>Search extensions in Marketplace...</div>
        </div>
      )}
    </div>
  );
}
