<script lang="ts">
  // «La señal en cuadros»: lo primero que aparece sobre la Tierra desenfocada. Dos imágenes hechas
  // de cuadros, antes de cualquier estadística: azul para los días de lluvia de un año, rojo para
  // los meses más cálidos de lo habitual. La idea de los cuadros es de Fran (equipo RAACK).
  // Las cifras salen de las mismas funciones que usa el caso de Monterrey (analysis.ts).
  // Código escrito con ayuda de IA (Claude).
  import { analyzeSeries } from '../analysis';
  import { VARS, fmt, productOf } from '../catalog';
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
      <article class="card box rain">
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
        <button class="btn" onclick={() => open('case')}>{t('sq.rain.cta')} <span aria-hidden="true">→</span></button>
      </article>

      <article class="card box heat">
        <div class="box-head">
          <h3><span class="swatch" aria-hidden="true"></span>{t('sq.heat.title')}</h3>
          <VerdictChip verdict={heat.verdict} compact />
        </div>
        <p class="small">
          {t('sq.heat.sub', {
            name: t(`var.${HEAT.varId}.name`),
            place: t(`site.${HEAT.site}.name`),
            product: productOf(HEAT.varId, HEAT.site),
            y0: heat.y0,
            y1: heat.y1
          })}
        </p>
        <HeatGrid monthly={heat.monthly} clim={heat.clim} name={t(`var.${HEAT.varId}.name`)} />
        <p class="caption">{heatCaption}</p>
        <button class="btn" onclick={() => open('step-look')}>{t('sq.heat.cta')} <span aria-hidden="true">→</span></button>
      </article>
    </div>
  {/if}

  <p class="numhint"><span class="i" aria-hidden="true">i</span>{t('x.hint')}</p>
</section>

<style>
  .squares {
    display: grid;
    gap: 20px;
    padding: clamp(28px, 5vw, 56px) 0 clamp(26px, 4vw, 44px);
  }
  .head {
    display: grid;
    gap: 10px;
  }
  .head h2 {
    font-size: clamp(30px, 5vw, 54px);
    letter-spacing: -0.03em;
    line-height: 1.02;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    align-items: start;
  }
  .box {
    padding: clamp(16px, 2.4vw, 24px);
    display: grid;
    gap: 12px;
    justify-items: start;
    min-width: 0;
  }
  .box > :global(*) {
    width: 100%;
  }
  .box > .btn {
    width: auto;
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
    font-size: clamp(18px, 2.1vw, 21px);
  }
  .swatch {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 3px;
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
    gap: 6px;
  }
  .stepper select {
    padding: 6px 10px;
    font-variant-numeric: tabular-nums;
  }
  .round {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    cursor: pointer;
    font-size: 19px;
    line-height: 1;
    display: grid;
    place-items: center;
    padding: 0 0 2px;
  }
  .round:hover:not(:disabled) {
    background: var(--surface-2);
  }
  .round:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .legend {
    margin: 0;
  }
  .key-box.ring {
    background: transparent;
    outline: 2px solid var(--ink);
    outline-offset: -1px;
  }
  .caption {
    font-size: 16.5px;
    line-height: 1.45;
    max-width: 62ch;
  }
  .waiting {
    padding: 28px;
    text-align: center;
    color: var(--ink-2);
  }
  @media (max-width: 900px) {
    .pair {
      grid-template-columns: 1fr;
    }
  }
</style>
