# @ekko/react

React 19 for EkkoJS. The same component model, hooks, and context you already use, ready to build
interfaces for your EkkoJS apps and `ekko:rune` sites.

## Install

```bash
ekko add @ekko/react
```

## Use it

```tsx
import { useState } from "@ekko/react";

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Clicked {n} times</button>;
}
```

Pair it with [`@ekko/react-dom`](https://bifrost.ekkojs.com/package/ekko--react-dom) to render on the
server and hydrate in the browser, and [`@ekko/asgard`](https://bifrost.ekkojs.com/package/ekko--asgard)
for a ready-made component library.
