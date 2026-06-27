import { useMemo, useRef, useEffect, useState } from 'react';
import { useVSCode } from '@/context/VSCodeContext';
import { highlightCpp } from '@/lib/cppHighlighter';

export default function Editor() {
  const { activeTab, fileContents, setCursorPosition } = useVSCode();
  const editorRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [editorHeight, setEditorHeight] = useState(0);

  const content = fileContents[activeTab] || '// No content available';
  const lines = content.split('\n');

  const highlighted = useMemo(() => lines.map(line => highlightCpp(line)), [lines]);

  useEffect(() => {
    const measure = () => { if (editorRef.current) setEditorHeight(editorRef.current.clientHeight); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 100;
    canvas.height = Math.max(editorHeight, lines.length * 2 + 20);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const lineColors: Record<string, string> = { keyword: '#569cd6', type: '#4ec9b0', string: '#ce9178', comment: '#6a9955', number: '#b5cea8', function: '#dcdcaa', preprocessor: '#569cd6', variable: '#9cdcfe', default: '#d4d4d4' };
    highlighted.forEach((hl, i) => {
      let x = 0;
      hl.forEach(token => { const color = lineColors[token.type] || lineColors.default; ctx.fillStyle = color; ctx.fillRect(x, i * 2, Math.max(1, token.text.length * 0.6), 2); x += token.text.length * 0.6; });
    });

    // Viewport indicator
    if (editorHeight > 0) {
      const totalHeight = lines.length * 2 + 20;
      const viewportRatio = editorHeight / (lines.length * 21 + 16);
      const viewportHeight = Math.max(20, canvas.height * viewportRatio);
      const viewportY = (scrollTop / (lines.length * 21 + 16 - editorHeight)) * (canvas.height - viewportHeight);
      ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
      ctx.fillRect(0, Math.max(0, viewportY), canvas.width, viewportHeight);
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, Math.max(0, viewportY), canvas.width, viewportHeight);
    }
  }, [highlighted, lines.length, editorHeight, scrollTop]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => { setScrollTop(e.currentTarget.scrollTop); };

  const breadcrumbs = activeTab === 'README.md' ? ['battleship-cpp', activeTab] : ['battleship-cpp', 'src', activeTab];

  return (
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      {/* Breadcrumbs */}
      <div className="flex items-center px-3 gap-1" style={{ height: 22, background: '#1e1e1e', borderBottom: '1px solid #3e3e42', fontSize: 12, color: '#cccccc' }}>
        {breadcrumbs.map((crumb, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-1" style={{ color: '#858585' }}>{'>'}</span>}
            <span className="hover:underline cursor-pointer">{crumb}</span>
          </span>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line Numbers */}
        <div className="flex-shrink-0 overflow-hidden text-right pr-2 pt-2 select-none" style={{ width: 50, background: '#1e1e1e', color: '#858585', fontSize: 14, fontFamily: "'JetBrains Mono', monospace", lineHeight: '21px' }}>
          {lines.map((_, i) => (
            <div key={i} style={{ height: 21, color: '#858585' }}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <div ref={editorRef} className="flex-1 overflow-auto pt-2" style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", lineHeight: '21px' }} onScroll={handleScroll}>
          {highlighted.map((hl, i) => (
            <div key={i} className="flex" style={{ height: 21, whiteSpace: 'pre' }}>
              {hl.map((token, j) => (
                <span key={j} style={{ color: token.color }}>{token.text}</span>
              ))}
            </div>
          ))}
          <div style={{ height: 16 }} />
        </div>

        {/* Minimap */}
        <div className="flex-shrink-0 overflow-hidden" style={{ width: 100, background: '#1e1e1e' }}>
          <canvas ref={minimapRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  );
}
