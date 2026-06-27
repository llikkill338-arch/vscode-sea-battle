import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { fileContents } from '@/lib/fileContents';

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'debug' | 'extensions';

export interface TabFile { name: string; isDirty: boolean; }

export interface GitChangeItem { file: string; status: 'M' | 'A' | 'U' | 'D'; staged: boolean; additions: number; deletions: number; }

export interface SearchResult { file: string; matches: { line: number; text: string; }[]; }

export interface DiffLine { type: 'context' | 'add' | 'remove'; line: string; lineNumber?: number; }

interface VSCodeContextType {
  activeSidebarPanel: SidebarPanel; setActiveSidebarPanel: (p: SidebarPanel) => void;
  isSidebarOpen: boolean; setIsSidebarOpen: (v: boolean) => void;
  openTabs: TabFile[]; setOpenTabs: (tabs: TabFile[]) => void;
  activeTab: string; setActiveTab: (name: string) => void;
  sidebarWidth: number; setSidebarWidth: (w: number) => void;
  terminalHeight: number; setTerminalHeight: (h: number) => void;
  isTerminalOpen: boolean; setIsTerminalOpen: (v: boolean) => void;
  fileContents: Record<string, string>;
  collapsedFolders: Set<string>; setCollapsedFolders: (s: Set<string>) => void;
  cursorPosition: { line: number; col: number }; setCursorPosition: (p: { line: number; col: number }) => void;
  isCommandPaletteOpen: boolean; setIsCommandPaletteOpen: (v: boolean) => void;
  openCommandPalette: () => void;
  newUntitledFile: () => void;
  untitledCounter: number;
  searchQuery: string; setSearchQuery: (q: string) => void;
  searchResults: SearchResult[]; setSearchResults: (r: SearchResult[]) => void;
  isSearching: boolean; setIsSearching: (v: boolean) => void;
  includePattern: string; setIncludePattern: (p: string) => void;
  excludePattern: string; setExcludePattern: (p: string) => void;
  diffViewOpen: boolean; setDiffViewOpen: (v: boolean) => void;
  diffFile: string | null; setDiffFile: (f: string | null) => void;
  diffLines: DiffLine[]; setDiffLines: (lines: DiffLine[]) => void;
  stagedChanges: GitChangeItem[]; setStagedChanges: (c: GitChangeItem[]) => void;
  unstagedChanges: GitChangeItem[]; setUnstagedChanges: (c: GitChangeItem[]) => void;
  toggleStaged: (file: string) => void;
  selectedCommit: string | null; setSelectedCommit: (h: string | null) => void;
  contextMenu: { x: number; y: number; file: string } | null; setContextMenu: (m: { x: number; y: number; file: string } | null) => void;
  expandAllFolders: () => void; collapseAllFolders: () => void;
}

const VSCodeContext = createContext<VSCodeContextType | null>(null);

export function VSCodeProvider({ children }: { children: ReactNode }) {
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<SidebarPanel>('explorer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openTabs, setOpenTabs] = useState<TabFile[]>([{ name: 'main.cpp', isDirty: false }]);
  const [activeTab, setActiveTab] = useState('main.cpp');
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [untitledCounter, setUntitledCounter] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [includePattern, setIncludePattern] = useState('');
  const [excludePattern, setExcludePattern] = useState('');
  const [diffViewOpen, setDiffViewOpen] = useState(false);
  const [diffFile, setDiffFile] = useState<string | null>(null);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [stagedChanges, setStagedChanges] = useState<GitChangeItem[]>([]);
  const [unstagedChanges, setUnstagedChanges] = useState<GitChangeItem[]>([
    { file: 'src/main.cpp', status: 'M', staged: false, additions: 12, deletions: 5 },
    { file: 'src/Board.cpp', status: 'M', staged: false, additions: 8, deletions: 2 },
    { file: 'src/Game.cpp', status: 'A', staged: false, additions: 45, deletions: 0 },
  ]);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: string } | null>(null);

  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);

  const newUntitledFile = useCallback(() => {
    const name = `Untitled-${untitledCounter}`;
    setUntitledCounter(p => p + 1);
    setOpenTabs(prev => { if (prev.find(t => t.name === name)) return prev; return [...prev, { name, isDirty: true }]; });
    setActiveTab(name);
  }, [untitledCounter]);

  const expandAllFolders = useCallback(() => setCollapsedFolders(new Set()), []);
  const collapseAllFolders = useCallback(() => setCollapsedFolders(new Set(['.vscode', 'src', 'include', 'assets'])), []);

  const toggleStaged = useCallback((file: string) => {
    setUnstagedChanges(prevU => { const item = prevU.find(c => c.file === file); if (item) { const newU = prevU.filter(c => c.file !== file); setStagedChanges(prevS => [...prevS, { ...item, staged: true }]); return newU; } return prevU; });
    setStagedChanges(prevS => { const item = prevS.find(c => c.file === file); if (item) { const newS = prevS.filter(c => c.file !== file); setUnstagedChanges(prevU => [...prevU, { ...item, staged: false }]); return newS; } return prevS; });
  }, []);

  return (
    <VSCodeContext.Provider value={{
      activeSidebarPanel, setActiveSidebarPanel, isSidebarOpen, setIsSidebarOpen,
      openTabs, setOpenTabs, activeTab, setActiveTab, sidebarWidth, setSidebarWidth,
      terminalHeight, setTerminalHeight, isTerminalOpen, setIsTerminalOpen,
      fileContents, collapsedFolders, setCollapsedFolders, cursorPosition, setCursorPosition,
      isCommandPaletteOpen, setIsCommandPaletteOpen, openCommandPalette,
      newUntitledFile, untitledCounter,
      searchQuery, setSearchQuery, searchResults, setSearchResults, isSearching, setIsSearching,
      includePattern, setIncludePattern, excludePattern, setExcludePattern,
      diffViewOpen, setDiffViewOpen, diffFile, setDiffFile, diffLines, setDiffLines,
      stagedChanges, setStagedChanges, unstagedChanges, setUnstagedChanges, toggleStaged,
      selectedCommit, setSelectedCommit, contextMenu, setContextMenu,
      expandAllFolders, collapseAllFolders,
    }}>{children}</VSCodeContext.Provider>
  );
}

export function useVSCode() {
  const ctx = useContext(VSCodeContext);
  if (!ctx) throw new Error('useVSCode must be used within VSCodeProvider');
  return ctx;
}
