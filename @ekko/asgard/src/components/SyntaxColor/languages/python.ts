// ============================================================================
// Python Monarch Language Definition
// ============================================================================

import type { MonarchLanguage } from '../types';

export const pythonLanguage: MonarchLanguage = {
  defaultToken: 'source',
  tokenPostfix: '.py',

  keywords: [
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
    'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
    'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
    'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
    'try', 'while', 'with', 'yield',
  ],

  builtins: [
    'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'callable',
    'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir',
    'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format',
    'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex',
    'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
    'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next',
    'object', 'oct', 'open', 'ord', 'pow', 'print', 'property', 'range',
    'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted',
    'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
  ],

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8}|N\{[^}]+\}|[0-7]{1,3})/,

  tokenizer: {
    root: [
      [/[ \t\r\n]+/, 'white'],

      // Comments
      [/#.*$/, 'comment'],

      // Triple-quoted strings
      [/"""/, 'string', '@string_triple_double'],
      [/'''/, 'string', '@string_triple_single'],

      // f-strings
      [/f"/, 'string', '@fstring_double'],
      [/f'/, 'string', '@fstring_single'],

      // Regular strings
      [/[rRbBuU]?"/, 'string', '@string_double'],
      [/[rRbBuU]?'/, 'string', '@string_single'],

      // Decorators
      [/@[\w.]+/, 'annotation'],

      // Numbers
      [/0[xX][0-9a-fA-F](_?[0-9a-fA-F])*/, 'number.hex'],
      [/0[oO][0-7](_?[0-7])*/, 'number.octal'],
      [/0[bB][01](_?[01])*/, 'number.binary'],
      [/\d(_?\d)*\.\d(_?\d)*([eE][-+]?\d(_?\d)*)?[jJ]?/, 'number.float'],
      [/\d(_?\d)*[eE][-+]?\d(_?\d)*[jJ]?/, 'number.float'],
      [/\d(_?\d)*[jJ]?/, 'number'],

      // Keywords & identifiers
      [/\b(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/, 'keyword'],
      [/\b(abs|all|any|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/, 'type'],
      [/\b(self|cls)\b/, 'variable'],
      [/[a-zA-Z_]\w*/, 'identifier'],

      // Operators
      [/[+\-*\/%&|^~<>=!]+/, 'operator'],

      // Delimiters
      [/[{}()\[\]]/, 'delimiter.bracket'],
      [/[;:,.]/, 'delimiter'],
    ],

    string_double: [
      [/[^"\\]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^'\\]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],

    string_triple_double: [
      [/[^"\\]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/"""/, 'string', '@pop'],
      [/"/, 'string'],
      [/\\./, 'string.escape.invalid'],
    ],

    string_triple_single: [
      [/[^'\\]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/'''/, 'string', '@pop'],
      [/'/, 'string'],
      [/\\./, 'string.escape.invalid'],
    ],

    fstring_double: [
      [/\{/, 'delimiter.bracket', '@fstring_expr'],
      [/[^"\\{]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],

    fstring_single: [
      [/\{/, 'delimiter.bracket', '@fstring_expr'],
      [/[^'\\{]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],

    fstring_expr: [
      [/\}/, 'delimiter.bracket', '@pop'],
      { include: 'root' },
    ],
  },
};
