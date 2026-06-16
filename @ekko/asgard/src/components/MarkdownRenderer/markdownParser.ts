// ============================================================================
// Markdown Parser — Converts markdown text to an AST of MarkdownNode[]
// Handles: headings, paragraphs, blockquotes, fenced code blocks,
//          lists (ordered/unordered), horizontal rules, tables, and inline formatting
// ============================================================================

import type { MarkdownNode, InlineNode, ListItemNode } from './types';
import { MD_MAX_DEPTH } from '../../_internal';
// Recursion-depth budget (finding #7): bail to plain text past MD_MAX_DEPTH to prevent stack-overflow DoS.
let _mdDepth = 0;

/** Parse inline markdown content (bold, italic, code, links, images, strikethrough) */
export function parseInline(text: string): InlineNode[] {
  if (++_mdDepth > MD_MAX_DEPTH) { _mdDepth--; return [{ type: 'text', text }]; }
  const nodes: InlineNode[] = [];
  let i = 0;

  while (i < text.length) {
    // Image: ![alt](src)
    if (text[i] === '!' && text[i + 1] === '[') {
      const altEnd = text.indexOf(']', i + 2);
      if (altEnd !== -1 && text[altEnd + 1] === '(') {
        const srcEnd = text.indexOf(')', altEnd + 2);
        if (srcEnd !== -1) {
          const alt = text.slice(i + 2, altEnd);
          const src = text.slice(altEnd + 2, srcEnd);
          nodes.push({ type: 'image', src, alt });
          i = srcEnd + 1;
          continue;
        }
      }
    }

    // Link: [text](href)
    if (text[i] === '[') {
      const labelEnd = text.indexOf(']', i + 1);
      if (labelEnd !== -1 && text[labelEnd + 1] === '(') {
        const hrefEnd = text.indexOf(')', labelEnd + 2);
        if (hrefEnd !== -1) {
          const label = text.slice(i + 1, labelEnd);
          const href = text.slice(labelEnd + 2, hrefEnd);
          nodes.push({ type: 'link', href, children: parseInline(label) });
          i = hrefEnd + 1;
          continue;
        }
      }
    }

    // Inline code: `code`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        nodes.push({ type: 'code', text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Bold+Italic: ***text*** or ___text___
    if ((text[i] === '*' || text[i] === '_') && text[i + 1] === text[i] && text[i + 2] === text[i]) {
      const marker = text[i];
      const closing = text.indexOf(marker + marker + marker, i + 3);
      if (closing !== -1) {
        nodes.push({ type: 'bold_italic', children: parseInline(text.slice(i + 3, closing)) });
        i = closing + 3;
        continue;
      }
    }

    // Bold: **text** or __text__
    if ((text[i] === '*' || text[i] === '_') && text[i + 1] === text[i]) {
      const marker = text[i];
      const closing = text.indexOf(marker + marker, i + 2);
      if (closing !== -1) {
        nodes.push({ type: 'bold', children: parseInline(text.slice(i + 2, closing)) });
        i = closing + 2;
        continue;
      }
    }

    // Italic: *text* or _text_
    if (text[i] === '*' || text[i] === '_') {
      const marker = text[i];
      const closing = text.indexOf(marker, i + 1);
      if (closing !== -1) {
        nodes.push({ type: 'italic', children: parseInline(text.slice(i + 1, closing)) });
        i = closing + 1;
        continue;
      }
    }

    // Strikethrough: ~~text~~
    if (text[i] === '~' && text[i + 1] === '~') {
      const closing = text.indexOf('~~', i + 2);
      if (closing !== -1) {
        nodes.push({ type: 'strikethrough', children: parseInline(text.slice(i + 2, closing)) });
        i = closing + 2;
        continue;
      }
    }

    // Line break: two trailing spaces before newline or explicit <br>
    if (text[i] === ' ' && text[i + 1] === ' ' && text[i + 2] === '\n') {
      nodes.push({ type: 'line_break' });
      i += 3;
      continue;
    }

    // Plain text — accumulate until next special character
    let end = i + 1;
    while (end < text.length && !'[!`*_~'.includes(text[end])) {
      if (text[end] === ' ' && text[end + 1] === ' ' && text[end + 2] === '\n') break;
      end++;
    }
    nodes.push({ type: 'text', text: text.slice(i, end) });
    i = end;
  }

  _mdDepth--;
  return nodes;
}

/** Check if a line is a table separator row (e.g. |---|---|) */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false;
  const cells = trimmed.slice(1, -1).split('|');
  return cells.every(c => /^\s*:?-{3,}:?\s*$/.test(c));
}

/** Split a table row into cells, treating an escaped "\|" as a literal pipe (not a column separator). */
function splitTableCells(s: string): string[] {
  const cells: string[] = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (s[i] === '|') { cells.push(cur); cur = ''; continue; }
    cur += s[i];
  }
  cells.push(cur);
  return cells;
}

/** Parse table cells from a pipe-delimited line */
function parseTableRow(line: string): InlineNode[][] {
  const trimmed = line.trim();
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailing = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return splitTableCells(withoutTrailing).map(cell => parseInline(cell.trim()));
}

/** Parse a full markdown string into block-level nodes */
export function parseMarkdown(markdown: string): MarkdownNode[] {
  if (++_mdDepth > MD_MAX_DEPTH) { _mdDepth--; return []; }
  const lines = markdown.split('\n');
  const nodes: MarkdownNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Fenced code block: ```language
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push({ type: 'code_block', language, code: codeLines.join('\n') });
      i++; // skip closing ```
      continue;
    }

    // Heading: # to ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      nodes.push({ type: 'heading', level, children: parseInline(headingMatch[2]) });
      i++;
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      nodes.push({ type: 'horizontal_rule' });
      i++;
      continue;
    }

    // Table: starts with | and next line is separator
    if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = parseTableRow(line);
      i += 2; // skip header + separator
      const rows: InlineNode[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      nodes.push({ type: 'table', headers, rows });
      continue;
    }

    // Blockquote: > text
    if (line.trimStart().startsWith('> ') || line.trimStart() === '>') {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].trimStart().startsWith('> ') || lines[i].trimStart() === '>')) {
        quoteLines.push(lines[i].trimStart().replace(/^>\s?/, ''));
        i++;
      }
      nodes.push({ type: 'blockquote', children: parseMarkdown(quoteLines.join('\n')) });
      continue;
    }

    // Unordered list: - item, * item, + item
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: ListItemNode[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*+]\s+/, '');
        items.push({ children: parseInline(itemText) });
        i++;
      }
      nodes.push({ type: 'unordered_list', items });
      continue;
    }

    // Ordered list: 1. item
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: ListItemNode[] = [];
      const startMatch = line.match(/^\s*(\d+)\./);
      const start = startMatch ? parseInt(startMatch[1], 10) : 1;
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        items.push({ children: parseInline(itemText) });
        i++;
      }
      nodes.push({ type: 'ordered_list', start, items });
      continue;
    }

    // Paragraph — collect lines until empty line or block-level element
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].trimStart().startsWith('> ') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\s*[-*_]\s*){3,}$/.test(lines[i]) &&
      !(lines[i].trim().startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    nodes.push({ type: 'paragraph', children: parseInline(paraLines.join('\n')) });
  }

  _mdDepth--;
  return nodes;
}
