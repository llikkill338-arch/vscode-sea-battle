import { useState } from 'react';
import { useVSCode } from '@/context/VSCodeContext';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';

export default function SearchPanel() {
  const { searchQuery, setSearchQuery, includePattern, setIncludePattern, excludePattern, setExcludePattern } = useVSCode();
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const mockResults = [
    { file: 'src/main.cpp', matches: [{ line: 12, text: 'int main() {' }, { line: 45, text: '  game.start();' }] },
    { file: 'src/Game.cpp', matches: [{ line: 8, text: 'class Game {' }, { line: 23, text: '  void start();' }] },
  ];

  const toggleFile = (file: string) => {
    const next = new Set(expandedFiles);
    if (next.has(file)) next.delete(file); else next.add(file);
    setExpandedFiles(next);
  };

  return (
    <div className="h-full flex flex-col" style={{ color: '#cccccc', fontSize: 13 }}>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="uppercase" style={{ fontSize: 11, fontWeight: 600, color: '#bbbbbb' }}>Search</span>
      </div>
      <div className="px-2 py-1"><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Find in files" className="w-full px-1 py-1" style={{ background: '#3c3c3c', border: '1px solid #3e3e42', color: '#cccccc', fontSize: 12, borderRadius: 2 }} /></div>
      <div className="px-2 py-1 flex gap-1">
        <input value={includePattern} onChange={e => setIncludePattern(e.target.value)} placeholder="Include (e.g. *.cpp)" className="flex-1 px-1 py-0.5" style={{ background: '#3c3c3c', border: '1px solid #3e3e42', color: '#cccccc', fontSize: 11, borderRadius: 2 }} />
        <input value={excludePattern} onChange={e => setExcludePattern(e.target.value)} placeholder="Exclude" className="flex-1 px-1 py-0.5" style={{ background: '#3c3c3c', border: '1px solid #3e3e42', color: '#cccccc', fontSize: 11, borderRadius: 2 }} />
      </div>
      <div className="flex-1 overflow-auto mt-1">
        {searchQuery && mockResults.map(result => (
          <div key={result.file}>
            <div className="flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-white/5" onClick={() => toggleFile(result.file)}>
              {expandedFiles.has(result.file) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span style={{ fontSize: 12 }}>{result.file}</span>
              <span style={{ fontSize: 10, color: '#858585' }}>({result.matches.length})</span>
            </div>
            {expandedFiles.has(result.file) && result.matches.map((match, i) => (
              <div key={i} className="flex items-start gap-2 px-6 py-0.5 cursor-pointer hover:bg-white/5">
                <span style={{ color: '#858585', fontSize: 11, minWidth: 24 }}>{match.line}</span>
                <span style={{ fontSize: 12 }} dangerouslySetInnerHTML={{ __html: match.text.replace(searchQuery, `<mark style="background:#613214">${searchQuery}</mark>`) }} />
              </div>
            ))}
          </div>
        ))}
        {!searchQuery && <div className="px-2 py-4 text-center" style={{ color: '#858585', fontSize: 12 }}>Type to search across files</div>}
      </div>
    </div>
  );
}
