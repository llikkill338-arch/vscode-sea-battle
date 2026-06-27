export interface Token { type: string; text: string; color: string; }

const KEYWORDS = new Set(['alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit', 'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast', 'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch', 'synchronized', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq', 'override', 'final']);

const TYPES = new Set(['int', 'char', 'bool', 'float', 'double', 'void', 'string', 'vector', 'map', 'set', 'array', 'tuple', 'optional', 'variant', 'unique_ptr', 'shared_ptr', 'size_t', 'uint32_t', 'int32_t', 'uint64_t', 'int64_t', 'auto']);

const COLORS: Record<string, string> = {
  keyword: '#569cd6', type: '#4ec9b0', string: '#ce9178', comment: '#6a9955',
  number: '#b5cea8', function: '#dcdcaa', preprocessor: '#c586c0', variable: '#9cdcfe', default: '#d4d4d4', operator: '#d4d4d4',
};

export function highlightCpp(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', text: line.slice(i), color: COLORS.comment }); break;
    }
    // String
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i]; let j = i + 1;
      while (j < line.length && line[j] !== quote) { if (line[j] === '\\') j++; j++; }
      tokens.push({ type: 'string', text: line.slice(i, j + 1), color: COLORS.string });
      i = j + 1; continue;
    }
    // Preprocessor
    if (line[i] === '#') {
      let j = i + 1; while (j < line.length && /[a-zA-Z_]/.test(line[j])) j++;
      tokens.push({ type: 'preprocessor', text: line.slice(i, j), color: COLORS.preprocessor });
      i = j; continue;
    }
    // Number
    if (/[0-9]/.test(line[i])) {
      let j = i; while (j < line.length && /[0-9.xXa-fA-FuUlL]/.test(line[j])) j++;
      tokens.push({ type: 'number', text: line.slice(i, j), color: COLORS.number });
      i = j; continue;
    }
    // Identifier
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i; while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let type = 'variable';
      if (KEYWORDS.has(word)) type = 'keyword';
      else if (TYPES.has(word)) type = 'type';
      else if (line[j] === '(') type = 'function';
      tokens.push({ type, text: word, color: COLORS[type] || COLORS.default });
      i = j; continue;
    }
    // Whitespace
    if (/\s/.test(line[i])) {
      let j = i; while (j < line.length && /\s/.test(line[j])) j++;
      tokens.push({ type: 'default', text: line.slice(i, j), color: COLORS.default });
      i = j; continue;
    }
    // Operator/symbol
    tokens.push({ type: 'operator', text: line[i], color: COLORS.operator });
    i++;
  }

  if (tokens.length === 0) tokens.push({ type: 'default', text: '', color: COLORS.default });
  return tokens;
}
