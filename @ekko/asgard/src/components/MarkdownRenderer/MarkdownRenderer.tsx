// ============================================================================
import { safeUrl } from '../../_internal';
// MarkdownRenderer — Renders markdown text with theme-aware styling
// ============================================================================

import React, { useMemo, useCallback, useState } from 'react';
import { useTheme } from '../../theme';
import type { MarkdownRendererProps, MarkdownRendererSize, MarkdownNode, InlineNode, ListItemNode } from './types';
import { parseMarkdown } from './markdownParser';
import { SyntaxColor } from '../SyntaxColor/SyntaxColor';
import { Terminal } from '../Terminal/Terminal';
import { ImageLightbox } from './ImageLightbox';
import {
  typescriptLanguage, javascriptLanguage, jsonLanguage, cssLanguage, scssLanguage, htmlLanguage,
  pythonLanguage, markdownLanguage, lessLanguage, rustLanguage, goLanguage, cppLanguage, csharpLanguage,
  javaLanguage, kotlinLanguage, swiftLanguage, rubyLanguage, phpLanguage, sqlLanguage, yamlLanguage,
  shellLanguage, dockerfileLanguage, graphqlLanguage, xmlLanguage,
} from '../SyntaxColor/languages';
import type { MonarchLanguage } from '../SyntaxColor/types';

/** Size configuration */
const sizeConfig: Record<MarkdownRendererSize, {
  fontSize: number;
  lineHeight: number;
  headingScale: number[];
  codeSize: number;
  spacing: number;
}> = {
  small: { fontSize: 12, lineHeight: 1.5, headingScale: [20, 17, 15, 13, 12, 11], codeSize: 11, spacing: 8 },
  normal: { fontSize: 14, lineHeight: 1.6, headingScale: [26, 22, 18, 16, 14, 13], codeSize: 13, spacing: 12 },
  large: { fontSize: 16, lineHeight: 1.7, headingScale: [32, 26, 22, 19, 17, 15], codeSize: 15, spacing: 16 },
};

/** Map language identifiers to Monarch language definitions */
const languageMap: Record<string, MonarchLanguage> = {
  typescript: typescriptLanguage,
  ts: typescriptLanguage,
  tsx: typescriptLanguage,
  javascript: javascriptLanguage,
  js: javascriptLanguage,
  jsx: javascriptLanguage,
  json: jsonLanguage,
  jsonc: jsonLanguage,
  json5: jsonLanguage,
  css: cssLanguage,
  scss: scssLanguage,
  sass: scssLanguage,
  less: lessLanguage,
  html: htmlLanguage,
  xml: xmlLanguage,
  svg: xmlLanguage,
  python: pythonLanguage,
  py: pythonLanguage,
  markdown: markdownLanguage,
  md: markdownLanguage,
  // MIT-adapted from monaco-editor (asgard 1.0.4)
  rust: rustLanguage,
  rs: rustLanguage,
  go: goLanguage,
  golang: goLanguage,
  cpp: cppLanguage,
  'c++': cppLanguage,
  cc: cppLanguage,
  c: cppLanguage,
  h: cppLanguage,
  hpp: cppLanguage,
  csharp: csharpLanguage,
  cs: csharpLanguage,
  'c#': csharpLanguage,
  java: javaLanguage,
  kotlin: kotlinLanguage,
  kt: kotlinLanguage,
  swift: swiftLanguage,
  ruby: rubyLanguage,
  rb: rubyLanguage,
  php: phpLanguage,
  sql: sqlLanguage,
  yaml: yamlLanguage,
  yml: yamlLanguage,
  shell: shellLanguage,
  sh: shellLanguage,
  bash: shellLanguage,
  zsh: shellLanguage,
  dockerfile: dockerfileLanguage,
  docker: dockerfileLanguage,
  graphql: graphqlLanguage,
  gql: graphqlLanguage,
};

/** Flattens an inline-node tree to its plain text (for heading anchors / a table of contents). */
export function inlineText(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text' || n.type === 'code') return n.text;
      if ('children' in n) return inlineText(n.children);
      return '';
    })
    .join('');
}

/** Converts heading text to a stable URL anchor slug. Shared with consumers building a TOC. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdown,
  size = 'normal',
  syntaxHighlight = true,
  codeColorMap,
  codeCopyButton = false,
  imageLightbox = false,
  onLinkClick,
  style,
  className,
}) => {
  const { theme } = useTheme();
  const config = sizeConfig[size];

  // Open image (click-to-zoom) lightbox — only used when imageLightbox is enabled.
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const ast = useMemo(() => parseMarkdown(markdown), [markdown]);

  const handleLinkClick = useCallback((e: React.MouseEvent, href: string) => {
    if (onLinkClick) {
      e.preventDefault();
      onLinkClick(href);
    }
  }, [onLinkClick]);

  const renderInline = (nodes: InlineNode[], keyPrefix: string): React.ReactNode[] => {
    return nodes.map((node, i) => {
      const key = `${keyPrefix}-${i}`;
      switch (node.type) {
        case 'text':
          return <span key={key}>{node.text}</span>;
        case 'bold':
          return <strong key={key}>{renderInline(node.children, key)}</strong>;
        case 'italic':
          return <em key={key}>{renderInline(node.children, key)}</em>;
        case 'bold_italic':
          return <strong key={key}><em>{renderInline(node.children, key)}</em></strong>;
        case 'strikethrough':
          return <span key={key} style={{ textDecoration: 'line-through' }}>{renderInline(node.children, key)}</span>;
        case 'code':
          return (
            <code key={key} style={{
              backgroundColor: theme.background.tertiary,
              color: theme.accent.primary,
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: `${config.codeSize}px`,
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            }}>
              {node.text}
            </code>
          );
        case 'link':
          return (
            <a
              key={key}
              href={safeUrl(node.href)}
              onClick={(e) => handleLinkClick(e, node.href)}
              style={{
                color: theme.accent.primary,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              {renderInline(node.children, key)}
            </a>
          );
        case 'image': {
          const resolvedSrc = safeUrl(node.src);
          return (
            <img
              key={key}
              src={resolvedSrc}
              alt={node.alt}
              onClick={imageLightbox ? () => setLightbox({ src: resolvedSrc, alt: node.alt }) : undefined}
              style={{
                maxWidth: '100%',
                borderRadius: '4px',
                cursor: imageLightbox ? 'zoom-in' : undefined,
              }}
            />
          );
        }
        case 'line_break':
          return <br key={key} />;
        default:
          return null;
      }
    });
  };

  const renderListItems = (items: ListItemNode[], keyPrefix: string): React.ReactNode[] => {
    return items.map((item, i) => (
      <li key={`${keyPrefix}-li-${i}`} style={{ marginBottom: `${config.spacing / 3}px` }}>
        {renderInline(item.children, `${keyPrefix}-li-${i}`)}
      </li>
    ));
  };

  const renderBlock = (node: MarkdownNode, index: number): React.ReactNode => {
    const key = `block-${index}`;
    const spacing = `${config.spacing}px`;

    switch (node.type) {
      case 'heading': {
        const fontSize = config.headingScale[node.level - 1];
        const Tag = `h${node.level}` as keyof React.JSX.IntrinsicElements;
        return (
          <Tag
            key={key}
            id={slugify(inlineText(node.children))}
            style={{
              scrollMarginTop: '80px',
              fontSize: `${fontSize}px`,
              fontWeight: node.level <= 2 ? 600 : 500,
              lineHeight: 1.3,
              margin: 0,
              marginBottom: spacing,
              marginTop: index > 0 ? `${config.spacing * 1.5}px` : '0',
              color: theme.text.primary,
              borderBottom: node.level <= 2 ? `1px solid ${theme.border.divider}` : undefined,
              paddingBottom: node.level <= 2 ? `${config.spacing / 2}px` : undefined,
            }}
          >
            {renderInline(node.children, key)}
          </Tag>
        );
      }

      case 'paragraph':
        return (
          <p key={key} style={{
            margin: 0,
            marginBottom: spacing,
            lineHeight: config.lineHeight,
            color: theme.text.primary,
          }}>
            {renderInline(node.children, key)}
          </p>
        );

      case 'blockquote':
        return (
          <blockquote key={key} style={{
            margin: 0,
            marginBottom: spacing,
            paddingLeft: `${config.spacing}px`,
            borderLeft: `3px solid ${theme.accent.primary}`,
            color: theme.text.secondary,
          }}>
            {node.children.map((child, ci) => renderBlock(child, ci))}
          </blockquote>
        );

      case 'code_block': {
        const lang = node.language.toLowerCase();

        // ```ansi / ```terminal / ```console → render captured terminal output as a styled frame.
        if (lang === 'ansi' || lang === 'terminal' || lang === 'console') {
          return (
            <div key={key} style={{ marginBottom: spacing }}>
              <Terminal content={node.code} />
            </div>
          );
        }

        const monarchLang = languageMap[lang];

        if (syntaxHighlight && monarchLang) {
          return (
            <div key={key} style={{ marginBottom: spacing }}>
              <SyntaxColor
                code={node.code}
                language={monarchLang}
                size={size}
                showLineNumbers
                showIndentGuides
                showFolding
                showCopyButton={codeCopyButton}
                tokenColorMap={codeColorMap}
              />
            </div>
          );
        }

        return (
          <pre key={key} style={{
            margin: 0,
            marginBottom: spacing,
            padding: `${config.spacing}px`,
            backgroundColor: theme.background.secondary,
            border: `1px solid ${theme.border.default}`,
            borderRadius: '4px',
            overflow: 'auto',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontSize: `${config.codeSize}px`,
            lineHeight: 1.5,
            color: theme.text.primary,
          }}>
            <code>{node.code}</code>
          </pre>
        );
      }

      case 'unordered_list':
        return (
          <ul key={key} style={{
            margin: 0,
            marginBottom: spacing,
            paddingLeft: `${config.spacing * 2}px`,
            color: theme.text.primary,
          }}>
            {renderListItems(node.items, key)}
          </ul>
        );

      case 'ordered_list':
        return (
          <ol key={key} start={node.start} style={{
            margin: 0,
            marginBottom: spacing,
            paddingLeft: `${config.spacing * 2}px`,
            color: theme.text.primary,
          }}>
            {renderListItems(node.items, key)}
          </ol>
        );

      case 'horizontal_rule':
        return (
          <hr key={key} style={{
            border: 'none',
            borderTop: `1px solid ${theme.border.divider}`,
            margin: `${config.spacing * 1.5}px 0`,
          }} />
        );

      case 'table':
        return (
          <div key={key} style={{ marginBottom: spacing, overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: `${config.fontSize}px`,
              color: theme.text.primary,
            }}>
              <thead>
                <tr>
                  {node.headers.map((header, hi) => (
                    <th key={`${key}-th-${hi}`} style={{
                      padding: `${config.spacing / 2}px ${config.spacing}px`,
                      borderBottom: `2px solid ${theme.border.default}`,
                      textAlign: 'left',
                      fontWeight: 600,
                      backgroundColor: theme.background.tertiary,
                      // First column sizes to its content (keys/names don't wrap); later columns wrap + fill.
                      whiteSpace: hi === 0 ? 'nowrap' : undefined,
                      width: hi === 0 ? '1%' : undefined,
                    }}>
                      {renderInline(header, `${key}-th-${hi}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {node.rows.map((row, ri) => (
                  <tr key={`${key}-tr-${ri}`}>
                    {row.map((cell, ci) => (
                      <td key={`${key}-td-${ri}-${ci}`} style={{
                        padding: `${config.spacing / 2}px ${config.spacing}px`,
                        borderBottom: `1px solid ${theme.border.divider}`,
                        whiteSpace: ci === 0 ? 'nowrap' : undefined,
                        width: ci === 0 ? '1%' : undefined,
                      }}>
                        {renderInline(cell, `${key}-td-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        fontSize: `${config.fontSize}px`,
        lineHeight: config.lineHeight,
        color: theme.text.primary,
        wordBreak: 'break-word',
        ...style,
      }}
      className={className}
    >
      {ast.map((node, i) => renderBlock(node, i))}
      {imageLightbox && lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};
