// ============================================================================
// Monarch Tokenizer Engine
// Compatible with Monaco Editor's Monarch language definition format
// ============================================================================

import type { MonarchLanguage, MonarchRule, MonarchAction, SyntaxToken, TokenizedLine } from './types';

/**
 * Converts a Monarch regex (string or RegExp) to a usable RegExp.
 * Handles @keywords, @typeKeywords, @operators, @builtins expansions
 * and the @escapes / @digits / @symbols references.
 */
function compileRegex(
  pattern: RegExp | string,
  language: MonarchLanguage
): RegExp {
  // `@attr` references are expanded for BOTH string and RegExp patterns: Monaco grammars write them as
  // RegExp literals (e.g. `/@symbols/`, `/@controlKeywords/`) just as often as strings.
  const src = expandAttrs(pattern instanceof RegExp ? pattern.source : pattern, language);
  const flags = language.ignoreCase ? 'i' : '';
  return new RegExp('^(?:' + src + ')', flags);
}

/**
 * Expands `@attr` references against ANY top-level language attribute (not just the well-known
 * keywords/operators/escapes lists): a string[] attr → an escaped alternation, a RegExp attr → its
 * source. Longest names first so `@keywords` is not partially eaten by a shorter `@key`. (asgard 1.0.4)
 */
function expandAttrs(src: string, language: MonarchLanguage): string {
  // Skip attributes that are NOT regex sources, so `@defaultToken`/`@tokenPostfix` are never inlined.
  const skip = new Set(['tokenizer', 'defaultToken', 'tokenPostfix', 'brackets', 'start', 'ignoreCase', 'unicode']);
  const attrs = Object.keys(language as unknown as Record<string, unknown>)
    .filter((k) => !skip.has(k))
    .sort((a, b) => b.length - a.length); // longest first so `@identifier` isn't eaten by `@id`
  // Loop until stable: a list/regex/string attr may itself reference another `@attr` (Monaco resolves
  // these recursively, e.g. scss `identifier` → `nonascii`). Bounded to avoid a pathological cycle.
  for (let pass = 0; pass < 6 && src.indexOf('@') >= 0; pass++) {
    let changed = false;
    for (const attr of attrs) {
      const placeholder = '@' + attr;
      if (!src.includes(placeholder)) continue;
      const val = (language as unknown as Record<string, unknown>)[attr];
      let replacement: string | undefined;
      if (Array.isArray(val)) {
        if (val.length === 0) continue;
        replacement = '(?:' + val.map((v) => escapeRegex(String(v))).join('|') + ')';
      } else if (val instanceof RegExp) {
        replacement = '(?:' + val.source + ')';
      } else if (typeof val === 'string') {
        replacement = '(?:' + val + ')';   // a regex-source fragment (e.g. scss `ws`, `identifier`)
      }
      if (replacement !== undefined) { src = src.split(placeholder).join(replacement); changed = true; }
    }
    if (!changed) break;
  }
  return src;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A rule action as authored: a token string, a full action, or one action per capture group. */
type RuleAction = string | MonarchAction | (string | MonarchAction)[];

/**
 * Compiled rule for efficient matching. The action is kept in its RAW form (not pre-resolved) because
 * `cases` and capture-group arrays are resolved against the actual match at tokenize time. A trailing
 * 3rd tuple element (nextState) is folded onto the action.
 */
interface CompiledRule {
  regex: RegExp;
  action: RuleAction;
  /** nextState from the 3-tuple form, applied after the action's own next/switchTo. */
  tupleNext?: string;
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
      // Monaco writes includes as `{ include: '@whitespace' }`; the state is keyed without the `@`.
      const inc = rule.include.startsWith('@') ? rule.include.slice(1) : rule.include;
      const included = compileState(inc, language, cache, visited);
      compiled.push(...included);
      continue;
    }

    const monarchRule = rule as Exclude<MonarchRule, { include: string }>;
    const [pattern, actionRaw] = monarchRule;
    const tupleNext = monarchRule.length === 3 ? (monarchRule as [unknown, unknown, string])[2] : undefined;
    const regex = compileRegex(pattern, language);

    compiled.push({ regex, action: actionRaw as RuleAction, tupleNext });
  }

  cache.set(stateName, compiled);
  return compiled;
}

/**
 * Resolves a Monarch `cases` map against the matched text, returning the selected token string or action.
 * Guards (first match wins): `@default` (always), `@eos` (empty text), `@<attr>` (membership in the
 * language list `<attr>`, e.g. `@keywords`), `~regex` / `!~regex` (regex match / non-match), or a literal
 * (exact string equality). Falls back to the default token if nothing matches.
 */
function resolveCases(
  cases: Record<string, string | MonarchAction>,
  text: string,
  language: MonarchLanguage
): string | MonarchAction {
  for (const guard of Object.keys(cases)) {
    const act = cases[guard];
    if (guard === '@default' || guard === '@DEFAULT' || guard === 'default') return act;
    if (guard === '@eos') { if (text.length === 0) return act; continue; }
    if (guard.startsWith('!~')) {
      try { if (!new RegExp('^(?:' + guard.slice(2) + ')$', language.ignoreCase ? 'i' : '').test(text)) return act; } catch { /* bad guard */ }
      continue;
    }
    if (guard.startsWith('~')) {
      try { if (new RegExp('^(?:' + guard.slice(1) + ')$', language.ignoreCase ? 'i' : '').test(text)) return act; } catch { /* bad guard */ }
      continue;
    }
    if (guard.startsWith('@')) {
      const list = (language as unknown as Record<string, unknown>)[guard.slice(1)];
      if (Array.isArray(list)) {
        const hit = language.ignoreCase
          ? list.some((w) => String(w).toLowerCase() === text.toLowerCase())
          : list.includes(text);
        if (hit) return act;
      }
      continue;
    }
    if (guard === text) return act;
  }
  return { token: language.defaultToken || 'source' };
}

/** Resolves the `@brackets` token to the language's bracket-table token for `text`, else a default. */
function bracketToken(text: string, language: MonarchLanguage): string {
  const b = language.brackets?.find((e) => e.open === text || e.close === text);
  return b ? b.token : 'delimiter.bracket';
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

  if (next === '@popall') {
    return ['root'];
  }

  // Direct state name (strip leading @ if present)
  const stateName = next.startsWith('@') ? next.slice(1) : next;
  return [...stateStack, stateName];
}

/** Replaces the top of the state stack (Monarch `switchTo`). */
function switchTop(stateStack: string[], target: string): string[] {
  const name = target.startsWith('@') ? target.slice(1) : target;
  return [...stateStack.slice(0, -1), name];
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
    // Monaco state parameterization: a pushed state may carry a `.arg` suffix (e.g.
    // `phpInSimpleState.root`) where the base state holds the rules and the arg drives `$S2` guards. We
    // resolve rules by the base name when the exact (parameterized) name has no state of its own.
    const rules = compiled.states.get(currentState)
      || (currentState.includes('.') ? compiled.states.get(currentState.split('.')[0]) : undefined)
      || [];
    const remaining = line.slice(pos);
    let matched = false;

    for (const rule of rules) {
      const match = remaining.match(rule.regex);
      if (!match) continue;
      const fullText = match[0];           // may be zero-width (e.g. a lookahead feeding @rematch)
      const lang = compiled.language;

      // Resolve the (possibly guarded / per-group) action into emitted tokens + a state directive.
      let directive: { next?: string; switchTo?: string } | undefined;
      let goBack = 0;
      let rematch = false;

      const applySingle = (raw: string | MonarchAction | undefined, text: string) => {
        // A missing/embedded action (e.g. `nextEmbedded` rules, or a rule with fewer actions than capture
        // groups) must degrade to the default token, never crash the tokenizer.
        if (raw == null) { if (text.length > 0) tokens.push({ text, type: lang.defaultToken || 'source' }); return; }
        let act: MonarchAction = typeof raw === 'string' ? { token: raw } : raw;
        if (act.cases) {
          const chosen = resolveCases(act.cases, text, lang);
          act = typeof chosen === 'string' ? { token: chosen } : { ...act, cases: undefined, ...chosen };
        }
        if (act.next || act.switchTo) directive = { next: act.next, switchTo: act.switchTo };
        if (act.goBack) goBack = act.goBack;
        let tok = act.token ?? (lang.defaultToken || 'source');
        if (tok === '@rematch') { rematch = true; return; }
        if (tok === '@brackets') tok = bracketToken(text, lang);
        // Monaco token-name substitutions: `$0` = the matched text, `$1..$9` = the rule's capture groups,
        // `$S0..` = state names (not meaningful for a flat token name → stripped). So `keyword.$0` on a
        // match of `func` becomes `keyword.func` (the theme prefix-resolves it back to the keyword color).
        if (tok.indexOf('$') >= 0) {
          tok = tok
            .replace(/\$S\d+/g, '')
            .replace(/\$(\d)/g, (_m, d) => (d === '0' ? text : (match[Number(d)] ?? '')));
        }
        if (text.length > 0) tokens.push({ text, type: tok });
      };

      if (Array.isArray(rule.action)) {
        // One action per capture group: element i ↦ match[i+1].
        for (let i = 0; i < rule.action.length; i++) {
          const g = match[i + 1];
          if (g === undefined || g === '') continue;
          applySingle(rule.action[i], g);
        }
      } else {
        applySingle(rule.action, fullText);
      }

      // A 3-tuple nextState applies only if the action itself set no transition.
      if (!directive && rule.tupleNext) directive = { next: rule.tupleNext };

      // Zero-width match that neither re-matches nor changes state would consume nothing and loop
      // forever — reject it and let a later rule (or the default-char fallback) make progress.
      if (fullText.length === 0 && !rematch && !directive) continue;

      if (rematch) {
        // @rematch: change state but consume nothing, then re-try from the same position.
        if (directive?.switchTo) stateStack = switchTop(stateStack, directive.switchTo);
        else if (directive?.next) stateStack = resolveNextState(directive.next, stateStack);
        matched = true;
        break;
      }

      pos += fullText.length;
      if (goBack) pos -= goBack;

      if (directive?.switchTo) stateStack = switchTop(stateStack, directive.switchTo);
      else if (directive?.next) stateStack = resolveNextState(directive.next, stateStack);
      matched = true;
      break;
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
