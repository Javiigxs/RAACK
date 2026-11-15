<script lang="ts">
  // The opening of the site: the Earth as a fixed backdrop, and a first screen that stays in place
  // while the scroll pulls the camera back, holds, and blurs the planet behind the information.
  // Visual reference: the 3D hero tutorial by Robinzon100; written from scratch for this site
  // (see sequence.ts). Code written with AI assistance (Claude) for team RAACK.
  import { onMount } from 'svelte';
  import { t } from '../i18n';
  import { isStill, motion as motionChoice, setMotion } from '../ui/motion.svelte';
  import { EARTH, approach, clamp01, phaseEnds, progressAt, shotAt, spinForLon, stillShotAt } from './sequence';
  import { createSoftwareEarth } from './software';
  import { createWebglEarth, type EarthMaps, type EarthRenderer } from './webgl';

  let layerEl = $state<HTMLDivElement | null>(null);
  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let trackEl = $state<HTMLElement | null>(null);
  let copyEl = $state<HTMLDivElement | null>(null);
  let hintEl = $state<HTMLParagraphElement | null>(null);
  /** People who ask for less motion get a still planet and no pinned screen. */
  let still = $state(false);
  /** 'loading' until the maps arrive; 'none' when nothing can draw them (the page works without). */
  let mode = $state<'loading' | 'webgl' | 'canvas' | 'none'>('loading');
  /** Set while the page is mounted: switches between the sequence and the still planet. */
  let onMotionChange: (() => void) | null = null;

  // The system or the reader changed their mind about motion (ui/motion.svelte.ts).
  $effect(() => {
    void motionChoice.system;
    void motionChoice.choice;
    onMotionChange?.();
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
    const layer = layerEl!;
    const canvas = canvasEl!;
    const track = trackEl!;
    const copy = copyEl!;
    const hint = hintEl!;
    const root = document.documentElement;
    const ends = phaseEnds();
    // The still version follows the system unless the reader chose otherwise for this site: the
    // button in the header, or ?motion=full / ?motion=less in the address (ui/motion.svelte.ts).
    const wantsStill = () => isStill();
    still = wantsStill();

    let renderer: EarthRenderer | null = null;
    let alive = true;
    let raf = 0;
    let last = 0;
    let lastDraw = 0;
    let shown = -1;
    let spin = spinForLon(EARTH.lonStartDeg);
    let vw = 1;
    let vh = 1;
    let narrow = false;
    let trackTop = 0;
    let trackHeight = 0;
    let redraw = true;

    function measure() {
      vw = window.innerWidth;
      vh = window.innerHeight;
      narrow = vw <= EARTH.narrowMaxWidth;
      trackTop = track.offsetTop;
      trackHeight = track.offsetHeight;
      if (renderer) {
        // At most two device pixels per CSS pixel and about 3.7 million pixels in all.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = Math.min(1, Math.sqrt(3.7e6 / (vw * dpr * vh * dpr)));
        renderer.resize(Math.max(1, Math.round(vw * dpr * scale)), Math.max(1, Math.round(vh * dpr * scale)));
      }
      redraw = true;
    }

    function target(): number {
      // Without the pinned screen, the planet softens while the first screen scrolls away.
      return still ? clamp01(window.scrollY / (0.7 * vh)) : progressAt(window.scrollY, trackTop, trackHeight, vh);
    }

    function frame(now: number) {
      raf = 0;
      if (!alive) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const goal = target();
      const before = shown;
      shown = shown < 0 || still ? goal : approach(shown, goal, dt);
      const shot = still ? stillShotAt(shown, narrow) : shotAt(shown, narrow);
      spin += EARTH.spin * shot.drift * dt;

      if (shown !== before) {
        layer.style.filter = shot.blur > 0.05 ? `blur(${shot.blur.toFixed(2)}px)` : 'none';
        layer.style.opacity = shot.opacity.toFixed(3);
        copy.style.opacity = shot.text.toFixed(3);
        copy.style.transform = shot.text < 1 ? `translateY(${((shot.text - 1) * 28).toFixed(1)}px) scale(${(0.95 + 0.05 * shot.text).toFixed(4)})` : 'none';
        copy.style.visibility = shot.text <= 0.01 ? 'hidden' : 'visible';
        hint.style.opacity = (shot.text * shot.text).toFixed(3);
        root.dataset.intro = shown < ends.text * 0.9 && !still ? 'on' : 'off';
      }

      const drifting = shot.drift > 0;
      if (renderer && (redraw || shown !== before || drifting)) {
        // The 2D fallback is heavy: while only the drift changes, 30 pictures per second are enough.
        const due = renderer.kind === 'webgl' || redraw || shown !== before || now - lastDraw > 32;
        if (due) {
          renderer.draw({ cam: shot.cam, tilt: shot.tilt, spin });
          lastDraw = now;
          redraw = false;
        }
      }
      // Nothing left to move: the loop sleeps until the next scroll or resize.
      if (shown !== goal || (drifting && renderer)) wake();
      else last = 0;
    }

    function wake() {
      if (!raf && alive) raf = requestAnimationFrame(frame);
    }
    const onResize = () => {
      measure();
      wake();
    };
    const onMotion = () => {
      if (still === wantsStill()) return;
      still = wantsStill();
      shown = -1;
      // The track changes height with the mode: measure again once the page has laid it out.
      requestAnimationFrame(onResize);
    };
    onMotionChange = onMotion;

    measure();
    wake();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', onResize);
    // The page grows when the data arrives; the track itself does not move, but fonts and bars can.
    const observer = new ResizeObserver(onResize);
    observer.observe(track);

    // Phones, and browsers that will use the 2D fallback, get the half-size cloud mask.
    const small = window.innerWidth <= EARTH.narrowMaxWidth;
    const hasWebgl = typeof WebGL2RenderingContext !== 'undefined' && !!document.createElement('canvas').getContext('webgl2');
    Promise.all([load('earth/day.jpg'), load('earth/night.jpg'), load(small || !hasWebgl ? 'earth/clouds-2k.jpg' : 'earth/clouds.jpg')])
      .then(([day, night, mask]) => {
        if (!alive) return;
        const maps: EarthMaps = { day, night, mask };
        renderer = hasWebgl ? createWebglEarth(canvas, maps, small ? 2048 : 4096) : null;
        if (!renderer) {
          // A canvas that was asked for WebGL cannot give a 2D context: the fallback gets a new one.
          const plain = document.createElement('canvas');
          canvas.replaceWith(plain);
          canvasEl = plain;
          renderer = createSoftwareEarth(plain, maps);
        }
        mode = renderer ? renderer.kind : 'none';
        measure();
        wake();
      })
      .catch((error) => {
        console.warn(error);
        mode = 'none';
      });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', onResize);
      onMotionChange = null;
      observer.disconnect();
      renderer?.dispose();
      delete root.dataset.intro;
    };
  });
</script>

<div class="earth" class:ready={mode === 'webgl' || mode === 'canvas'} class:plain={mode === 'none'} aria-hidden="true" bind:this={layerEl}>
  <canvas bind:this={canvasEl}></canvas>
</div>

<section class="track" class:still id="intro" aria-labelledby="intro-title" bind:this={trackEl} style="--scroll: {EARTH.scrollDistance}">
  <div class="stage">
    <div class="copy" bind:this={copyEl}>
      <p class="kicker">{t('hero.kicker')}</p>
      <h1 id="intro-title">{t('intro.title')}</h1>
      <p class="lead">{t('intro.lead')}</p>
      <a class="btn primary" href="#start">{t('intro.cta')} <span aria-hidden="true">↓</span></a>
    </div>
    <p class="hint" bind:this={hintEl} aria-hidden="true"><span class="mouse"></span>{t('intro.hint')}</p>
    <!-- The system asks for less motion, so the opening holds still: one press plays it, and the
         choice is kept for this site. Where the scroll hint sits when the sequence is on. -->
    {#if still && motionChoice.system}
      <button class="play" onclick={() => setMotion('full')}>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
        {t('wr.motion.on')}
      </button>
    {/if}
  </div>
</section>

<style>
  .earth {
    position: fixed;
    inset: 0;
    /* Above the page colour, below everything else. */
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
    will-change: filter, opacity;
  }
  .earth :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.9s ease;
  }
  .earth.ready :global(canvas) {
    opacity: 1;
  }
  /* No renderer at all: a quiet glow where the planet would rest. */
  .earth.plain {
    background: radial-gradient(circle at 50% 54%, color-mix(in srgb, var(--accent) 34%, transparent) 0, color-mix(in srgb, var(--accent) 10%, transparent) 26vmin, transparent 40vmin);
  }
  .track {
    position: relative;
    height: calc(100svh * (1 + var(--scroll)));
    /* The first screen starts under the translucent header. */
    margin-top: calc(-1 * var(--header-h, 59px));
  }
  .track.still {
    height: 100svh;
  }
  .stage {
    position: sticky;
    top: 0;
    height: 100svh;
    display: grid;
    grid-template-rows: 1fr auto;
    justify-items: center;
    overflow: hidden;
  }
  .copy {
    width: min(1080px, 100% - 40px);
    margin-top: clamp(84px, 11.5svh, 132px);
    display: grid;
    gap: 18px;
    justify-items: center;
    align-content: start;
    text-align: center;
    transform-origin: 50% 40%;
    will-change: opacity, transform;
  }
  h1 {
    font-size: clamp(42px, 7.2vw, 96px);
    font-weight: 500;
    letter-spacing: -0.048em;
    line-height: 0.94;
    max-width: 13ch;
  }
  .lead {
    font-size: var(--fs-lead);
    max-width: 50ch;
    color: var(--ink-2);
    /* The glow of the horizon can reach the last line: a halo of the page colour keeps it readable. */
    text-shadow:
      0 0 14px var(--page),
      0 0 4px var(--page);
  }
  .btn {
    margin-top: 8px;
    padding: 13px 22px;
    font-size: var(--fs-body);
  }
  .hint {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-bottom: clamp(14px, 3svh, 28px);
    padding: 6px 13px 6px 9px;
    border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--page) 72%, transparent);
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--ink-2);
  }
  .mouse {
    width: 14px;
    height: 22px;
    border-radius: 8px;
    border: 1.5px solid currentColor;
    position: relative;
  }
  .mouse::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 4px;
    width: 2px;
    height: 5px;
    margin-left: -1px;
    border-radius: 1px;
    background: currentColor;
    animation: wheel 1.6s ease-in-out infinite;
  }
  @keyframes wheel {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    70%,
    100% {
      transform: translateY(6px);
      opacity: 0;
    }
  }
  .track.still .hint {
    display: none;
  }
  /* Still, the first screen ends under the soft edge of the sheet that follows: lifted above it,
     the button stays as legible as the rest of the screen. */
  .track.still .stage {
    z-index: 1;
  }
  /* The same pill as the scroll hint, but a button: it turns the opening sequence on. */
  .play {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: clamp(14px, 3svh, 28px);
    padding: 8px 15px 8px 11px;
    border: 0;
    border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--page) 78%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    font-size: var(--fs-small);
    font-weight: 500;
    color: var(--ink);
    cursor: pointer;
    transition: background-color 0.15s;
  }
  .play:hover {
    background: var(--page);
  }
  @media (max-width: 600px) {
    .copy {
      margin-top: clamp(84px, 13svh, 120px);
      gap: 13px;
    }
  }
</style>
