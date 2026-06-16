#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

echo "=== @ekko/react-dom build ==="
echo "Faithful ESM mirror of npm 'react-dom' (+/client +/server), @ekko/ prefix. It does NOT bundle its"
echo "own react: 'react' is aliased to a shim that re-exports the EXTERNAL @ekko/react, so react-dom shares"
echo "the SAME React instance as the app (one hooks dispatcher). The /server entry registers React's"
echo "renderToString with ekko:ssr on import (activates SSR with React). Only run when upgrading React."
echo ""

if ! command -v npm &>/dev/null; then echo "ERROR: npm required."; exit 1; fi

echo "[1/4] Installing react-dom 19 from npm..."
npm install --silent

echo "[2/4] Generating shim + entries..."
mkdir -p entry _shim
# Shim: turns react-dom's internal require("react") into an ESM import of the EXTERNAL @ekko/react
# (esbuild's plain --external:react would emit __require("react"), which EkkoJS's ESM runtime can't run).
cat > _shim/react.mjs << 'SHIM'
export * from "@ekko/react";
import * as R from "@ekko/react";
export default R;
SHIM
# MessageChannel no-op shim (side-effect import, FIRST — ES imports hoist) so the sync server renderer
# loads where MessageChannel is absent (ekko server); the browser provides a real one (||= no-op there).
cat > entry/mc-shim.mjs << 'MC'
if(typeof globalThis.MessageChannel==="undefined"){globalThis.MessageChannel=class{constructor(){const n=()=>{};const p=()=>({postMessage:n,close:n,onmessage:null,addEventListener:n,removeEventListener:n,start:n});this.port1=p();this.port2=p();}};}
MC

# Introspect each react-dom entrypoint for 1:1 parity. /server mirrors the BROWSER build (server.browser).
node -e '
  const fs = require("fs");
  function names(mod, must) {
    const M = require(mod);
    const ns = Object.keys(M).filter(k => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) && !k.startsWith("__"));
    if (!ns.includes(must)) { console.error(mod + " introspection failed (no " + must + ")"); process.exit(1); }
    return ns;
  }
  const root = names("react-dom", "createPortal");
  const client = names("react-dom/client", "createRoot");
  const server = names("react-dom/server.browser", "renderToString");

  fs.writeFileSync("entry/react-dom.mjs",
    "import \"./mc-shim.mjs\";\nimport * as M from \"react-dom\";\n" +
    "const { " + root.join(", ") + " } = M;\nexport { " + root.join(", ") + " };\nexport default M;\n");
  fs.writeFileSync("entry/client.mjs",
    "import \"./mc-shim.mjs\";\nimport * as M from \"react-dom/client\";\n" +
    "const { " + client.join(", ") + " } = M;\nexport { " + client.join(", ") + " };\n");
  // /server: parity exports + register the renderer with ekko:ssr (renderToString + createElement,
  // both from the SAME shared React, so rune SSR runs component hooks correctly).
  fs.writeFileSync("entry/server.mjs",
    "import \"./mc-shim.mjs\";\nimport * as M from \"react-dom/server.browser\";\n" +
    "import { createElement } from \"@ekko/react\";\nimport { registerRenderer } from \"ekko:ssr\";\n" +
    "const { " + server.join(", ") + " } = M;\nexport { " + server.join(", ") + " };\n" +
    "registerRenderer({ renderToString: renderToString, createElement: createElement });\n");
  console.log("  react-dom("+root.length+") /client("+client.length+") /server("+server.length+")");
'

echo "[3/4] Bundling (react → shim → external @ekko/react; ekko:ssr external)..."
ESBUILD="npx --yes esbuild"
mkdir -p src
COMMON="--bundle --format=esm --platform=browser --alias:react=./_shim/react.mjs --external:@ekko/react --define:process.env.NODE_ENV=\"production\" --minify"
$ESBUILD entry/react-dom.mjs $COMMON --outfile=src/react-dom.js
$ESBUILD entry/client.mjs    $COMMON --outfile=src/client.js
$ESBUILD entry/server.mjs    $COMMON --external:ekko:ssr --outfile=src/server.js

echo "[4/4] Done."
ls -lh src/
echo "Pack: ekko pack && ekko ekl inspect dist/*.ekl"
