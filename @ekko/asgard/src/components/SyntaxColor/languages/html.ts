// ============================================================================
// HTML Monarch Language Definition
// ============================================================================

import type { MonarchLanguage } from '../types';

export const htmlLanguage: MonarchLanguage = {
  defaultToken: 'source',
  tokenPostfix: '.html',

  tokenizer: {
    root: [
      [/[ \t\r\n]+/, 'white'],

      // Comments
      [/<!--/, 'comment', '@comment'],

      // DOCTYPE
      [/<!DOCTYPE/i, 'keyword', '@doctype'],

      // Script / Style blocks
      [/<script\b/i, 'tag', '@script'],
      [/<style\b/i, 'tag', '@style'],

      // CDATA
      [/<!\[CDATA\[/, 'comment', '@cdata'],

      // Tags
      [/<\/?\w+/, 'tag', '@tag'],

      // Entities
      [/&\w+;/, 'string.escape'],
      [/&#\d+;/, 'string.escape'],
      [/&#x[0-9a-fA-F]+;/, 'string.escape'],

      // Text content
      [/[^<&]+/, 'source'],
    ],

    comment: [
      [/[^-]+/, 'comment'],
      [/-->/, 'comment', '@pop'],
      [/[-]+/, 'comment'],
    ],

    doctype: [
      [/[^>]+/, 'keyword'],
      [/>/, 'keyword', '@pop'],
    ],

    tag: [
      [/[ \t\r\n]+/, 'white'],
      [/[a-zA-Z_][\w-]*/, 'tag.attribute'],
      [/=/, 'delimiter'],
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
      [/\/?>/, 'tag', '@pop'],
    ],

    script: [
      [/[ \t\r\n]+/, 'white'],
      [/[a-zA-Z_][\w-]*/, 'tag.attribute'],
      [/=/, 'delimiter'],
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
      [/>/, 'tag', '@scriptContent'],
    ],

    scriptContent: [
      [/<\/script\s*>/i, 'tag', '@pop'],
      [/[^<]+/, 'source'],
      [/</, 'source'],
    ],

    style: [
      [/[ \t\r\n]+/, 'white'],
      [/[a-zA-Z_][\w-]*/, 'tag.attribute'],
      [/=/, 'delimiter'],
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
      [/>/, 'tag', '@styleContent'],
    ],

    styleContent: [
      [/<\/style\s*>/i, 'tag', '@pop'],
      [/[^<]+/, 'source'],
      [/</, 'source'],
    ],

    cdata: [
      [/[^\]]+/, 'comment'],
      [/\]\]>/, 'comment', '@pop'],
      [/\]/, 'comment'],
    ],
  },
};
