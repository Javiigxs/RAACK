<script lang="ts" module>
  import type { LookClass } from './layers';

  /** A mark on the globe: a country at its reference point, or one of the cases of the tool. */
  export interface GlobeDot {
    id: string;
    lon: number;
    lat: number;
    cls: LookClass;
    kind: 'country' | 'case';
    /** First line of the tooltip. */
    name: string;
    /** Second line of the tooltip. */
    note: string;
  }

  /** A parallel drawn on the globe, with its label. */
  export interface GlobeLine {
    lat: number;
    label: string;
  }
</script>

<script lang="ts">
  // The globe of the world section: the planet turns until the chosen place faces the reader.
  // It has no frame: the planet floats on the page like the opening Earth, and it is drawn by the
  // same renderers (earth/webgl.ts and earth/software.ts) on its own canvas. The marks are SVG on
  // top, placed with the same projection.
  // Code written with AI assistance (Claude) for team RAACK.
  import { onMount } from 'svelte';
  import { createSoftwareEarth } from '../earth/software';
  import { createWebglEarth, type EarthMaps, type EarthRenderer } from '../earth/webgl';
  import { isStill } from '../ui/motion.svelte';
  import { FIT_DIST, clampLat, dragDegrees, parallelRuns, renderOf, screenOf, tripAt, tripSeconds, wrapLon, type GlobeView } from './view';

  let {
    dots,
    focus,
    selected,
    selectedName,
    lines = [],
    onpick,
    ariaLabel,
    labels
  }: {
    dots: GlobeDot[];
    /** Where to look. A new value starts a trip. */
    focus: GlobeView;
    /** Mark that carries the ring. */
    selected: string;
    selectedName: string;
    lines?: GlobeLine[];
    onpick: (id: string) => void;
    ariaLabel: string;
    labels: { recentre: string; drag: string };
  } = $props();

  /** How much of the cloud cover the globe keeps: enough to look real, not enough to hide a country. */
  const CLOUDS = 0.18;
  /** Pixels around a mark that still count as pointing at it. */
  const REACH = 18;

  let boxEl = $state<HTMLDivElement | null>(null);
  let lensEl = $state<HTMLDivElement | null>(null);
  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let selEl = $state<SVGGElement | null>(null);
  let dotEls = $state<(SVGGElement | null)[]>([]);
  let lineEls = $state<(SVGPathElement | null)[]>([]);
  let lineLabelEls = $state<(SVGTextElement | null)[]>([]);
  let mode = $state<'loading' | 'webgl' | 'canvas' | 'none'>('loading');
  let hover = $state<{ id: string; x: number; y: number } | null>(null);
  /** The reader dragged the planet away from the chosen place. */
  let astray = $state(false);
  let grabbing = $state(false);
  /** A small picture (a phone) draws smaller marks, so neighbours do not pile up. */
  let compact = $state(false);

  // The picture in progress: plain variables, the frame loop reads and writes them.
  let view: GlobeView = { lon: 0, lat: 0, dist: FIT_DIST };
  let trip: { from: GlobeView; to: GlobeView; t0: number; seconds: number } | null = null;
  let renderer: EarthRenderer | null = null;
  /** Side of the picture (the canvas and the marks), in CSS pixels. */
  let size = 1;
  let raf = 0;
  let alive = false;
  let seen = false;
  let dirty = true;
  let started = false;
  /** Position of every mark in the picture (CSS pixels) and whether it faces the reader. */
  let pos = new Float32Array(0);
  let shown = new Uint8Array(0);

  const hovered = $derived(hover ? (dots.find((d) => d.id === hover!.id) ?? null) : null);

  function wake() {
    if (!raf && alive) raf = requestAnimationFrame(frame);
  }

  function go(to: GlobeView, instant = false) {
    const target = { lon: wrapLon(to.lon), lat: clampLat(to.lat), dist: to.dist };
    if (instant || !started || isStill()) {
      view = target;
      trip = null;
    } else {
      trip = { from: { ...view }, to: target, t0: 0, seconds: tripSeconds(view, target) };
    }
    started = true;
    astray = false;
    dirty = true;
    wake();
  }

  function frame(now: number) {
    raf = 0;
    if (!alive) return;
    if (trip) {
      if (!trip.t0) trip.t0 = now;
      const p = (now - trip.t0) / (trip.seconds * 1000);
      view = tripAt(trip.from, trip.to, p);
      if (p >= 1) {
        view = { ...trip.to };
        trip = null;
      }
      dirty = true;
    }
    if (dirty && seen) {
      dirty = false;
      renderer?.draw({ ...renderOf(view), clouds: CLOUDS });
      place();
    }
    if (trip) wake();
  }

  /** Puts every mark, the ring and the parallels where the projection says. */
  function place() {
    const half = size / 2;
    if (pos.length !== dots.length * 2) {
      pos = new Float32Array(dots.length * 2);
      shown = new Uint8Array(dots.length);
    }
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const el = dotEls[i];
      const p = screenOf(d.lon, d.lat, view);
      shown[i] = p ? 1 : 0;
      if (p) {
        pos[i * 2] = half + p[0] * half;
        pos[i * 2 + 1] = half - p[1] * half;
      }
      if (!el) continue;
      if (p) {
        el.setAttribute('transform', `translate(${pos[i * 2].toFixed(1)} ${pos[i * 2 + 1].toFixed(1)})`);
        el.style.display = '';
      } else el.style.display = 'none';
    }
    if (selEl) {
      const i = dots.findIndex((d) => d.id === selected);
      if (i >= 0 && shown[i]) {
        selEl.setAttribute('transform', `translate(${pos[i * 2].toFixed(1)} ${pos[i * 2 + 1].toFixed(1)})`);
        selEl.style.display = '';
      } else selEl.style.display = 'none';
    }
    for (let k = 0; k < lines.length; k++) {
      const path = lineEls[k];
      const text = lineLabelEls[k];
      if (!path) continue;
      const runs = parallelRuns(lines[k].lat, view);
      let d = '';
      let best: [number, number] | null = null;
      for (const run of runs) {
        run.forEach((p, i) => {
          d += `${i ? 'L' : 'M'}${(half + p[0] * half).toFixed(1)} ${(half - p[1] * half).toFixed(1)}`;
          // The label sits to the left of the centre, clear of the ring.
          if (!best || Math.abs(p[0] + 0.36) < Math.abs(best[0] + 0.36)) best = p;
        });
      }
      path.setAttribute('d', d);
      if (text) {
        const b = best as [number, number] | null;
        if (b) {
          text.setAttribute('x', (half + b[0] * half).toFixed(1));
          text.setAttribute('y', (half - b[1] * half + 4).toFixed(1));
          text.style.display = '';
        } else text.style.display = 'none';
      }
    }
  }

  /** The mark nearest to a point of the picture, within reach. Cases win over countries. */
  function nearest(x: number, y: number): number {
    let best = -1;
    let bestD = REACH * REACH;
    for (let i = 0; i < dots.length; i++) {
      if (!shown[i]) continue;
      const dx = pos[i * 2] - x;
      const dy = pos[i * 2 + 1] - y;
      const d = dx * dx + dy * dy - (dots[i].kind === 'case' ? 60 : 0);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  // ---- pointer: drag to turn, press a mark to choose it
  let press: { x: number; y: number; lon: number; lat: number; moved: boolean; touch: boolean } | null = null;

  /** A point of the window in the coordinates of the picture. */
  function local(e: PointerEvent): [number, number] {
    const r = lensEl!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function onDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const [x, y] = local(e);
    press = { x, y, lon: view.lon, lat: view.lat, moved: false, touch: e.pointerType === 'touch' };
    try {
      boxEl!.setPointerCapture(e.pointerId);
    } catch {
      // a pointer that cannot be captured still drags while it stays over the globe
    }
  }

  function onMove(e: PointerEvent) {
    const [x, y] = local(e);
    if (press) {
      const dx = x - press.x;
      const dy = y - press.y;
      if (!press.moved && Math.hypot(dx, dy) < 5) return;
      press.moved = true;
      grabbing = true;
      hover = null;
      trip = null;
      const k = dragDegrees(view) / (size / 2);
      // A finger turns the planet sideways only: up and down stays with the page.
      view = { lon: wrapLon(press.lon - dx * k), lat: press.touch ? view.lat : clampLat(press.lat + dy * k), dist: view.dist };
      astray = true;
      dirty = true;
      wake();
      return;
    }
    const i = nearest(x, y);
    hover = i >= 0 ? { id: dots[i].id, x: pos[i * 2], y: pos[i * 2 + 1] } : null;
  }

  function onUp(e: PointerEvent) {
    if (!press) return;
    const moved = press.moved;
    press = null;
    grabbing = false;
    if (boxEl?.hasPointerCapture(e.pointerId)) boxEl.releasePointerCapture(e.pointerId);
    if (moved) return;
    const [x, y] = local(e);
    const i = nearest(x, y);
    if (i >= 0) onpick(dots[i].id);
  }

  // A new place to look at: travel there.
  $effect(() => {
    const to = { lon: focus.lon, lat: focus.lat, dist: focus.dist };
    if (alive) go(to);
  });

  // The marks changed (language, or data arrived), or another one carries the ring: place them again.
  $effect(() => {
    void dots;
    void lines;
    void selected;
    void selectedName;
    dirty = true;
    wake();
  });

  function load(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`could not load ${src}`));
      img.src = src;
    });
  }

  onMount(() => {
    const box = boxEl!;
    const lens = lensEl!;
    alive = true;
    go({ lon: focus.lon, lat: focus.lat, dist: focus.dist }, true);

    function measure() {
      size = Math.max(1, lens.clientWidth);
      compact = size < 500;
      if (renderer) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const px = Math.max(1, Math.round(size * dpr));
        renderer.resize(px, px);
      }
      dirty = true;
      wake();
    }

    let asked = false;
    function start() {
      if (asked) return;
      asked = true;
      const canvas = canvasEl!;
      const hasWebgl = typeof WebGL2RenderingContext !== 'undefined' && !!document.createElement('canvas').getContext('webgl2');
      const wide = window.innerWidth > 768;
      // The same files as the opening Earth: the browser already has them.
      Promise.all([load('earth/day.jpg'), load('earth/night.jpg'), load('earth/clouds-2k.jpg')])
        .then(([day, night, mask]) => {
          if (!alive) return;
          const maps: EarthMaps = { day, night, mask };
          // The day map keeps its detail; the night lights and the faint clouds need less.
          renderer = hasWebgl ? createWebglEarth(canvas, maps, { day: wide ? 4096 : 2048, night: 2048, mask: 1024 }) : null;
          if (!renderer) {
            const plain = document.createElement('canvas');
            canvas.replaceWith(plain);
            canvasEl = plain;
            renderer = createSoftwareEarth(plain, maps);
          }
          mode = renderer ? renderer.kind : 'none';
          measure();
        })
        .catch((error) => {
          console.warn(error);
          mode = 'none';
        });
    }

    // The planet is loaded when the section comes near, and only drawn while it is on screen.
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          near.disconnect();
        }
      },
      { rootMargin: '900px 0px' }
    );
    near.observe(box);
    const onScreen = new IntersectionObserver((entries) => {
      seen = entries.some((e) => e.isIntersecting);
      if (seen) {
        dirty = true;
        wake();
      }
    });
    onScreen.observe(box);
    const resize = new ResizeObserver(measure);
    resize.observe(lens);
    measure();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      near.disconnect();
      onScreen.disconnect();
      resize.disconnect();
      renderer?.dispose();
      renderer = null;
    };
  });
</script>

<div
  class="globe"
  class:ready={mode === 'webgl' || mode === 'canvas'}
  class:plain={mode === 'none'}
  class:grabbing
  class:pointing={!!hover}
  bind:this={boxEl}
  onpointerdown={onDown}
  onpointermove={onMove}
  onpointerup={onUp}
  onpointercancel={onUp}
  onpointerleave={() => (hover = null)}
  role="img"
  aria-label={ariaLabel}
>
  <!-- The picture is wider than its box, so the planet can come closer without an edge cutting it. -->
  <div class="lens" bind:this={lensEl}>
    <canvas bind:this={canvasEl}></canvas>
    <svg class="marks" aria-hidden="true">
      {#each lines as l, k (l.lat)}
        <path class="parallel" bind:this={lineEls[k]} />
      {/each}
      {#each dots as d, i (d.id)}
        <g class="dot {d.cls} {d.kind}" bind:this={dotEls[i]} style="display: none">
          {#if d.kind === 'case'}
            <rect x="-5.5" y="-5.5" width="11" height="11" rx="2" />
          {:else}
            <circle r={d.cls === 'sea' ? (compact ? 2 : 2.6) : compact ? 3.2 : 4.2} />
          {/if}
        </g>
      {/each}
      <!-- The labels of the parallels go over the marks, so a dot never hides them. -->
      {#each lines as l, k (l.lat)}
        <text class="parallel-label" text-anchor="middle" bind:this={lineLabelEls[k]}>{l.label}</text>
      {/each}
      <g class="sel" bind:this={selEl} style="display: none">
        <circle class="pulse" r="13" />
        <circle class="ring" r="13" />
        <text text-anchor="middle" y="-21">{selectedName}</text>
      </g>
    </svg>

    {#if hovered && hover}
      <div class="tooltip" style="left: {hover.x}px; top: {hover.y}px">
        <strong>{hovered.name}</strong><br /><span class="sub">{hovered.note}</span>
      </div>
    {/if}
  </div>
</div>
<p class="under">
  <span class="drag"
    ><svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"
      ><path d="M3.5 10a6.5 6.5 0 0 1 11.3-4.4M16.5 10a6.5 6.5 0 0 1-11.3 4.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /><path
        d="M15.2 2.6v3.3h-3.3M4.8 17.4v-3.3h3.3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      /></svg
    >{labels.drag}</span
  >
  {#if astray}
    <button class="btn small-btn" onclick={() => go({ lon: focus.lon, lat: focus.lat, dist: focus.dist })}>{labels.recentre}</button>
  {/if}
</p>

<style>
  /* No frame and no backdrop: the planet floats on the page, like the Earth that opens it. */
  .globe {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    touch-action: pan-y;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    /* Colours of the marks on the planet (the dark steps of the palette: the surface under them is dark). */
    --dry: #e66767;
    --wet: #3987e5;
    --flat: #b4b2a9;
    --gap: #070b14;
    /* How much wider than its box the picture is (BLEED in view.ts): room for the glow of the air. */
    --bleed: 1.3;
  }
  .globe.grabbing {
    cursor: grabbing;
  }
  .globe.pointing {
    cursor: pointer;
  }
  .lens {
    position: absolute;
    left: 50%;
    top: 50%;
    width: calc(100% * var(--bleed));
    height: calc(100% * var(--bleed));
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .lens :global(canvas) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    opacity: 0;
    transition: opacity 0.7s ease;
  }
  .globe.ready .lens :global(canvas) {
    opacity: 1;
  }
  /* No renderer: a plain disc where the planet would be; the marks still fall in their places. */
  .globe.plain .lens::before {
    content: '';
    position: absolute;
    inset: 15%;
    border-radius: 50%;
    background: radial-gradient(circle at 36% 32%, #3b78bd, #1c467c 60%, #0d2444);
    box-shadow: 0 0 46px rgba(74, 150, 232, 0.35);
  }
  .marks {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    opacity: 0;
    transition: opacity 0.7s ease;
  }
  .globe.ready .marks,
  .globe.plain .marks {
    opacity: 1;
  }
  .dot circle,
  .dot rect {
    stroke: var(--gap);
    stroke-width: 1.6;
    fill: var(--flat);
  }
  .dot.falling circle {
    fill: var(--dry);
  }
  .dot.rising circle {
    fill: var(--wet);
  }
  /* A hint (one test of two): the same hue, hollow. */
  .dot.hintFalling circle {
    fill: var(--gap);
    stroke: var(--dry);
    stroke-width: 2;
  }
  .dot.hintRising circle {
    fill: var(--gap);
    stroke: var(--wet);
    stroke-width: 2;
  }
  .dot.sea circle {
    fill: var(--gap);
    stroke: var(--flat);
    stroke-width: 1.2;
  }
  .dot.case rect {
    fill: #ffffff;
    stroke: var(--gap);
    stroke-width: 2;
  }
  .sel .ring {
    fill: none;
    stroke: #ffffff;
    stroke-width: 2.2;
    filter: drop-shadow(0 0 2px rgba(4, 6, 11, 0.9));
  }
  .sel .pulse {
    fill: none;
    stroke: #ffffff;
    stroke-width: 2;
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: pulse 2.4s ease-out infinite;
  }
  @keyframes pulse {
    0% {
      transform: scale(0.9);
      opacity: 0.7;
    }
    100% {
      transform: scale(2.3);
      opacity: 0;
    }
  }
  .sel text {
    fill: #ffffff;
    font-size: 14px;
    font-weight: 600;
    paint-order: stroke;
    stroke: rgba(4, 6, 11, 0.88);
    stroke-width: 4.5px;
    stroke-linejoin: round;
  }
  .parallel {
    fill: none;
    stroke: rgba(255, 255, 255, 0.78);
    stroke-width: 1.4;
    stroke-dasharray: 5 5;
  }
  .parallel-label {
    fill: #ffffff;
    font-size: 12px;
    font-weight: 600;
    paint-order: stroke;
    stroke: rgba(4, 6, 11, 0.92);
    stroke-width: 7px;
    stroke-linejoin: round;
  }
  .tooltip {
    white-space: normal;
    width: max-content;
    max-width: 230px;
  }
  .under {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px 14px;
    min-height: 30px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .drag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
</style>
