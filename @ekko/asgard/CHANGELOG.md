# @ekko/asgard changelog

## 1.0.5

Requires EkkoJS `>= 0.8.6` (no maximum). Everything below is additive and opt-in, so upgrading from
1.0.4 changes no existing behaviour.

### New

- **SyntaxColor**: optional `showCopyButton`, a copy-to-clipboard button in the top-right that copies
  the original source. It sits dim until the code block is hovered (fast fade in) and stays lit briefly
  after a copy so the confirmation is visible. Also exposed through MarkdownRenderer as `codeCopyButton`.
- **MarkdownRenderer**: optional `imageLightbox`. Click an image or SVG to open it full-screen in a
  zoomable lightbox (pinch, wheel, double-tap to zoom, drag to pan, tap outside or Escape to close).
- **TextBox / Select**: the floating label now truncates with an ellipsis instead of wrapping over the
  input text, and a new `floatingLabelBackground` prop lets you drop the label background on themes
  where the label reads better flush against the field.
- **Slider**: full touch support. Drag the thumb (or either end of a range) on mobile; the slider owns
  the touch gesture so a swipe moves the value instead of scrolling the page.
- **Calendar**:
  - `rangeHalfDayConfig` makes a range's first and last day half-days automatically, the hotel
    check-in (afternoon) / check-out (morning) pattern, with no extra clicks. Each end is configurable
    (`full`, `half-morning`, `half-afternoon`).
  - new `halfDayClickCycle` for single / multiple selection: each click on a date advances its state
    none, morning, afternoon, full, then back to none.
  - date cells no longer text-select when clicked.

### Fixed

- **FeatureTour**: the tooltip now appears at the correct position immediately instead of briefly
  flashing the previous step's position and then jumping. It also fixes a re-entrant effect loop where
  a step `action` that updated parent state could freeze the page; the tour effects are now keyed on the
  step index and read live step / handlers through refs.
- **TextBox**: the password reveal (eye) icon now correctly toggles between the masked value and plain
  text.
- **Calendar**: the range half-day initializer no longer risks a render loop when `rangeHalfDayConfig`
  is passed inline.

## 1.0.4

- 17 additional syntax grammars for SyntaxColor / MarkdownRenderer (MIT-adapted from monaco-editor),
  publicly exported.
