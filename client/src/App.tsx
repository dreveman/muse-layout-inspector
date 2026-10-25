import { SafeAreaTopScrim, type SafeAreaTopScrimVariant } from "@hatch/space-sdk/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "./api";

type ColorMode = "system" | "light" | "dark";

type BoxMetrics = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  scrollTop: number;
  scrollHeight: number;
};

type LayoutTelemetry = {
  capturedAt: string;
  cssVars: {
    headerHeight: string;
    bottomPadding: string;
    hatchSpaceBottomPadding: string;
    twsaTop: string;
    twsaRight: string;
    twsaBottom: string;
    twsaLeft: string;
  };
  measuredInsetsPx: {
    envSafeTop: number;
    envSafeRight: number;
    envSafeBottom: number;
    envSafeLeft: number;
    twsaTop: number;
    twsaBottom: number;
    headerHeight: number;
    bottomPadding: number;
    hatchSpaceBottomPadding: number;
  };
  viewport: {
    innerWidth: number;
    innerHeight: number;
    clientWidth: number;
    clientHeight: number;
    dvh100: number;
    svh100: number;
    lvh100: number;
    visualViewportWidth: number | null;
    visualViewportHeight: number | null;
    visualViewportOffsetTop: number | null;
    visualViewportOffsetLeft: number | null;
    visualViewportScale: number | null;
    estimatedKeyboardPx: number;
    keyboardOpen: boolean;
  };
  containers: {
    generatedSpaceRoot: BoxMetrics | null;
    hatchSpaceRoot: BoxMetrics | null;
    appShell: BoxMetrics | null;
  };
  environment: {
    formFactor: "phone" | "tablet-or-desktop";
    pointer: "coarse" | "fine" | "none";
    hover: "hover" | "none";
    prefersColorScheme: "dark" | "light";
    prefersReducedMotion: boolean;
    devicePixelRatio: number;
    orientation: string;
    framedInParent: boolean;
    protocol: string;
    origin: string;
    hasViewerAssertionParam: boolean;
    hasCspScriptNonce: boolean;
    hasAuditSettleProbe: boolean;
  };
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function measureBox(el: HTMLElement | null): BoxMetrics | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  return {
    top: round1(r.top),
    left: round1(r.left),
    width: round1(r.width),
    height: round1(r.height),
    bottom: round1(r.bottom),
    right: round1(r.right),
    paddingTop: round1(parseFloat(cs.paddingTop) || 0),
    paddingBottom: round1(parseFloat(cs.paddingBottom) || 0),
    paddingLeft: round1(parseFloat(cs.paddingLeft) || 0),
    paddingRight: round1(parseFloat(cs.paddingRight) || 0),
    scrollTop: round1(el.scrollTop),
    scrollHeight: round1(el.scrollHeight),
  };
}

export function App() {
  const queryClient = useQueryClient();
  const appShellRef = useRef<HTMLDivElement>(null);
  const probeContainerRef = useRef<HTMLDivElement>(null);
  const maxVisualViewportHeightRef = useRef<number>(
    typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 0,
  );
  const restingShellHeightRef = useRef<number>(0);

  const [colorMode, setColorMode] = useState<ColorMode>("system");
  const [scrimVariant, setScrimVariant] = useState<SafeAreaTopScrimVariant | "off">("gradient");
  const [showOverlay, setShowOverlay] = useState(true);
  const [keyboardClampFix, setKeyboardClampFix] = useState(true);
  const [simEnabled, setSimEnabled] = useState(false);
  const [simHeaderPx, setSimHeaderPx] = useState(0);
  const [simBottomPaddingPx, setSimBottomPaddingPx] = useState(34);
  const [simSafeTopPx, setSimSafeTopPx] = useState(47);
  const [simSafeBottomPx, setSimSafeBottomPx] = useState(34);
  const [testInputText, setTestInputText] = useState("");
  const [copiedAt, setCopiedAt] = useState<number>(0);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  const [varsOpen, setVarsOpen] = useState(true);
  const [boxesOpen, setBoxesOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);

  const viewerQuery = useQuery({
    queryKey: ["viewer-info"],
    queryFn: () => api.getViewerInfo({}),
    staleTime: 60_000,
  });

  const snapshotsQuery = useQuery({
    queryKey: ["layout-snapshots"],
    queryFn: () => api.listSnapshots({}),
    staleTime: 10_000,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === "system") {
      root.removeAttribute("data-color-mode");
    } else {
      root.setAttribute("data-color-mode", colorMode);
    }
  }, [colorMode]);

  // Apply or clear simulated CSS variables on .hatch-space-root and :root.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const hatchRoot = document.querySelector<HTMLElement>(".hatch-space-root[data-hatch-space-root]");
    if (simEnabled) {
      root.style.setProperty("--twsa-safe-area-inset-top", `${simSafeTopPx}px`);
      root.style.setProperty("--twsa-safe-area-inset-bottom", `${simSafeBottomPx}px`);
      hatchRoot?.style.setProperty("--header-height", `${simHeaderPx}px`);
      hatchRoot?.style.setProperty("--bottom-padding", `${simBottomPaddingPx}px`);
      hatchRoot?.style.setProperty(
        "--hatch-space-bottom-padding",
        `calc(${simBottomPaddingPx}px + ${simSafeBottomPx}px)`,
      );
    } else {
      root.style.removeProperty("--twsa-safe-area-inset-top");
      root.style.removeProperty("--twsa-safe-area-inset-bottom");
      hatchRoot?.style.removeProperty("--header-height");
      hatchRoot?.style.removeProperty("--bottom-padding");
      hatchRoot?.style.removeProperty("--hatch-space-bottom-padding");
    }
  }, [simEnabled, simHeaderPx, simBottomPaddingPx, simSafeTopPx, simSafeBottomPx]);

  const [telemetry, setTelemetry] = useState<LayoutTelemetry | null>(null);

  const sampleTelemetry = useCallback(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const spaceRoot = document.querySelector<HTMLElement>("[data-generated-space-root]");
    const hatchRoot = document.querySelector<HTMLElement>(".hatch-space-root[data-hatch-space-root]");
    const shell = appShellRef.current;
    const probes = probeContainerRef.current;

    const vv = window.visualViewport;
    if (vv && vv.height > maxVisualViewportHeightRef.current) {
      maxVisualViewportHeightRef.current = vv.height;
    }
    const activeTag = document.activeElement?.tagName;
    const inputFocused = activeTag === "TEXTAREA" || activeTag === "INPUT";
    const viewportShrunk = vv ? vv.height < maxVisualViewportHeightRef.current - 4 : false;
    const keyboardOpen = Boolean(inputFocused || viewportShrunk);

    // Optional iOS virtual-keyboard clamp fix demonstration:
    // While the virtual keyboard is open on mobile, env(safe-area-inset-bottom)
    // still reports ~34px even though the keyboard covers the home indicator.
    if (shell && hatchRoot) {
      const isNarrow = window.matchMedia("(max-width: 779px)").matches;
      if (keyboardClampFix && isNarrow && keyboardOpen && vv && vv.scale === 1) {
        if (spaceRoot && spaceRoot.scrollTop !== 0) spaceRoot.scrollTop = 0;
        if (window.scrollY !== 0) window.scrollTo(0, 0);
        hatchRoot.setAttribute("data-keyboard-open", "true");
        const top = shell.getBoundingClientRect().top;
        const rawHeight = Math.max(0, Math.floor(vv.height + vv.offsetTop - top));
        const clampedHeight =
          restingShellHeightRef.current > 0
            ? Math.min(restingShellHeightRef.current, rawHeight)
            : rawHeight;
        const sizeExpr = `calc(${clampedHeight}px - var(--bottom-padding, 0px))`;
        shell.style.height = sizeExpr;
        shell.style.maxHeight = sizeExpr;
      } else {
        hatchRoot.removeAttribute("data-keyboard-open");
        shell.style.removeProperty("height");
        shell.style.removeProperty("max-height");
        restingShellHeightRef.current = shell.offsetHeight;
      }
    }

    const rootCs = window.getComputedStyle(root);
    const hatchCs = hatchRoot ? window.getComputedStyle(hatchRoot) : rootCs;

    const readProbeHeight = (name: string): number => {
      const el = probes?.querySelector<HTMLElement>(`[data-probe="${name}"]`);
      return el ? round1(el.getBoundingClientRect().height) : 0;
    };
    const readProbeWidth = (name: string): number => {
      const el = probes?.querySelector<HTMLElement>(`[data-probe="${name}"]`);
      return el ? round1(el.getBoundingClientRect().width) : 0;
    };

    const dvh100 = readProbeHeight("dvh");
    const svh100 = readProbeHeight("svh");
    const lvh100 = readProbeHeight("lvh");
    const envSafeTop = readProbeHeight("env-top");
    const envSafeBottom = readProbeHeight("env-bottom");
    const envSafeLeft = readProbeWidth("env-left");
    const envSafeRight = readProbeWidth("env-right");
    const twsaTop = readProbeHeight("twsa-top");
    const twsaBottom = readProbeHeight("twsa-bottom");
    const headerHeight = readProbeHeight("header-height");
    const bottomPadding = readProbeHeight("bottom-padding");
    const hatchSpaceBottomPadding = readProbeHeight("hatch-bottom-padding");

    const estimatedKeyboardPx = vv
      ? Math.max(0, round1(window.innerHeight - vv.height - vv.offsetTop))
      : 0;

    let hasViewerAssertionParam = false;
    try {
      hasViewerAssertionParam = new URL(window.location.href).searchParams.has("viewer_assertion");
    } catch {
      hasViewerAssertionParam = false;
    }

    const pointer: "coarse" | "fine" | "none" = window.matchMedia("(pointer: coarse)").matches
      ? "coarse"
      : window.matchMedia("(pointer: fine)").matches
        ? "fine"
        : "none";

    setTelemetry({
      capturedAt: new Date().toISOString(),
      cssVars: {
        headerHeight: hatchCs.getPropertyValue("--header-height").trim() || "(unset → 0px)",
        bottomPadding: hatchCs.getPropertyValue("--bottom-padding").trim() || "(unset → 0px)",
        hatchSpaceBottomPadding:
          hatchCs.getPropertyValue("--hatch-space-bottom-padding").trim() || "(unset)",
        twsaTop: rootCs.getPropertyValue("--twsa-safe-area-inset-top").trim() || "(unset)",
        twsaRight: rootCs.getPropertyValue("--twsa-safe-area-inset-right").trim() || "(unset)",
        twsaBottom: rootCs.getPropertyValue("--twsa-safe-area-inset-bottom").trim() || "(unset)",
        twsaLeft: rootCs.getPropertyValue("--twsa-safe-area-inset-left").trim() || "(unset)",
      },
      measuredInsetsPx: {
        envSafeTop,
        envSafeRight,
        envSafeBottom,
        envSafeLeft,
        twsaTop,
        twsaBottom,
        headerHeight,
        bottomPadding,
        hatchSpaceBottomPadding,
      },
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        clientWidth: root.clientWidth,
        clientHeight: root.clientHeight,
        dvh100,
        svh100,
        lvh100,
        visualViewportWidth: vv ? round1(vv.width) : null,
        visualViewportHeight: vv ? round1(vv.height) : null,
        visualViewportOffsetTop: vv ? round1(vv.offsetTop) : null,
        visualViewportOffsetLeft: vv ? round1(vv.offsetLeft) : null,
        visualViewportScale: vv ? round1(vv.scale) : null,
        estimatedKeyboardPx,
        keyboardOpen,
      },
      containers: {
        generatedSpaceRoot: measureBox(spaceRoot),
        hatchSpaceRoot: measureBox(hatchRoot),
        appShell: measureBox(shell),
      },
      environment: {
        formFactor: window.matchMedia("(max-width: 779px)").matches ? "phone" : "tablet-or-desktop",
        pointer,
        hover: window.matchMedia("(hover: hover)").matches ? "hover" : "none",
        prefersColorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
        prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        devicePixelRatio: round1(window.devicePixelRatio || 1),
        orientation: window.screen?.orientation?.type ?? "unknown",
        framedInParent: window.parent !== window,
        protocol: window.location.protocol,
        origin: window.location.origin,
        hasViewerAssertionParam,
        hasCspScriptNonce: Boolean(document.querySelector("script[nonce]")?.getAttribute("nonce")),
        hasAuditSettleProbe: typeof (window as unknown as Record<string, unknown>).__hatchAuditSettle === "function",
      },
    });
  }, [keyboardClampFix]);

  useLayoutEffect(() => {
    sampleTelemetry();
    const vv = window.visualViewport;
    window.addEventListener("resize", sampleTelemetry);
    window.addEventListener("scroll", sampleTelemetry, true);
    document.addEventListener("focusin", sampleTelemetry);
    document.addEventListener("focusout", sampleTelemetry);
    vv?.addEventListener("resize", sampleTelemetry);
    vv?.addEventListener("scroll", sampleTelemetry);
    return () => {
      window.removeEventListener("resize", sampleTelemetry);
      window.removeEventListener("scroll", sampleTelemetry, true);
      document.removeEventListener("focusin", sampleTelemetry);
      document.removeEventListener("focusout", sampleTelemetry);
      vv?.removeEventListener("resize", sampleTelemetry);
      vv?.removeEventListener("scroll", sampleTelemetry);
    };
  }, [sampleTelemetry, simEnabled, simHeaderPx, simBottomPaddingPx, simSafeTopPx, simSafeBottomPx]);

  const copyJsonReport = async () => {
    if (!telemetry) return;
    const payload = JSON.stringify(
      {
        ...telemetry,
        viewer: viewerQuery.data ?? null,
        keyboardClampFixEnabled: keyboardClampFix,
        simulatedOverrides: simEnabled,
      },
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedAt(Date.now());
    } catch {
      // Fallback selection copy
    }
  };

  const saveCurrentSnapshot = async () => {
    if (!telemetry || savingSnapshot) return;
    const defaultLabel = `${telemetry.environment.formFactor} ${telemetry.viewport.innerWidth}×${telemetry.viewport.innerHeight}${telemetry.viewport.keyboardOpen ? " (kb open)" : ""}`;
    const label = snapshotLabel.trim() || defaultLabel;
    setSavingSnapshot(true);
    try {
      await api.saveSnapshot({
        label,
        payloadJson: JSON.stringify({ ...telemetry, viewer: viewerQuery.data ?? null }),
      });
      setSnapshotLabel("");
      await queryClient.invalidateQueries({ queryKey: ["layout-snapshots"] });
    } finally {
      setSavingSnapshot(false);
    }
  };

  const m = telemetry?.measuredInsetsPx;
  const vp = telemetry?.viewport;
  const env = telemetry?.environment;
  const shellBox = telemetry?.containers.appShell;

  return (
    <div ref={appShellRef} className="inspector-app-shell">
      {scrimVariant !== "off" && (
        <SafeAreaTopScrim variant={scrimVariant} backgroundColor="var(--bg)" />
      )}

      {/* Hidden CSS length probes to convert env() / var() / dvh / svh / lvh into exact pixels */}
      <div ref={probeContainerRef} className="inspector-probes" aria-hidden="true">
        <div data-probe="dvh" style={{ height: "100dvh" }} />
        <div data-probe="svh" style={{ height: "100svh" }} />
        <div data-probe="lvh" style={{ height: "100lvh" }} />
        <div data-probe="env-top" style={{ height: "env(safe-area-inset-top, 0px)" }} />
        <div data-probe="env-bottom" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        <div data-probe="env-left" style={{ width: "env(safe-area-inset-left, 0px)" }} />
        <div data-probe="env-right" style={{ width: "env(safe-area-inset-right, 0px)" }} />
        <div data-probe="twsa-top" style={{ height: "var(--twsa-safe-area-inset-top, 0px)" }} />
        <div data-probe="twsa-bottom" style={{ height: "var(--twsa-safe-area-inset-bottom, 0px)" }} />
        <div data-probe="header-height" style={{ height: "var(--header-height, 0px)" }} />
        <div data-probe="bottom-padding" style={{ height: "var(--bottom-padding, 0px)" }} />
        <div
          data-probe="hatch-bottom-padding"
          style={{ height: "var(--hatch-space-bottom-padding, 0px)" }}
        />
      </div>

      {/* Visual boundary & inset overlays */}
      {showOverlay && m && (
        <div className="boundary-overlay-layer" aria-hidden="true">
          <div className="boundary-viewport-frame">
            <span className="boundary-corner tl" />
            <span className="boundary-corner tr" />
            <span className="boundary-corner bl" />
            <span className="boundary-corner br" />
          </div>

          {m.twsaTop > 0 && (
            <div className="boundary-band band-safe-top" style={{ height: `${m.twsaTop}px` }}>
              <span>--twsa-safe-area-inset-top: {m.twsaTop}px</span>
            </div>
          )}

          {m.headerHeight > 0 && (
            <div
              className="boundary-band band-header"
              style={{ top: `${m.twsaTop}px`, height: `${m.headerHeight}px` }}
            >
              <span>--header-height: {m.headerHeight}px</span>
            </div>
          )}

          {m.bottomPadding > 0 && (
            <div
              className="boundary-band band-bottom-padding"
              style={{ bottom: `${m.twsaBottom}px`, height: `${m.bottomPadding}px` }}
            >
              <span>--bottom-padding: {m.bottomPadding}px</span>
            </div>
          )}

          {m.twsaBottom > 0 && (
            <div className="boundary-band band-safe-bottom" style={{ height: `${m.twsaBottom}px` }}>
              <span>env(safe-area-inset-bottom): {m.twsaBottom}px</span>
            </div>
          )}

          <div className="boundary-usable-outline">
            <span className="boundary-usable-badge">
              Usable shell: {shellBox ? `${shellBox.width}×${shellBox.height}px` : "…"}
            </span>
          </div>
        </div>
      )}

      {/* Main scrollable stage with centered Welcome/Companion-style card */}
      <main className="inspector-stage">
        <section className="inspector-card" aria-label="Muse Layout Inspector">
          <header className="inspector-card-header">
            <div>
              <span className="inspector-eyebrow">
                MUSE SPACE SDK · {env?.formFactor === "phone" ? "PHONE VIEWPORT" : "DESKTOP / TABLET VIEWPORT"}
              </span>
              <h1 className="inspector-headline">Layout &amp; Boundary Inspector</h1>
              <p className="inspector-subtitle">
                Live geometry of safe-area insets, host chrome padding, viewport units, and virtual
                keyboard boundaries.
              </p>
            </div>
            <div className="inspector-header-controls">
              <div className="segmented-pills" role="group" aria-label="Color mode">
                {(["system", "light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={colorMode === mode ? "active" : ""}
                    onClick={() => setColorMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`inspector-chip-btn${showOverlay ? " active" : ""}`}
                onClick={() => setShowOverlay((v) => !v)}
              >
                {showOverlay ? "Hide edge guides" : "Show edge guides"}
              </button>
            </div>
          </header>

          {/* Primary 4-metric summary grid */}
          <dl className="inspector-summary-grid">
            <div className="summary-tile">
              <dt>Window / Visual Viewport</dt>
              <dd>
                <strong>
                  {vp ? `${vp.innerWidth} × ${vp.innerHeight}` : "—"}
                </strong>
                <small>
                  vv: {vp?.visualViewportHeight != null ? `${vp.visualViewportWidth}×${vp.visualViewportHeight} (top ${vp.visualViewportOffsetTop})` : "n/a"}
                </small>
              </dd>
            </div>
            <div className="summary-tile">
              <dt>100dvh / 100svh / 100lvh</dt>
              <dd>
                <strong>
                  {vp ? `${vp.dvh100} / ${vp.svh100} / ${vp.lvh100}px` : "—"}
                </strong>
                <small>
                  shell: {shellBox ? `${shellBox.width}×${shellBox.height}px` : "—"}
                </small>
              </dd>
            </div>
            <div className="summary-tile">
              <dt>Top Insets (Safe + Header)</dt>
              <dd>
                <strong>
                  {m ? `${m.twsaTop}px + ${m.headerHeight}px` : "—"}
                </strong>
                <small>
                  env(top): {m?.envSafeTop ?? 0}px · scrim: {scrimVariant}
                </small>
              </dd>
            </div>
            <div className="summary-tile">
              <dt>Bottom (--hatch-space-bottom-padding)</dt>
              <dd>
                <strong>
                  {m ? `${m.hatchSpaceBottomPadding}px` : "—"}
                </strong>
                <small>
                  pad {m?.bottomPadding ?? 0}px + safe {m?.twsaBottom ?? 0}px
                </small>
              </dd>
            </div>
          </dl>

          {/* Expandable Section 1: SDK CSS Variables */}
          <div className="inspector-section">
            <button
              type="button"
              className="inspector-more-button"
              aria-expanded={varsOpen}
              onClick={() => setVarsOpen((v) => !v)}
            >
              <span>SDK &amp; Safe-Area CSS Variables</span>
              <span className="inspector-chevron" aria-hidden="true">›</span>
            </button>
            {varsOpen && telemetry && (
              <dl className="inspector-kv-list">
                <div>
                  <dt><code>--header-height</code></dt>
                  <dd>{telemetry.cssVars.headerHeight} <em>({m?.headerHeight}px)</em></dd>
                </div>
                <div>
                  <dt><code>--bottom-padding</code></dt>
                  <dd>{telemetry.cssVars.bottomPadding} <em>({m?.bottomPadding}px)</em></dd>
                </div>
                <div>
                  <dt><code>--hatch-space-bottom-padding</code></dt>
                  <dd>
                    <code>calc(var(--bottom-padding) + env(safe-area-inset-bottom))</code>{" "}
                    <em>({m?.hatchSpaceBottomPadding}px)</em>
                  </dd>
                </div>
                <div>
                  <dt><code>--twsa-safe-area-inset-top</code></dt>
                  <dd>{telemetry.cssVars.twsaTop} <em>({m?.twsaTop}px)</em></dd>
                </div>
                <div>
                  <dt><code>--twsa-safe-area-inset-bottom</code></dt>
                  <dd>{telemetry.cssVars.twsaBottom} <em>({m?.twsaBottom}px)</em></dd>
                </div>
                <div>
                  <dt><code>env(safe-area-inset-left / right)</code></dt>
                  <dd>{m?.envSafeLeft}px / {m?.envSafeRight}px</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Expandable Section 2: DOM Wrapper & Container Boxes */}
          <div className="inspector-section">
            <button
              type="button"
              className="inspector-more-button"
              aria-expanded={boxesOpen}
              onClick={() => setBoxesOpen((v) => !v)}
            >
              <span>Host Wrapper &amp; Container Bounding Boxes</span>
              <span className="inspector-chevron" aria-hidden="true">›</span>
            </button>
            {boxesOpen && telemetry && (
              <dl className="inspector-kv-list">
                {(
                  [
                    ["[data-generated-space-root]", telemetry.containers.generatedSpaceRoot],
                    [".hatch-space-root[data-hatch-space-root]", telemetry.containers.hatchSpaceRoot],
                    [".inspector-app-shell", telemetry.containers.appShell],
                  ] as const
                ).map(([selector, box]) => (
                  <div key={selector}>
                    <dt><code>{selector}</code></dt>
                    <dd>
                      {box
                        ? `rect(${box.left}, ${box.top}, ${box.width}×${box.height}) · pad(${box.paddingTop}/${box.paddingBottom}) · scroll(${box.scrollTop}/${box.scrollHeight})`
                        : "missing"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Expandable Section 3: Form Factor, Framing & Viewer */}
          <div className="inspector-section">
            <button
              type="button"
              className="inspector-more-button"
              aria-expanded={envOpen}
              onClick={() => setEnvOpen((v) => !v)}
            >
              <span>Form Factor, Framing &amp; Runtime Mode</span>
              <span className="inspector-chevron" aria-hidden="true">›</span>
            </button>
            {envOpen && env && (
              <dl className="inspector-kv-list">
                <div>
                  <dt>Framing / Origin</dt>
                  <dd>
                    {env.framedInParent ? "Embedded iframe (window.parent !== window)" : "Top-level window"} ·{" "}
                    <code>{env.protocol}</code> · origin <code>{env.origin}</code>
                  </dd>
                </div>
                <div>
                  <dt>Pointer / Hover / DPR</dt>
                  <dd>
                    pointer: <code>{env.pointer}</code> · hover: <code>{env.hover}</code> ·{" "}
                    {env.devicePixelRatio}x · {env.orientation}
                  </dd>
                </div>
                <div>
                  <dt>Host Security &amp; Probes</dt>
                  <dd>
                    viewer_assertion: <code>{String(env.hasViewerAssertionParam)}</code> · CSP nonce:{" "}
                    <code>{String(env.hasCspScriptNonce)}</code> · __hatchAuditSettle:{" "}
                    <code>{String(env.hasAuditSettleProbe)}</code>
                  </dd>
                </div>
                <div>
                  <dt>Server <code>ctx.viewer</code></dt>
                  <dd>
                    {viewerQuery.data
                      ? `source: ${viewerQuery.data.source} · slug: ${viewerQuery.data.spaceSlug} · isOwner: ${viewerQuery.data.isOwner}${viewerQuery.data.displayName ? ` · ${viewerQuery.data.displayName}` : ""}`
                      : "loading…"}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Expandable Section 4: Simulator & Saved Device Snapshots */}
          <div className="inspector-section">
            <button
              type="button"
              className="inspector-more-button"
              aria-expanded={simOpen}
              onClick={() => setSimOpen((v) => !v)}
            >
              <span>Inset Simulator &amp; Saved Device Snapshots</span>
              <span className="inspector-chevron" aria-hidden="true">›</span>
            </button>
            {simOpen && (
              <div className="inspector-simulator">
                <div className="sim-row">
                  <label className="sim-toggle">
                    <input
                      type="checkbox"
                      checked={simEnabled}
                      onChange={(e) => setSimEnabled(e.target.checked)}
                    />
                    <span>Simulate host CSS variables locally</span>
                  </label>
                  <div className="segmented-pills" role="group" aria-label="SafeAreaTopScrim variant">
                    {(["gradient", "solid", "blur", "off"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={scrimVariant === v ? "active" : ""}
                        onClick={() => setScrimVariant(v)}
                      >
                        scrim: {v}
                      </button>
                    ))}
                  </div>
                </div>

                {simEnabled && (
                  <div className="sim-sliders">
                    <label>
                      <span><code>--twsa-safe-area-inset-top</code> ({simSafeTopPx}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        value={simSafeTopPx}
                        onChange={(e) => setSimSafeTopPx(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      <span><code>--header-height</code> ({simHeaderPx}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={96}
                        value={simHeaderPx}
                        onChange={(e) => setSimHeaderPx(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      <span><code>--bottom-padding</code> ({simBottomPaddingPx}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={120}
                        value={simBottomPaddingPx}
                        onChange={(e) => setSimBottomPaddingPx(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      <span><code>--twsa-safe-area-inset-bottom</code> ({simSafeBottomPx}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={64}
                        value={simSafeBottomPx}
                        onChange={(e) => setSimSafeBottomPx(Number(e.target.value))}
                      />
                    </label>
                  </div>
                )}

                <div className="snapshot-saver">
                  <input
                    type="text"
                    placeholder="Optional label (e.g. iPhone 16 Pro keyboard open)"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    maxLength={120}
                  />
                  <button
                    type="button"
                    className="inspector-btn-primary"
                    onClick={() => void saveCurrentSnapshot()}
                    disabled={savingSnapshot}
                  >
                    {savingSnapshot ? "Saving…" : "Save snapshot to DB"}
                  </button>
                </div>

                {snapshotsQuery.data && snapshotsQuery.data.snapshots.length > 0 && (
                  <div className="snapshot-list">
                    {snapshotsQuery.data.snapshots.map((snap) => {
                      let parsed: Partial<LayoutTelemetry> | null = null;
                      try {
                        parsed = JSON.parse(snap.payloadJson);
                      } catch {
                        parsed = null;
                      }
                      return (
                        <div key={snap.id} className="snapshot-item">
                          <div>
                            <strong>{snap.label}</strong>
                            <small>
                              {parsed?.viewport
                                ? `win ${parsed.viewport.innerWidth}×${parsed.viewport.innerHeight} · vv ${parsed.viewport.visualViewportHeight ?? "?"} · pad ${parsed.measuredInsetsPx?.bottomPadding ?? 0}px + safe ${parsed.measuredInsetsPx?.twsaBottom ?? 0}px`
                                : snap.createdAt}
                            </small>
                          </div>
                          <button
                            type="button"
                            className="inspector-chip-btn"
                            onClick={() =>
                              void api.deleteSnapshot({ id: snap.id }).then(() =>
                                queryClient.invalidateQueries({ queryKey: ["layout-snapshots"] }),
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="inspector-card-footer">
            <button type="button" className="inspector-btn-primary" onClick={() => void copyJsonReport()}>
              {Date.now() - copiedAt < 2000 ? "✓ Copied JSON report" : "Copy JSON report"}
            </button>
            <button type="button" className="inspector-btn-secondary" onClick={sampleTelemetry}>
              Refresh measurements
            </button>
          </footer>
        </section>
      </main>

      {/* Bottom composer bar to test virtual keyboard & bottom inset behavior */}
      <form
        className="keyboard-test-prompt"
        onSubmit={(e) => {
          e.preventDefault();
          setTestInputText("");
        }}
      >
        <div className="keyboard-test-composer">
          <textarea
            className="keyboard-test-textarea"
            rows={1}
            value={testInputText}
            onChange={(e) => setTestInputText(e.target.value)}
            placeholder="Tap here to test virtual keyboard & bottom inset behavior…"
          />
          <div className="keyboard-test-toolbar">
            <div className="keyboard-test-status">
              <span className={`kb-dot${vp?.keyboardOpen ? " live" : ""}`} />
              <span>
                Keyboard: <strong>{vp?.keyboardOpen ? `OPEN (~${vp.estimatedKeyboardPx}px)` : "closed"}</strong>
              </span>
              <span className="kb-sep">·</span>
              <span>
                Shell bottom: <strong>{shellBox ? `${shellBox.bottom}px` : "—"}</strong>
              </span>
            </div>
            <div className="keyboard-test-actions">
              <button
                type="button"
                className={`kb-clamp-toggle${keyboardClampFix ? " active" : ""}`}
                onClick={() => setKeyboardClampFix((v) => !v)}
                title="When enabled on narrow screens, clamps the shell to visualViewport.height - var(--bottom-padding) while the keyboard is open so env(safe-area-inset-bottom) is not double-counted above the keyboard."
              >
                iOS keyboard clamp: {keyboardClampFix ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
