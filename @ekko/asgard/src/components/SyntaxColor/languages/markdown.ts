// ============================================================================
// Markdown Monarch Language Definition
// ============================================================================

import type { MonarchLanguage } from '../types';

export const markdownLanguage: MonarchLanguage = {
  defaultToken: 'source',
  tokenPostfix: '.md',

  tokenizer: {
    root: [
      // Fenced code block opening
      [/^```\s*\S*/, 'string', '@codeblock'],

      // Headings
      [/^#{1,6}\s+.*$/, 'keyword'],

      // Horizontal rule
      [/^(\s*[-*_]\s*){3,}$/, 'comment'],

      // Blockquote
      [/^>\s+/, 'comment'],

      // Unordered list marker
      [/^\s*[-*+]\s+/, 'keyword.operator'],

      // Ordered list marker
      [/^\s*\d+\.\s+/, 'keyword.operator'],

      // Table separator row
      [/^\|[\s:|-]+\|$/, 'comment'],

      // Table pipe
      [/\|/, 'delimiter'],

      // Inline content
      { include: '@inline' },
    ],

    inline: [
      // Inline code
      [/`[^`\n]+`/, 'string'],

      // Bold+Italic
      [/\*\*\*[^*\n]+\*\*\*/, 'keyword.bold'],

      // Bold
      [/\*\*[^*\n]+\*\*/, 'keyword.bold'],

      // Italic
      [/\*[^*\n]+\*/, 'keyword.italic'],

      // Strikethrough
      [/~~[^~\n]+~~/, 'comment'],

      // Image
      [/!\[[^\]\n]*\]\([^)\n]+\)/, 'string'],

      // Link
      [/\[[^\]\n]*\]\([^)\n]+\)/, 'type'],

      // Plain text
      [/[^`*~!\[|\n]+/, 'source'],
      [/./, 'source'],
    ],

    codeblock: [
      [/^```\s*$/, 'string', '@pop'],
      [/.*/, 'string'],
    ],
  },
};
