# @ekko/asgard

The official UI library for EkkoJS. A set of accessible, themeable React components, buttons, inputs,
selects, switches, sliders, cards, alerts, dialogs, data tables, tree views, drawers, breadcrumbs, a
markdown renderer, and more, ready to drop into your `ekko:rune` app. Everything renders correctly on
the server, so your pages look right before they become interactive.

Browse every component with live examples and code at **[asgard.ekkojs.com](https://asgard.ekkojs.com)**.

## Install

```bash
ekko add @ekko/asgard
```

To use it in a rune app, ship Asgard and React and map the React names so the whole app shares one
React instance:

```jsonc
// your app's ekko.json
{
  "ship": { "@ekko/asgard": "^1.0.0", "@ekko/react": "^19.0.0", "@ekko/react-dom": "^19.0.0" },
  "imports": {
    "react": "@ekko/react",
    "react/jsx-runtime": "@ekko/react/jsx-runtime",
    "react-dom": "@ekko/react-dom",
    "react-dom/client": "@ekko/react-dom/client",
    "react-dom/server": "@ekko/react-dom/server"
  }
}
```

## Use it

```tsx
import { ThemeProvider, Button, TextBox } from "@ekko/asgard";

function App() {
  return (
    <ThemeProvider>
      <TextBox placeholder="Your name" />
      <Button type="primary">Save</Button>
    </ThemeProvider>
  );
}
```

Wrap your app in `ThemeProvider` for built-in light/dark and 20+ palettes, and use `useTheme` to read
or switch the active theme.

## Releases

See [`CHANGELOG.md`](CHANGELOG.md) for what changed in each version. This release (1.0.5) requires
EkkoJS `>= 0.8.6`.
