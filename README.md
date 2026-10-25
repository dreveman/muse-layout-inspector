# Muse Layout Inspector

An interactive diagnostic web artifact for inspecting the viewport, safe-area
insets, host chrome padding, framing mode, and virtual-keyboard boundaries of
apps running inside Muse across desktop, tablet, and phone devices.

## Features

- **Visual Edge & Inset Guides:** Translucent color-coded bands and corner
  brackets highlighting `--twsa-safe-area-inset-top`, `--header-height`,
  `--bottom-padding`, `env(safe-area-inset-bottom)`, and the usable app-shell
  bounding box.
- **SDK & Safe-Area CSS Variables:** Live readout of both raw CSS variable
  expressions and computed pixel heights.
- **Viewport & Container Geometry:** Live comparison of `window.innerWidth ×
  innerHeight`, `100dvh / 100svh / 100lvh`, `window.visualViewport`, and the
  bounding boxes of `[data-generated-space-root]` and
  `.hatch-space-root[data-hatch-space-root]`.
- **Virtual Keyboard Tester:** Bottom composer bar with an auto-detected
  keyboard state indicator and a toggleable iOS keyboard safe-area clamp so
  you can test bottom-edge behavior with the software keyboard open or closed.
- **Inset Simulator & Saved Snapshots:** Local sliders to simulate host CSS
  variables on desktop, one-click JSON export, and SQLite-backed device
  snapshots (`app.db`) for comparing mobile and desktop runs.

## Local Development

```bash
bun install
bun run dev
```

Open `http://127.0.0.1:4174` in your browser.

## Installing in Muse

See [`docs/INSTALL_GUIDE_FOR_MUSE_ASSISTENT.md`](docs/INSTALL_GUIDE_FOR_MUSE_ASSISTENT.md).
