#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

echo "=== @ekko/react build ==="
echo "Faithful ESM mirror of npm 'react' (same exports, @ekko/ prefix) — PURE react, no react-dom."
echo "Exports react's public surface PLUS the internals object react-dom needs to share the hooks"
echo "dispatcher (__CLIENT_INTERNALS...). On import, registers React with ekko:jsx-runtime so JSX"
echo "produces React elements. react-dom (incl. SSR renderToString) lives in @ekko/react-dom and shares"
echo "THIS instance via the module cache. Only run when upgrading React version."
echo ""

if ! command -v npm &>/dev/null; then
  echo "ERROR: npm required. Install Node.js first."
  exit 1
fi

echo "[1/3] Installing React 19 from npm..."
npm install --silent

echo "[2/3] Generating entry (full react surface + internals export; register the JSX factory)..."
mkdir -p entry
# Introspect react's exports → explicit namespace destructure (esbuild drops `export *` of a CJS module).
# Keep the ONE __-prefixed export react-dom needs to share the dispatcher: __CLIENT_INTERNALS...
node -e '
  const R = require("react");
  const names = Object.keys(R).filter(k =>
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) &&
    (!k.startsWith("__") || k.startsWith("__CLIENT_INTERNALS")));
  if (!names.includes("useState") || !names.includes("__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE")) {
    console.error("react introspection failed (missing useState or internals)"); process.exit(1);
  }
  const src =
      "import * as React from \"react\";\n"
    + "import { jsx, jsxs } from \"react/jsx-runtime\";\n"
    + "import { registerReact } from \"ekko:jsx-runtime\";\n"
    + "const { " + names.join(", ") + " } = React;\n"
    + "export { " + names.join(", ") + ", jsx, jsxs };\n"
    + "export default React;\n"
    // JSX factory → React elements (no global _jsx; the scoped ekko:jsx-runtime delegates here).
    + "registerReact({ createElement: React.createElement, Fragment: React.Fragment });\n";
  require("fs").writeFileSync("entry/react.mjs", src);
  console.log("  react exports (" + names.length + ", incl. internals): " + names.join(" "));
'

cat > entry/jsx-runtime.mjs << 'ENTRY'
import{jsx,jsxs,Fragment}from"./react.js";export{jsx,jsxs,Fragment};
ENTRY

echo "[3/3] Bundling CJS → ESM with esbuild (ekko:jsx-runtime external — resolved by the runtime)..."
ESBUILD="npx --yes esbuild"
mkdir -p src
$ESBUILD entry/react.mjs --bundle --format=esm --platform=neutral --external:ekko:jsx-runtime \
  --define:process.env.NODE_ENV=\"production\" --minify --outfile=src/react.js
cp entry/jsx-runtime.mjs src/jsx-runtime.js
rm -f src/server.js src/client.js src/framework.js   # @ekko/react is PURE react now

echo "Done."
ls -lh src/
echo "Verify: node --input-type=module -e \"import('./src/react.js')\"  (note: imports ekko:jsx-runtime → only resolves under ekko)"
