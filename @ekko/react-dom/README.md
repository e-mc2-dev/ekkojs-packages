# @ekko/react-dom

Render your React app to HTML on the server, then make it interactive in the browser. This is the
piece that powers server-side rendering and client hydration for React on EkkoJS.

## Install

```bash
ekko add @ekko/react-dom
```

(Needs [`@ekko/react`](https://bifrost.ekkojs.com/package/ekko--react) alongside it.)

## On the server

```tsx
import "@ekko/react-dom/server"; // enables server rendering for your app
```

## In the browser

```tsx
import { hydrateRoot } from "@ekko/react-dom/client";

hydrateRoot(document.getElementById("root"), <App />);
```

Building a site? [`ekko:rune`](https://rune.ekkojs.com) wires this up for you, so you mostly just write
components and get fast first loads plus client-side interactivity out of the box.
