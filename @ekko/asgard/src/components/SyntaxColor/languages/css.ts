// ============================================================================
// CSS Monarch Language Definition
// ============================================================================

import type { MonarchLanguage } from '../types';

export const cssLanguage: MonarchLanguage = {
  defaultToken: 'source',
  tokenPostfix: '.css',

  tokenizer: {
    root: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],

      // At-rules
      [/@[\w-]+/, 'keyword'],

      // Selectors — IDs, classes, pseudo, elements
      [/#[\w-]+/, 'tag'],
      [/\.[\w-]+/, 'annotation'],
      [/::?[\w-]+/, 'annotation'],
      [/[\w-]+(?=\s*\{)/, 'tag'],

      // Property names inside blocks
      [/[\w-]+(?=\s*:)/, 'type'],

      // Strings
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],

      // Numbers and units
      [/-?[\d.]+(%|px|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|deg|rad|grad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)\b/, 'number'],
      [/-?[\d.]+/, 'number'],

      // Colors
      [/#[0-9a-fA-F]{3,8}\b/, 'number.hex'],

      // Functions
      [/[\w-]+(?=\()/, 'identifier'],

      // Important
      [/!important/, 'keyword'],

      // Delimiters
      [/[{}()\[\]]/, 'delimiter.bracket'],
      [/[;:,]/, 'delimiter'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],

    string_double: [
      [/[^"\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^'\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],
  },
};
