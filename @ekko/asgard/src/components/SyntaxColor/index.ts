// ============================================================================
// SyntaxColor — Barrel Export
// ============================================================================

// Main component
export { SyntaxColor } from './SyntaxColor';

// Types
export type {
  SyntaxColorProps,
  SyntaxColorSize,
  SyntaxToken,
  TokenizedLine,
  MonarchLanguage,
  MonarchRule,
  MonarchAction,
  FoldRegion,
  DiffChangeType,
  LineDiffInfo,
  DiagnosticSeverity,
  LineDiagnostic,
  MarginDecoratorItem,
  OutlineEntry,
  OutlineViewProps,
  GutterProps,
  SyntaxColorLineProps,
  MinimapProps,
} from './types';

// Tokenizer utilities
export { compileLanguage, tokenize, mergeAdjacentTokens } from './monarchTokenizer';
export type { CompiledLanguage } from './monarchTokenizer';

// Token theme utilities
export { buildTokenColorMap, resolveTokenColor } from './tokenTheme';

// Folding utilities
export { detectFoldRegions, getHiddenLines } from './foldingDetector';

// Sub-components (for advanced composition)
export { SyntaxColorLine } from './SyntaxColorLine';
export { Gutter } from './Gutter';
export { OutlineView } from './OutlineView';
export { Minimap } from './Minimap';

// Built-in language definitions
export {
  typescriptLanguage,
  javascriptLanguage,
  jsonLanguage,
  cssLanguage,
  htmlLanguage,
  pythonLanguage,
  markdownLanguage,
  // MIT-adapted from monaco-editor (asgard 1.0.4)
  scssLanguage,
  lessLanguage,
  rustLanguage,
  goLanguage,
  cppLanguage,
  csharpLanguage,
  javaLanguage,
  kotlinLanguage,
  swiftLanguage,
  rubyLanguage,
  phpLanguage,
  sqlLanguage,
  yamlLanguage,
  shellLanguage,
  dockerfileLanguage,
  graphqlLanguage,
  xmlLanguage,
} from './languages';
