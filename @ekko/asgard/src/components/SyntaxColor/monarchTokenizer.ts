// ============================================================================
// Monarch Tokenizer Engine
// Compatible with Monaco Editor's Monarch language definition format
// ============================================================================

import type { MonarchLanguage, MonarchRule, MonarchAction, SyntaxToken, TokenizedLine } from './types';

/**
 * Resolves a rule's action to a normalized MonarchAction.
 */
function resolveAction(action: string | MonarchAction): MonarchAction {
  if (typeof action === 'string') {
    return { token: action };
  }
  return action;
}

/**
 * Converts a Monarch regex (string or RegExp) to a usable RegExp.
 * Handles @keywords, @typeKeywords, @operators, @builtins expansions
 * and the @escapes / @digits / @symbols references.
 */
function compileRegex(
  pattern: RegExp | string,
  language: MonarchLanguage
): RegExp {
  if (pattern instanceof RegExp) {
    // Ensure the regex is anchored to start and uses sticky if possible
    const src = pattern.source;
    const flags = language.ignoreCase ? 'i' : '';
    return new RegExp('^(?:' + src + ')', flags);
  }

  let src = pattern;

  // Replace @keywords etc. with alternation groups
  const listReplacements: Record<string, string[] | undefined> = {
    '@keywords': language.keywords,
    '@typeKeywords': language.typeKeywords,
    '@operators': language.operators,
    '@builtins': language.builtins,
  };

  for (const [placeholder, list] of Object.entries(listReplacements)) {
    if (src.includes(placeholder) && list && list.length > 0) {
      const escaped = list.map(escapeRegex).join('|');
      src = src.replace(placeholder, '(?:' + escaped + ')');
    }
  }

  // Replace @escapes, @digits, @symbols with their regex sources
  const regexReplacements: Record<string, RegExp | undefined> = {
    '@escapes': language.escapes,
    '@digits': language.digits,
    '@symbols': language.symbols,
  };

  for (const [placeholder, regex] of Object.entries(regexReplacements)) {
    if (src.includes(placeholder) && regex) {
      src = src.replace(placeholder, '(?:' + regex.source + ')');
    }
  }

  const flags = language.ignoreCase ? 'i' : '';
  return new RegExp('^(?:' + src + ')', flags);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compiled rule for efficient matching.
 */
interface CompiledRule {
  regex: RegExp;
  action: MonarchAction;
  nextState?: string;
}

/**
 * Compiles all rules for a given state, resolving includes.
 */
function compileState(
  stateName: string,
  language: MonarchLanguage,
  cache: Map<string, CompiledRule[]>,
  visited: Set<string>
): CompiledRule[] {
  if (cache.has(stateName)) {
    return cache.get(stateName)!;
  }

  if (visited.has(stateName)) {
    return []; // circular include guard
  }
  visited.add(stateName);

  const rawRules = language.tokenizer[stateName];
  if (!rawRules) {
    return [];
  }

  const compiled: CompiledRule[] = [];

  for (const rule of rawRules) {
    if ('include' in rule) {
      const included = compileState(rule.include, language, cache, visited);
      compiled.push(...included);
      continue;
    }

    const monarchRule = rule as Exclude<MonarchRule, { include: string }>;
    const [pattern, actionRaw] = monarchRule;
    const nextState = monarchRule.length === 3 ? (monarchRule as [RegExp | string, string | MonarchAction, string])[2] : undefined;
    const action = resolveAction(actionRaw);
    const regex = compileRegex(pattern, language);

    compiled.push({
      regex,
      action: nextState ? { ...action, next: nextState } : action,
      nextState: nextState || action.next,
    });
  }

  cache.set(stateName, compiled);
  return compiled;
}

/**
 * Compiled language with pre-processed rules.
 */
export interface CompiledLanguage {
  language: MonarchLanguage;
  states: Map<string, CompiledRule[]>;
}

/**
 * Pre-compiles a Monarch language definition for efficient tokenization.
 */
export function compileLanguage(language: MonarchLanguage): CompiledLanguage {
  const states = new Map<string, CompiledRule[]>();
  const visited = new Set<string>();

  for (const stateName of Object.keys(language.tokenizer)) {
    compileState(stateName, language, states, visited);
  }

  return { language, states };
}

/**
 * Resolves a next-state string.
 * Handles special values: '@pop', '@push', and direct state names.
 */
function resolveNextState(
  next: string | undefined,
  stateStack: string[]
): string[] {
  if (!next) return stateStack;

  if (next === '@pop') {
    if (stateStack.length > 1) {
      return stateStack.slice(0, -1);
    }
    return stateStack;
  }

  if (next === '@push') {
    return [...stateStack, stateStack[stateStack.length - 1]];
  }

  // Direct state name (strip leading @ if present)
  const stateName = next.startsWith('@') ? next.slice(1) : next;
  return [...stateStack, stateName];
}

/**
 * Tokenizes a single line of text given the current state stack.
 * Returns the tokens and the resulting state stack for the next line.
 */
function tokenizeLine(
  line: string,
  stateStack: string[],
  compiled: CompiledLanguage
): { tokens: SyntaxToken[]; endState: string[] } {
  const tokens: SyntaxToken[] = [];
  let pos = 0;
  const maxIterations = line.length * 3 + 10; // safety guard (3x for @rematch re-tries)
  let iterations = 0;

  while (pos < line.length && iterations < maxIterations) {
    iterations++;
    const currentState = stateStack[stateStack.length - 1];
    const rules = compiled.states.get(currentState) || [];
    const remaining = line.slice(pos);
    let matched = false;

    for (const rule of rules) {
      const match = remaining.match(rule.regex);
      if (match && match[0].length > 0) {
        // Handle @rematch: don't consume text, just switch state and re-try
        if (rule.action.token === '@rematch') {
          if (rule.action.switchTo) {
            const targetState = rule.action.switchTo.startsWith('@')
              ? rule.action.switchTo.slice(1)
              : rule.action.switchTo;
            // switchTo replaces the top of the stack (unlike next which pushes)
            stateStack = [...stateStack.slice(0, -1), targetState];
          } else if (rule.nextState) {
            stateStack = resolveNextState(rule.nextState, stateStack);
          }
          matched = true;
          break;
        }

        tokens.push({
          text: match[0],
          type: rule.action.token,
        });
        pos += match[0].length;

        if (rule.action.goBack) {
          pos -= rule.action.goBack;
        }

        // Handle switchTo (replaces top of stack) vs next (pushes)
        if (rule.action.switchTo) {
          const targetState = rule.action.switchTo.startsWith('@')
            ? rule.action.switchTo.slice(1)
            : rule.action.switchTo;
          stateStack = [...stateStack.slice(0, -1), targetState];
        } else {
          stateStack = resolveNextState(rule.nextState, stateStack);
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No rule matched — consume one character as default token
      const defaultToken = compiled.language.defaultToken || 'source';
      // Merge with previous token if same type
      if (tokens.length > 0 && tokens[tokens.length - 1].type === defaultToken) {
        tokens[tokens.length - 1].text += line[pos];
      } else {
        tokens.push({ text: line[pos], type: defaultToken });
      }
      pos++;
    }
  }

  // If line is empty, produce a single empty token
  if (tokens.length === 0) {
    tokens.push({ text: '', type: compiled.language.defaultToken || 'source' });
  }

  return { tokens, endState: [...stateStack] };
}

/**
 * Tokenizes an entire source string into lines of tokens.
 * This is the main entry point for syntax highlighting.
 */
export function tokenize(
  code: string,
  compiled: CompiledLanguage,
  startLineNumber: number = 1
): TokenizedLine[] {
  const lines = code.split('\n');
  const result: TokenizedLine[] = [];
  let stateStack = ['root'];

  for (let i = 0; i < lines.length; i++) {
    const { tokens, endState } = tokenizeLine(lines[i], stateStack, compiled);
    result.push({
      lineNumber: startLineNumber + i,
      tokens,
      text: lines[i],
    });
    stateStack = endState;
  }

  return result;
}

/**
 * Merges adjacent tokens of the same type for cleaner output.
 */
export function mergeAdjacentTokens(tokens: SyntaxToken[]): SyntaxToken[] {
  if (tokens.length === 0) return tokens;

  const merged: SyntaxToken[] = [{ ...tokens[0] }];
  for (let i = 1; i < tokens.length; i++) {
    const prev = merged[merged.length - 1];
    if (prev.type === tokens[i].type) {
      prev.text += tokens[i].text;
    } else {
      merged.push({ ...tokens[i] });
    }
  }
  return merged;
}
