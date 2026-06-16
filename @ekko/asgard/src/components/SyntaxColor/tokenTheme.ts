// ============================================================================
// Token Theme — Maps token types to theme colors
// ============================================================================

import type { Theme } from '../../theme/types';

/**
 * Builds the default token-to-color map from the current theme.
 * Token types use a hierarchical dot notation (e.g. 'comment.doc.tag').
 * The map resolves the most specific match first, then walks up.
 */
export function buildTokenColorMap(theme: Theme): Record<string, string> {
  return {
    // Keywords & control flow
    'keyword': theme.accent.primary,

    // Types & type annotations
    'type': theme.semantic.info,

    // Strings
    'string': theme.semantic.success,
    'string.escape': theme.semantic.warning,
    'string.invalid': theme.semantic.error,

    // Comments
    'comment': theme.text.disabled,
    'comment.doc': theme.text.disabled,
    'comment.doc.tag': theme.accent.secondary,

    // Numbers
    'number': theme.semantic.warning,
    'number.hex': theme.semantic.warning,
    'number.float': theme.semantic.warning,
    'number.octal': theme.semantic.warning,
    'number.binary': theme.semantic.warning,

    // Operators & delimiters
    'operator': theme.text.secondary,
    'delimiter': theme.text.secondary,
    'delimiter.bracket': theme.text.primary,

    // Identifiers
    'identifier': theme.text.primary,
    'variable': theme.text.primary,

    // Annotations/decorators
    'annotation': theme.accent.secondary,

    // Tags (HTML/JSX)
    'tag': theme.accent.primary,
    'tag.attribute': theme.semantic.info,

    // Source (default/unmatched)
    'source': theme.text.primary,

    // Whitespace (invisible, but mapped for completeness)
    'white': 'transparent',
  };
}

/**
 * Resolves a token type to a color using hierarchical matching.
 * E.g. 'comment.doc.tag' tries exact match, then 'comment.doc', then 'comment'.
 */
export function resolveTokenColor(
  tokenType: string,
  colorMap: Record<string, string>,
  fallbackColor: string
): string {
  // Try exact match
  if (colorMap[tokenType]) return colorMap[tokenType];

  // Walk up the hierarchy
  const parts = tokenType.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const prefix = parts.slice(0, i).join('.');
    if (colorMap[prefix]) return colorMap[prefix];
  }

  return fallbackColor;
}
