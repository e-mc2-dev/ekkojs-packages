// ============================================================================
// TypeScript / JavaScript Monarch Language Definition
// Compatible with Monaco Editor's Monarch format (MIT)
// ============================================================================

import type { MonarchLanguage } from '../types';

export const typescriptLanguage: MonarchLanguage = {
  defaultToken: 'source',
  tokenPostfix: '.ts',

  keywords: [
    'abstract', 'any', 'as', 'asserts', 'async', 'await',
    'break', 'case', 'catch', 'class', 'const', 'constructor', 'continue',
    'debugger', 'declare', 'default', 'delete', 'do',
    'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'from', 'function',
    'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is',
    'keyof', 'let',
    'module', 'namespace', 'never', 'new', 'null',
    'of', 'package', 'private', 'protected', 'public',
    'readonly', 'require', 'return',
    'set', 'static', 'super', 'switch',
    'this', 'throw', 'true', 'try', 'type', 'typeof',
    'undefined', 'unique', 'unknown',
    'var', 'void',
    'while', 'with',
    'yield',
  ],

  typeKeywords: [
    'boolean', 'string', 'number', 'object', 'symbol', 'bigint',
    'Array', 'Map', 'Set', 'Promise', 'Record', 'Partial', 'Required',
    'Readonly', 'Pick', 'Omit', 'Exclude', 'Extract',
  ],

  operators: [
    '<=', '>=', '==', '!=', '===', '!==',
    '=>', '+', '-', '**', '*', '/', '%',
    '++', '--', '<<', '>>', '>>>',
    '&', '|', '^', '!', '~',
    '&&', '||', '??', '?.',
    '?', ':', '=',
    '+=', '-=', '*=', '**=', '/=', '%=',
    '<<=', '>>=', '>>>=', '&=', '|=', '^=',
    '??=', '&&=', '||=',
  ],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  digits: /\d+(_+\d+)*/,

  tokenizer: {
    root: [
      // Whitespace
      [/[ \t\r\n]+/, 'white'],

      // JSDoc / multiline comments
      [/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
      [/\/\*/, 'comment', '@comment'],

      // Single-line comment
      [/\/\/.*$/, 'comment'],

      // JSX/TSX tags (simple detection)
      [/<\/?\w+/, 'tag', '@tag'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      [/`/, 'string', '@string_backtick'],

      // Numbers
      [/0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?/, 'number.hex'],
      [/0[oO][0-7](_?[0-7])*n?/, 'number.octal'],
      [/0[bB][01](_?[01])*n?/, 'number.binary'],
      [/\d(_?\d)*\.\d(_?\d)*([eE][-+]?\d(_?\d)*)?/, 'number.float'],
      [/\d(_?\d)*[eE][-+]?\d(_?\d)*/, 'number.float'],
      [/\d(_?\d)*n?/, 'number'],

      // Decorators
      [/@[a-zA-Z_]\w*/, 'annotation'],

      // Identifiers and keywords
      [/[a-zA-Z_$][\w$]*/, {
        token: '@rematch',
        next: '@checkKeyword',
      }],

      // Delimiters and operators
      [/[{}()\[\]]/, 'delimiter.bracket'],
      [/[<>](?!@symbols)/, 'delimiter.bracket'],
      [/[;,.]/, 'delimiter'],
      [/@symbols/, 'operator'],
    ],

    checkKeyword: [
      [/(abstract|any|as|asserts|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|is|keyof|let|module|namespace|never|new|null|of|package|private|protected|public|readonly|require|return|set|static|super|switch|this|throw|true|try|type|typeof|undefined|unique|unknown|var|void|while|with|yield)\b/, 'keyword', '@pop'],
      [/(boolean|string|number|object|symbol|bigint|Array|Map|Set|Promise|Record|Partial|Required|Readonly|Pick|Omit|Exclude|Extract)\b/, 'type', '@pop'],
      [/[a-zA-Z_$][\w$]*/, 'identifier', '@pop'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],

    jsdoc: [
      [/@\w+/, 'comment.doc.tag'],
      [/[^\/*@]+/, 'comment.doc'],
      [/\*\//, 'comment.doc', '@pop'],
      [/[\/*]/, 'comment.doc'],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],

    string_backtick: [
      [/\$\{/, 'delimiter.bracket', '@bracketCounting'],
      [/[^\\`$]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/`/, 'string', '@pop'],
    ],

    bracketCounting: [
      [/\{/, 'delimiter.bracket', '@bracketCounting'],
      [/\}/, 'delimiter.bracket', '@pop'],
      { include: 'root' },
    ],

    tag: [
      [/[ \t\r\n]+/, 'white'],
      [/[a-zA-Z_][\w-]*/, 'tag.attribute'],
      [/=/, 'delimiter'],
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
      [/\/?>/, 'tag', '@pop'],
    ],
  },
};

/** Alias for JavaScript (same tokenizer) */
export const javascriptLanguage: MonarchLanguage = {
  ...typescriptLanguage,
  tokenPostfix: '.js',
};
