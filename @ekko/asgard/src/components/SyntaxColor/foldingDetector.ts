// ============================================================================
// Folding Detector — Detects foldable regions using bracket matching
// and block-level patterns (like VS Code).
// ============================================================================

import type { FoldRegion } from './types';

/**
 * Computes the indentation level of a line (number of leading spaces).
 * Tabs are counted as `tabSize` spaces.
 */
function getIndentLevel(line: string, tabSize: number): number {
  let indent = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === ' ') {
      indent++;
    } else if (line[i] === '\t') {
      indent += tabSize;
    } else {
      break;
    }
  }
  return indent;
}

/**
 * Strips string literals and single-line comments from a line
 * so bracket counting is not confused by brackets inside strings.
 */
function stripStringsAndComments(line: string): string {
  let result = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    // Single-line comment
    if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
      break; // rest of line is comment
    }
    // String literals
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++; // skip opening quote
      while (i < line.length && line[i] !== quote) {
        if (line[i] === '\\') i++; // skip escaped char
        i++;
      }
      i++; // skip closing quote
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

interface BracketInfo {
  char: '{' | '[' | '(';
  line: number; // 0-based index
}

/**
 * Detects foldable regions using bracket matching and block patterns.
 *
 * Strategy:
 * 1. Match opening/closing brackets: { }, [ ], ( )
 *    — A fold region spans from the opening bracket's line to the closing bracket's line.
 *    — Only creates a region if the span is >= 2 lines.
 * 2. Multi-line comments: regions starting with /* and ending with * /
 * 3. Consecutive single-line comment blocks (3+ lines of // comments)
 */
export function detectFoldRegions(lines: string[], tabSize: number): FoldRegion[] {
  const regions: FoldRegion[] = [];

  // --- Pass 1: Bracket matching ---
  const stack: BracketInfo[] = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Handle block comments
    if (inBlockComment) {
      if (raw.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    // Check for block comment start
    const blockCommentStart = raw.indexOf('/*');
    if (blockCommentStart !== -1 && !raw.includes('*/', blockCommentStart + 2)) {
      inBlockComment = true;
      // Block comment fold handled in Pass 2
      continue;
    }

    const stripped = stripStringsAndComments(raw);

    for (let j = 0; j < stripped.length; j++) {
      const ch = stripped[j];
      if (ch === '{' || ch === '[' || ch === '(') {
        stack.push({ char: ch, line: i });
      } else if (ch === '}' || ch === ']' || ch === ')') {
        // Find matching opener
        const expected = ch === '}' ? '{' : ch === ']' ? '[' : '(';
        // Pop until we find a match (handles minor mismatches gracefully)
        for (let k = stack.length - 1; k >= 0; k--) {
          if (stack[k].char === expected) {
            const opener = stack[k];
            stack.splice(k, 1);
            // Only fold if span is at least 2 lines
            if (i - opener.line >= 1) {
              regions.push({
                startLine: opener.line + 1, // 1-based
                endLine: i + 1,
                indent: getIndentLevel(lines[opener.line], tabSize),
              });
            }
            break;
          }
        }
      }
    }
  }

  // --- Pass 2: Multi-line block comments (/* ... */) ---
  let commentStart = -1;
  inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (!inBlockComment) {
      if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
        commentStart = i;
        inBlockComment = true;
      }
    } else {
      if (lines[i].includes('*/')) {
        inBlockComment = false;
        if (i - commentStart >= 1) {
          regions.push({
            startLine: commentStart + 1,
            endLine: i + 1,
            indent: getIndentLevel(lines[commentStart], tabSize),
          });
        }
      }
    }
  }

  // --- Pass 3: Consecutive single-line comment blocks (// ...) ---
  let runStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith('//')) {
      if (runStart === -1) runStart = i;
    } else {
      if (runStart !== -1 && i - runStart >= 3) {
        regions.push({
          startLine: runStart + 1,
          endLine: i, // 1-based, the last comment line
          indent: getIndentLevel(lines[runStart], tabSize),
        });
      }
      runStart = -1;
    }
  }
  // Handle run ending at EOF
  if (runStart !== -1 && lines.length - runStart >= 3) {
    regions.push({
      startLine: runStart + 1,
      endLine: lines.length,
      indent: getIndentLevel(lines[runStart], tabSize),
    });
  }

  // Sort by startLine for consistent processing
  regions.sort((a, b) => a.startLine - b.startLine || a.endLine - b.endLine);

  // Deduplicate regions sharing the same startLine — keep the largest endLine
  const deduped: FoldRegion[] = [];
  for (const r of regions) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.startLine === r.startLine) {
      // r has equal or larger endLine (due to sort order), so replace
      deduped[deduped.length - 1] = r;
    } else {
      deduped.push(r);
    }
  }

  return deduped;
}

/**
 * Given fold regions and a set of collapsed start lines,
 * returns the set of line numbers (1-based) that should be hidden.
 */
export function getHiddenLines(
  foldRegions: FoldRegion[],
  collapsedLines: Set<number>
): Set<number> {
  const hidden = new Set<number>();

  for (const region of foldRegions) {
    if (collapsedLines.has(region.startLine)) {
      for (let line = region.startLine + 1; line <= region.endLine; line++) {
        hidden.add(line);
      }
    }
  }

  return hidden;
}
