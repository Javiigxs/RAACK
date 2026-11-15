<script lang="ts">
  // «La señal en cuadros»: lo primero que aparece sobre la Tierra desenfocada. Dos imágenes hechas
  // de cuadros, antes de cualquier estadística: azul para los días de lluvia de un año, rojo para
  // los meses más cálidos de lo habitual. La idea de los cuadros es de Fran (equipo RAACK).
  // Las cifras salen de las mismas funciones que usa el caso de Monterrey (analysis.ts).
  // Código escrito con ayuda de IA (Claude).
  import { analyzeSeries } from '../analysis';
  import { VARS, fmt, fmtSigned, productOf } from '../catalog';
  import HeatGrid from '../charts/HeatGrid.svelte';
  import RainCalendar from '../charts/RainCalendar.svelte';
  import { ciText, rateText } from '../format';
  import { t } from '../i18n';
  import { loadCase, setView, ui } from '../state.svelte';
  import { rainYears } from '../stats/rain';
  import type { CaseData } from '../types';
  import VerdictChip from '../ui/VerdictChip.svelte';

  let { data }: { data: CaseData | null } = $props();

  // ---- lluvia: un cuadro por día
  const years = $derived(data ? rainYears(data.daily.imerg_mm, data.daily.start, VARS.rain.y0, VARS.rain.y1).filter((y) => y.complete) : []);
  /** El año que abre la sección: 2020, cuando cinco días dejaron la mitad de la lluvia. */
  let picked = $state(2020);
  const year = $derived(years.find((y) => y.year === picked) ?? years[years.length - 1] ?? null);
  const at = $derived(year ? years.indexOf(year) : -1);
  const step = (d: number) => {
    const next = years[at + d];
    if (next) picked = next.year;
  };

  // ---- temperatura: un cuadro por mes
  const HEAT = { varId: 'lstNight', site: 'mtycentro' } as const;
  const heat = $derived(data ? analyzeSeries(data, HEAT.varId, HEAT.site, 'standard', VARS[HEAT.varId].y0, VARS[HEAT.varId].y1, true) : null);
  const heatCaption = $derived.by(() => {
    if (!heat) return '';
    const level = heat.verdict.level;
    if (level === 'insufficient') return t('sq.heat.caption.insufficient');
    const p = { subject: t(`var.${HEAT.varId}.subject`), rate: rateText(HEAT.varId, heat.perDecade), ci: ciText(HEAT.varId, heat.ci) };
    if (level === 'none' || level === 'weak') return t('sq.heat.caption.none', p);
    return t(heat.verdict.direction > 0 ? 'sq.heat.caption.up' : 'sq.heat.caption.down', p);
  });

  // ---- temperatura: el año elegido, marcado en la cuadrícula (pedido de Fran, 15 de noviembre de 2026)
  const heatYears = $derived(heat ? Array.from({ length: Math.floor(heat.monthly.values.length / 12) }, (_, i) => heat.monthly.y0 + i) : []);
  /** Abre en el mismo año que la lluvia. */
  let heatPicked = $state(2020);
  const heatYear = $derived(heatYears.includes(heatPicked) ? heatPicked : (heatYears[heatYears.length - 1] ?? null));
  const heatAt = $derived(heatYear === null ? -1 : heatYears.indexOf(heatYear));
  const heatStep = (d: number) => {
    const next = heatYears[heatAt + d];
    if (next !== undefined) heatPicked = next;
  };
  const longMonth = (m: number) =>
    new Intl.DateTimeFormat(ui.lang === 'es' ? 'es-MX' : 'en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2001, m, 15)));
  /** Cuántos meses del año elegido fueron más cálidos que su media, y cuál se pasó más. */
  const heatYearCaption = $derived.by(() => {
    if (!heat || heatYear === null) return '';
    const base = (heatYear - heat.monthly.y0) * 12;
    const diffs: { m: number; d: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const v = heat.monthly.values[base + m];
      const c = heat.clim[m];
      if (v !== null && v !== undefined && c !== null && c !== undefined) diffs.push({ m, d: v - c });
    }
    if (!diffs.length) return t('sq.heat.year.nodata', { year: heatYear });
    const warm = diffs.filter((x) => x.d > 0);
    if (!warm.length) return t('sq.heat.year.none', { year: heatYear, n: diffs.length });
    const top = warm.reduce((a, b) => (b.d > a.d ? b : a));
    return t('sq.heat.year.some', { year: heatYear, warm: warm.length, n: diffs.length, month: longMonth(top.m), diff: fmtSigned(top.d, 1, ui.lang) });
  });

  function open(target: 'case' | 'step-look') {
    if (target === 'step-look') loadCase('nights');
    setView('city');
    // The case is drawn after the view changes: wait for it before scrolling to it.
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: 'start' })));
  }
</script>

<section class="squares wrap" id="squares" aria-labelledby="sq-title">
  <header class="head">
    <p class="kicker">{t('sq.kicker')}</p>
    <h2 id="sq-title">{t('sq.title')}</h2>
    <p class="lead">{t('sq.lead')}</p>
  </header>

  {#if !data || !year || !heat}
    <p class="card waiting" aria-live="polite">{t('sq.loading')}</p>
  {:else}
    <div class="pair">
      <article class="box rain">
        <div class="box-head">
          <h3><span class="swatch" aria-hidden="true"></span>{t('sq.rain.title')}</h3>
          <div class="stepper" role="group" aria-label={t('sq.rain.year')}>
            <button class="round" onclick={() => step(-1)} disabled={at <= 0} aria-label={t('sq.rain.prev')}>‹</button>
            <select aria-label={t('sq.rain.year')} bind:value={picked}>
              {#each years as y (y.year)}<option value={y.year}>{y.year}</option>{/each}
            </select>
            <button class="round" onclick={() => step(1)} disabled={at >= years.length - 1} aria-label={t('sq.rain.next')}>›</button>
          </div>
        </div>
        <p class="small">{t('sq.rain.sub')}</p>
        <RainCalendar {year} />
        <div class="legend" aria-hidden="true">
          <span class="item"><span class="key-box" style="background: var(--seq-0)"></span>&lt; 1 mm</span>
          <span class="item"><span class="key-box" style="background: var(--seq-1)"></span>1–5</span>
          <span class="item"><span class="key-box" style="background: var(--seq-2)"></span>5–20</span>
          <span class="item"><span class="key-box" style="background: var(--seq-3)"></span>20–50</span>
          <span class="item"><span class="key-box" style="background: var(--seq-4)"></span>≥ 50 mm</span>
          <span class="item"><span class="key-box ring"></span>{t('oc.b2.ringLegend')}</span>
        </div>
        <p class="caption">
          {t('sq.rain.caption', {
            year: year.year,
            wet: year.wetDays,
            total: fmt(year.total, 0, ui.lang),
            share: ui.lang === 'es' ? `${fmt(year.top5Share, 1, ui.lang)} %` : `${fmt(year.top5Share, 1, ui.lang)}%`
          })}
        </p>
        <button class="textlink" onclick={() => open('case')}>{t('sq.rain.cta')} <span aria-hidden="true">→</span></button>
      </article>

      <article class="box heat">
        <div class="box-head">
          <h3><span class="swatch" aria-hidden="true"></span>{t('sq.heat.title')}</h3>
          {#if heatYear !== null}
            <div class="stepper" role="group" aria-label={t('sq.rain.year')}>
              <button class="round" onclick={() => heatStep(-1)} disabled={heatAt <= 0} aria-label={t('sq.rain.prev')}>‹</button>
              <select aria-label={t('sq.rain.year')} bind:value={heatPicked}>
                {#each heatYears as y (y)}<option value={y}>{y}</option>{/each}
              </select>
              <button class="round" onclick={() => heatStep(1)} disabled={heatAt >= heatYears.length - 1} aria-label={t('sq.rain.next')}>›</button>
            </div>
          {/if}
        </div>
        <VerdictChip verdict={heat.verdict} compact />
        <p class="small">
          {t('sq.heat.sub', {
            name: t(`var.${HEAT.varId}.name`),
            place: t(`site.${HEAT.site}.name`),
            product: productOf(HEAT.varId, HEAT.site),
            y0: heat.y0,
            y1: heat.y1
          })}
        </p>
        <HeatGrid monthly={heat.monthly} clim={heat.clim} name={t(`var.${HEAT.varId}.name`)} year={heatYear}>
          <p class="caption" aria-live="polite">{heatYearCaption}</p>
          <p class="caption">{heatCaption}</p>
        </HeatGrid>
        <button class="textlink" onclick={() => open('step-look')}>{t('sq.heat.cta')} <span aria-hidden="true">→</span></button>
      </article>
    </div>
  {/if}

  <p class="numhint"><span class="i" aria-hidden="true">i</span>{t('x.hint')}</p>
</section>

<style>
  .squares {
    display: grid;
    gap: var(--gap-block);
    padding: clamp(40px, 7vw, 96px) 0 0;
  }
  .head {
    display: grid;
    gap: 14px;
  }
  .head h2 {
    font-size: clamp(32px, 5vw, 64px);
    letter-spacing: -0.042em;
    line-height: 1;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gap-block) 64px;
    align-items: start;
  }
  /* Each picture sits on the page itself, under a thin line: no card around it. */
  .box {
    display: grid;
    /* One column that never grows past its half of the page: without it, the open table of
       temperatures widened the column and pushed it out of the page on the right (playbook pb157). */
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    justify-items: start;
    min-width: 0;
    border-top: 1px solid var(--border-strong);
    padding-top: 20px;
  }
  /* The verdict chip of the temperature column keeps its own width. */
  .box > :global(.chip) {
    width: auto;
  }
  .box > :global(*) {
    width: 100%;
  }
  .box > .textlink {
    width: auto;
    margin-top: 4px;
  }
  .box-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 14px;
  }
  .box-head h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: clamp(20px, 2vw, 24px);
    letter-spacing: -0.022em;
    /* A long title breaks onto two lines before the year selector leaves the top right corner. */
    flex: 1 1 0;
    min-width: 13ch;
  }
  .swatch {
    flex: none;
    width: 11px;
    height: 11px;
    border-radius: var(--r-mark);
  }
  .rain .swatch {
    background: var(--seq-2);
  }
  .heat .swatch {
    background: var(--heat-2);
  }
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .stepper select {
    padding: 6px 8px;
    font-variant-numeric: tabular-nums;
  }
  .round {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    color: var(--ink-2);
    display: grid;
    place-items: center;
    padding: 0 0 2px;
    transition:
      background-color 0.15s,
      color 0.15s;
  }
  .round:hover:not(:disabled) {
    background: color-mix(in srgb, var(--ink) 8%, transparent);
    color: var(--ink);
  }
  .round:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .legend {
    margin: 0;
  }
  .key-box.ring {
    background: transparent;
    outline: 1.5px solid var(--ink);
    outline-offset: -1px;
  }
  .caption {
    font-size: var(--fs-body);
    line-height: 1.5;
    max-width: 56ch;
  }
  .waiting {
    padding: 28px;
    text-align: center;
    color: var(--ink-2);
  }
  @media (max-width: 900px) {
    .pair {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
