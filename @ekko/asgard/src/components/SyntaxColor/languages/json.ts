// ============================================================================
// JSON Monarch Language Definition
// ============================================================================

import type { MonarchLanguage } from '../types';

export const jsonLanguage: MonarchLanguage = {
  defaultToken: 'source',
  tokenPostfix: '.json',

  keywords: ['true', 'false', 'null'],

  escapes: /\\(?:["\\/bfnrt]|u[0-9A-Fa-f]{4})/,

  tokenizer: {
    root: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      [/"(?=.*":)/, 'type', '@key'],
      [/"/, 'string', '@string'],
      [/-?\d+\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/-?\d+([eE][-+]?\d+)?/, 'number'],
      [/\b(true|false)\b/, 'keyword'],
      [/\bnull\b/, 'keyword'],
      [/[{}()\[\]]/, 'delimiter.bracket'],
      [/[,:]/, 'delimiter'],
    ],

    key: [
      [/[^"\\]+/, 'type'],
      [/@escapes/, 'type'],
      [/"/, 'type', '@pop'],
    ],

    string: [
      [/[^"\\]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],
  },
};
