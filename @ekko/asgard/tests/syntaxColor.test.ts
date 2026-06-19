// asgard SyntaxColor tokenizer + grammars (asgard 1.0.4).
// Covers the Monaco-compatibility upgrade (cases, capture-group arrays, @brackets, state transitions,
// generic @attr expansion, @rematch) and smoke-tests every bundled Monarch grammar.
import { test, expect } from "ekko:test";
import { compileLanguage, tokenize } from "../src/components/SyntaxColor/monarchTokenizer";
import type { MonarchLanguage } from "../src/components/SyntaxColor/types";
import {
  typescriptLanguage, javascriptLanguage, jsonLanguage, cssLanguage, scssLanguage, lessLanguage,
  htmlLanguage, xmlLanguage, pythonLanguage, markdownLanguage, rustLanguage, goLanguage, cppLanguage,
  csharpLanguage, javaLanguage, kotlinLanguage, swiftLanguage, rubyLanguage, phpLanguage, sqlLanguage,
  yamlLanguage, shellLanguage, dockerfileLanguage, graphqlLanguage,
} from "../src/components/SyntaxColor/languages";

// Flatten a tokenized source into [{text,type}], dropping empty tokens.
function toks(lang: MonarchLanguage, code: string): { text: string; type: string }[] {
  const compiled = compileLanguage(lang);
  const out: { text: string; type: string }[] = [];
  for (const line of tokenize(code, compiled)) {
    for (const t of line.tokens) if (t.text.length) out.push({ text: t.text, type: t.type });
  }
  return out;
}
const typeOf = (lang: MonarchLanguage, code: string, text: string) =>
  toks(lang, code).find((t) => t.text === text)?.type;
const hasType = (lang: MonarchLanguage, code: string, type: string) =>
  toks(lang, code).some((t) => t.type === type);
// Prefix-aware: a dotted token like `keyword.func` resolves to the `keyword` color in the theme, so a
// grammar "colors keywords" if any token's type is `keyword` or starts with `keyword.`.
const colorsAs = (lang: MonarchLanguage, code: string, prefix: string) =>
  toks(lang, code).some((t) => t.type === prefix || t.type.startsWith(prefix + "."));

// ── tokenizer: cases ────────────────────────────────────────────────────────
test("cases: @keywords → keyword, @default → identifier", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    keywords: ["if", "else"],
    tokenizer: { root: [
      [/\s+/, "white"],
      [/[a-z]+/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
    ] },
  };
  expect(typeOf(g, "if foo", "if")).toBe("keyword");
  expect(typeOf(g, "if foo", "foo")).toBe("identifier");
});

test("cases: literal-equality and ~regex guards", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    tokenizer: { root: [
      [/\s+/, "white"],
      [/[a-zA-Z0-9]+/, { cases: { "true": "keyword", "~[0-9]+": "number", "@default": "identifier" } }],
    ] },
  };
  expect(typeOf(g, "true x 42", "true")).toBe("keyword");
  expect(typeOf(g, "true x 42", "42")).toBe("number");
  expect(typeOf(g, "true x 42", "x")).toBe("identifier");
});

// ── tokenizer: capture-group array actions ───────────────────────────────────
test("array action assigns one token per capture group", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    tokenizer: { root: [ [/(\d+)(px|em)/, ["number", "type"]] ] },
  };
  const t = toks(g, "10px");
  expect(t[0]).toEqual({ text: "10", type: "number" });
  expect(t[1]).toEqual({ text: "px", type: "type" });
});

// ── tokenizer: @brackets ─────────────────────────────────────────────────────
test("@brackets resolves the token from the brackets table", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    brackets: [{ open: "{", close: "}", token: "delimiter.curly" }],
    tokenizer: { root: [ [/[{}]/, "@brackets"] ] },
  };
  expect(typeOf(g, "{}", "{")).toBe("delimiter.curly");
  expect(typeOf(g, "{}", "}")).toBe("delimiter.curly");
});

// ── tokenizer: state transitions (next / pop / switchTo / popall) + include ──
test("state push/pop via next and @pop", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    tokenizer: {
      root: [ [/"/, "string", "@str"], [/\w+/, "identifier"] ],
      str: [ [/[^"]+/, "string"], [/"/, "string", "@pop"] ],
    },
  };
  const t = toks(g, 'a "hello" b');
  expect(typeOf(g, 'a "hello" b', "hello")).toBe("string");
  expect(typeOf(g, 'a "hello" b', "b")).toBe("identifier"); // popped back to root
});

test("switchTo replaces the top state", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    tokenizer: {
      root: [ [/A/, "keyword", "@s1"], [/Z/, "identifier"] ],
      s1: [ [/B/, { token: "type", switchTo: "@s2" }], [/x/, "identifier"] ],
      s2: [ [/C/, "number"] ],
    },
  };
  // A pushes s1; B (in s1) switches top to s2; C is a number (only defined in s2)
  expect(typeOf(g, "ABC", "C")).toBe("number");
});

test("@popall resets the stack to root", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    tokenizer: {
      root: [ [/A/, "keyword", "@s1"], [/Z/, "identifier"] ],
      s1: [ [/B/, "type", "@s2"], [/!/, { token: "operator", next: "@popall" }] ],
      s2: [ [/!/, { token: "operator", next: "@popall" }], [/C/, "number"] ],
    },
  };
  // A→push s1, B→push s2, C number in s2, ! pops all to root, Z identifier back in root
  const flat = toks(g, "ABC!Z").map((x) => x.type);
  expect(flat).toEqual(["keyword", "type", "number", "operator", "identifier"]);
});

test("include pulls rules from another state", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    tokenizer: {
      root: [ { include: "@common" }, [/\w+/, "identifier"] ],
      common: [ [/\s+/, "white"], [/\d+/, "number"] ],
    },
  };
  expect(typeOf(g, "x 12", "12")).toBe("number");
});

// ── tokenizer: generic @attr expansion inside a regex ────────────────────────
test("regex @attr expands against arbitrary language lists", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    controlKeywords: ["return", "yield"],
    tokenizer: { root: [ [/@controlKeywords/, "keyword"], [/\w+/, "identifier"] ] },
  };
  expect(typeOf(g, "return x", "return")).toBe("keyword");
  expect(typeOf(g, "return x", "x")).toBe("identifier");
});

// ── tokenizer: @rematch does not loop / consumes correctly ───────────────────
test("@rematch switches state without consuming and still terminates", () => {
  const g: MonarchLanguage = {
    defaultToken: "source",
    tokenizer: {
      root: [ [/(?=[A-Z])/, { token: "@rematch", next: "@upper" }], [/\w+/, "identifier"] ],
      upper: [ [/[A-Z]\w*/, "type", "@pop"] ],
    },
  };
  expect(typeOf(g, "Foo", "Foo")).toBe("type");
});

// ── grammar smoke tests: each tokenizes a real sample + colors a key construct ─
test("typescript/javascript color keywords + strings", () => {
  expect(colorsAs(typescriptLanguage, `const x: number = 1;`, "keyword")).toBe(true);
  expect(colorsAs(javascriptLanguage, `function f(){ return "hi"; }`, "string")).toBe(true);
});

test("rust colors keywords", () => {
  expect(colorsAs(rustLanguage, `fn main() { let x = 1; }`, "keyword")).toBe(true);
});
test("go colors keywords", () => {
  expect(colorsAs(goLanguage, `func main() { var x = 1 }`, "keyword")).toBe(true);
});
test("c++ colors keywords", () => {
  expect(colorsAs(cppLanguage, `int main() { return 0; }`, "keyword")).toBe(true);
});
test("c# colors keywords", () => {
  expect(colorsAs(csharpLanguage, `public class A { void M() {} }`, "keyword")).toBe(true);
});
test("java colors keywords", () => {
  expect(colorsAs(javaLanguage, `public class A { int x; }`, "keyword")).toBe(true);
});
test("kotlin colors keywords", () => {
  expect(colorsAs(kotlinLanguage, `fun main() { val x = 1 }`, "keyword")).toBe(true);
});
test("swift colors keywords", () => {
  expect(colorsAs(swiftLanguage, `func main() { let x = 1 }`, "keyword")).toBe(true);
});
test("ruby colors keywords", () => {
  expect(colorsAs(rubyLanguage, `def hi\n  puts "x"\nend`, "keyword")).toBe(true);
});
test("php colors content", () => {
  expect(toks(phpLanguage, `<?php function f() { return 1; } ?>`).length > 1).toBe(true);
});
test("sql colors keywords", () => {
  expect(colorsAs(sqlLanguage, `SELECT id FROM users WHERE id = 1`, "keyword")).toBe(true);
});
test("scss colors variables + nesting", () => {
  expect(colorsAs(scssLanguage, `$c: red; .a { color: $c; &:hover { x: 1; } }`, "variable")).toBe(true);
});
test("less tokenizes", () => {
  expect(toks(lessLanguage, `@c: red; .a { color: @c; }`).length > 1).toBe(true);
});
test("css colors", () => {
  expect(toks(cssLanguage, `.a { color: red; }`).length > 1).toBe(true);
});
test("yaml tokenizes", () => {
  expect(toks(yamlLanguage, `name: ekko\nlist:\n  - a\n  - b`).length > 1).toBe(true);
});
test("shell tokenizes", () => {
  expect(toks(shellLanguage, `echo "hi" | grep x`).length > 1).toBe(true);
});
test("dockerfile colors keywords", () => {
  expect(colorsAs(dockerfileLanguage, `FROM node:20\nRUN echo hi`, "keyword")).toBe(true);
});
test("graphql tokenizes", () => {
  expect(toks(graphqlLanguage, `type Query { user(id: ID!): User }`).length > 1).toBe(true);
});
test("json colors strings", () => {
  expect(colorsAs(jsonLanguage, `{ "a": 1, "b": "x" }`, "string")).toBe(true);
});
test("html/xml tokenize tags", () => {
  expect(toks(htmlLanguage, `<div class="x">hi</div>`).length > 1).toBe(true);
  expect(toks(xmlLanguage, `<root><child/></root>`).length > 1).toBe(true);
});
test("python colors keywords", () => {
  expect(colorsAs(pythonLanguage, `def f():\n    return 1`, "keyword")).toBe(true);
});
test("markdown tokenizes", () => {
  expect(toks(markdownLanguage, `# Title\n\n**bold** text`).length > 1).toBe(true);
});

// every grammar must tokenize a generic snippet without throwing (no infinite loop / crash)
test("all grammars tokenize arbitrary text without throwing", () => {
  const all = [typescriptLanguage, javascriptLanguage, jsonLanguage, cssLanguage, scssLanguage,
    lessLanguage, htmlLanguage, xmlLanguage, pythonLanguage, markdownLanguage, rustLanguage, goLanguage,
    cppLanguage, csharpLanguage, javaLanguage, kotlinLanguage, swiftLanguage, rubyLanguage, phpLanguage,
    sqlLanguage, yamlLanguage, shellLanguage, dockerfileLanguage, graphqlLanguage];
  const sample = `{ "x": [1, 2.5, true], <a b='c'> /* 注释 */ \t\n weird $#@! }`;
  for (const lang of all) {
    expect(() => toks(lang, sample)).not.toThrow();
  }
});
