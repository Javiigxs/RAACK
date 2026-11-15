<script lang="ts">
  // RAACK · Trend Detective — NASA Space Apps Challenge 2026.
  // Abre con la Tierra (la cámara se aleja, se detiene y el planeta se desenfoca); encima va la
  // información: la señal en cuadros y las dos investigaciones (el caso del agua y el de Monterrey).
  // Interfaz escrita con ayuda de IA (Claude) para el equipo RAACK.
  import { onMount } from 'svelte';
  import EarthIntro from './lib/earth/EarthIntro.svelte';
  import NumberExplainer from './lib/explain/NumberExplainer.svelte';
  import { t } from './lib/i18n';
  import CaseTabs from './lib/sections/CaseTabs.svelte';
  import Header from './lib/sections/Header.svelte';
  import Hero from './lib/sections/Hero.svelte';
  import Lab from './lib/sections/Lab.svelte';
  import OpeningCase from './lib/sections/OpeningCase.svelte';
  import Squares from './lib/sections/Squares.svelte';
  import { setView, ui } from './lib/state.svelte';
  import type { CaseData } from './lib/types';
  import { toCases } from './lib/ui/scroll';
  import type { WaterData } from './lib/water/types';
  import WaterCase from './lib/water/WaterCase.svelte';

  // $state.raw: los datos no cambian, así que no hace falta volverlos reactivos por dentro.
  let data = $state.raw<CaseData | null>(null);
  let water = $state.raw<WaterData | null>(null);
  let error = $state('');
  let waterError = $state('');

  async function load<T>(file: string): Promise<T> {
    const r = await fetch(file);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  }

  onMount(() => {
    try {
      const params = new URLSearchParams(location.search);
      const saved = localStorage.getItem('raack-lang');
      const lang = params.get('lang') ?? saved;
      if (lang === 'es' || lang === 'en') ui.lang = lang;
      // Los enlaces antiguos al caso de Monterrey (#case, #lab, #file…) siguen abriéndolo.
      const cityHash = /^#(case|lab|file|beat-|step-)/.test(location.hash);
      if (params.get('view') === 'city' || cityHash) setView('city');
    } catch {
      // sin almacenamiento local: se queda en inglés y en el caso del agua
    }
    load<WaterData>('data/water.json')
      .then((d) => (water = d))
      .catch((e) => (waterError = e instanceof Error ? e.message : String(e)));
    load<CaseData>('data/monterrey.json')
      .then((d) => (data = d))
      .catch((e) => (error = e instanceof Error ? e.message : String(e)));
  });

  $effect(() => {
    document.documentElement.lang = ui.lang;
    document.title = t(ui.view === 'water' ? 'w.docTitle' : 'app.docTitle');
  });

  function openWater() {
    setView('water');
    toCases();
  }
</script>

<a class="skip" href={ui.view === 'water' ? '#w-verdict' : '#case'}>{t(ui.view === 'water' ? 'w.skip' : 'header.skip')}</a>
<Header />
<EarthIntro />

<!-- The information: it scrolls over the blurred planet. -->
<div class="sheet" id="start">
  <Squares {data} />
  <CaseTabs />

  <main>
    {#if ui.view === 'water'}
      {#if water}
        <WaterCase data={water} />
      {:else}
        <div class="wrap">
          {#if waterError}
            <p class="status card" role="alert">{t('app.error')} <span class="mono">{waterError}</span></p>
          {:else}
            <p class="status card" aria-live="polite">{t('w.loading')}</p>
          {/if}
        </div>
      {/if}
    {:else}
      <Hero />
      <div class="wrap">
        <p class="back">
          <span>{t('w.back.text')}</span>
          <button class="btn small-btn" onclick={openWater}><span aria-hidden="true">←</span> {t('w.back.cta')}</button>
        </p>
        {#if data}
          <OpeningCase {data} />
          <Lab {data} />
        {:else if error}
          <p class="status card" role="alert">{t('app.error')} <span class="mono">{error}</span></p>
        {:else}
          <p class="status card" aria-live="polite">{t('app.loading')}</p>
        {/if}
      </div>
    {/if}
  </main>

  <footer class="wrap">
    <p>{t('footer.line1')}</p>
    <p class="muted">{t('footer.line2')}</p>
  </footer>
</div>

<NumberExplainer />

<style>
  .skip {
    position: absolute;
    left: -999px;
    top: 8px;
    background: var(--ink);
    color: var(--page);
    padding: 8px 14px;
    border-radius: 8px;
    z-index: 50;
  }
  .skip:focus {
    left: 8px;
  }
  /* A sheet of the page colour, slightly see-through: the blurred planet stays behind the text. */
  .sheet {
    position: relative;
    background: color-mix(in srgb, var(--page) var(--sheet-opacity, 91%), transparent);
    /* The globe of the world section has no frame and may reach past the gutters of the page:
       it is cut at the edge of the window, without a sideways scroll. */
    overflow-x: clip;
  }
  .sheet::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 100%;
    height: clamp(90px, 22svh, 220px);
    /* Eased, so the sheet has no visible edge where it starts. */
    background: linear-gradient(
      to bottom,
      transparent 0%,
      color-mix(in srgb, var(--page) 6%, transparent) 22%,
      color-mix(in srgb, var(--page) 24%, transparent) 46%,
      color-mix(in srgb, var(--page) 56%, transparent) 72%,
      color-mix(in srgb, var(--page) var(--sheet-opacity, 91%), transparent) 100%
    );
    pointer-events: none;
  }
  main {
    padding-bottom: 56px;
  }
  .status {
    padding: 28px;
    text-align: center;
    color: var(--ink-2);
    margin-top: 28px;
  }
  .back {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    font-size: 14.5px;
    color: var(--ink-2);
    margin-bottom: 18px;
  }
  footer {
    border-top: 1px solid var(--grid);
    padding: 22px 0 40px;
    font-size: 13.5px;
    color: var(--ink-2);
    display: grid;
    gap: 4px;
  }
</style>
