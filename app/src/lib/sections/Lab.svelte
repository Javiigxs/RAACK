<script lang="ts">
  // La investigación completa: qué, dónde, cuándo, mirar, veredicto y coartadas.
  // Sigue los cinco pasos del enunciado del reto y añade las comprobaciones.
  import { analyzeSeries } from '../analysis';
  import { RULES, VARS, VAR_ORDER, type SiteId } from '../catalog';
  import HeatGrid from '../charts/HeatGrid.svelte';
  import SeriesChart from '../charts/SeriesChart.svelte';
  import SiteMap from '../charts/SiteMap.svelte';
  import { coordText, covText } from '../format';
  import { t } from '../i18n';
  import { CASES, loadCase, reveal, selectSite, selectVariable, setDeseason, setPeriod, setQuality, ui } from '../state.svelte';
  import type { CaseData } from '../types';
  import Step from '../ui/Step.svelte';
  import Alibis from './Alibis.svelte';
  import CaseFile from './CaseFile.svelte';
  import Verdict from './Verdict.svelte';
  import Where from './Where.svelte';
  import Witness from './Witness.svelte';

  let { data }: { data: CaseData } = $props();

  const def = $derived(VARS[ui.variable]);
  const a = $derived(analyzeSeries(data, ui.variable, ui.site, ui.quality, ui.y0, ui.y1, ui.deseason));
  const years = $derived(ui.y1 - ui.y0 + 1);
  const cells = $derived<('cell' | 'merra')[]>(ui.variable === 'rain' ? ['cell'] : ui.variable === 'soil' ? ['merra'] : []);
  const isLst = $derived(ui.variable === 'lstDay' || ui.variable === 'lstNight');

  const coords = (s: SiteId) => (s === 'station' ? data.station : s === 'cell' || s === 'merra' ? data.cell : data.sites[s]);
  const here = $derived(coords(ui.site));

  const MIN_SPAN = 5;
  function onFrom(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const v = Math.min(Number(el.value), ui.y1 - MIN_SPAN + 1);
    el.value = String(v);
    setPeriod(v, ui.y1);
  }
  function onTo(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const v = Math.max(Number(el.value), ui.y0 + MIN_SPAN - 1);
    el.value = String(v);
    setPeriod(ui.y0, v);
  }

  function doReveal() {
    reveal();
    requestAnimationFrame(() => document.getElementById('step-verdict')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  function openCase(id: 'nights' | 'rain' | 'green') {
    loadCase(id);
    requestAnimationFrame(() => document.getElementById('step-look')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
</script>

<section id="lab" class="lab">
  <header class="lab-head">
    <p class="kicker">{t('lab.kicker')}</p>
    <h2>{t('lab.title')}</h2>
    <p class="lead">{t('lab.lead')}</p>
    <div class="cases">
      <span class="small">{t('lab.cases')}</span>
      {#each CASES as c (c.id)}
        <button class="btn small-btn" onclick={() => openCase(c.id)}>{t(`lab.case.${c.id}`)}</button>
      {/each}
    </div>
  </header>

  <Step n="1" id="step-what" kicker={t('s1.kicker')} title={t('s1.title')} lead={t('s1.lead')}>
    <div class="vars">
      {#each VAR_ORDER as id (id)}
        {@const v = VARS[id]}
        <button class="var" class:sel={ui.variable === id} aria-pressed={ui.variable === id} onclick={() => selectVariable(id)}>
          <span class="tag"><span class="dot {v.kind}"></span>{t(`kind.${v.kind}`)}</span>
          <span class="vname">{t(`var.${id}.name`)}</span>
          <span class="vdef">{t(`var.${id}.def`)}</span>
          <span class="vmeta">{t(`var.${id}.meta`)}</span>
        </button>
      {/each}
    </div>
  </Step>

  <Step n="2" id="step-where" kicker={t('s2.kicker')} title={t('s2.title')} lead={t('s2.lead')}>
    <div class="grid-2 place">
      <SiteMap {data} selected={ui.site} selectable={def.sites} onselect={(s) => selectSite(s)} {cells} showPins={def.sites.length > 2} />
      <div class="placeinfo">
        <div class="chips" role="group" aria-label={t('s2.title')}>
          {#each def.sites as s (s)}
            <button class="chipbtn" aria-pressed={ui.site === s} onclick={() => selectSite(s)}>{t(`site.${s}.short`)}</button>
          {/each}
        </div>
        <h3>{t(`site.${ui.site}.name`)}</h3>
        <p>{t(`site.${ui.site}.desc`)}</p>
        <p class="small mono">{coordText(here)}</p>
        {#if def.sites.length === 1}
          <p class="note">{t('s2.only')}</p>
        {:else if def.sites.length > 2}
          <p class="note">{t('s2.labels')}</p>
        {/if}
      </div>
    </div>
  </Step>

  <Step n="3" id="step-when" kicker={t('s3.kicker')} title={t('s3.title')} lead={t('s3.lead')}>
    <div class="period panel">
      <div class="sliders">
        <label for="p-from">{t('s3.from')} <output>{ui.y0}</output></label>
        <input id="p-from" type="range" min={def.y0} max={def.y1} step="1" value={ui.y0} oninput={onFrom} />
        <label for="p-to">{t('s3.to')} <output>{ui.y1}</output></label>
        <input id="p-to" type="range" min={def.y0} max={def.y1} step="1" value={ui.y1} oninput={onTo} />
      </div>
      <div class="presets">
        <button class="btn small-btn" onclick={() => setPeriod(def.y0, def.y1)}>{t('s3.full', { y0: def.y0, y1: def.y1 })}</button>
        <button class="btn small-btn" onclick={() => setPeriod(def.y1 - 14, def.y1)}>{t('s3.last15')}</button>
        {#if isLst}
          <button class="btn small-btn" onclick={() => setPeriod(def.y0, 2019)}>{t('s3.preDrift', { y0: def.y0 })}</button>
        {/if}
      </div>
      <div class="opts">
        <label class="check">
          <input type="checkbox" checked={ui.deseason} onchange={(e) => setDeseason((e.currentTarget as HTMLInputElement).checked)} />
          <span><strong>{t('s3.deseason')}</strong><br /><span class="small">{t('s3.deseasonHelp')}</span></span>
        </label>
        {#if def.hasQuality}
          <div class="quality">
            <div class="qrow">
              <strong>{t('s3.quality')}</strong>
              <div class="seg" role="group" aria-label={t('s3.quality')}>
                <button aria-pressed={ui.quality === 'standard'} onclick={() => setQuality('standard')}>{t('s3.q.standard')}</button>
                <button aria-pressed={ui.quality === 'strict'} onclick={() => setQuality('strict')}>{t('s3.q.strict')}</button>
              </div>
            </div>
            <span class="small">{t(ui.variable === 'ndvi' ? 's3.qHelp.ndvi' : 's3.qHelp.lst')}</span>
          </div>
        {/if}
      </div>
      <p class="rule">
        <span>{t('s3.summary', { years, valid: a.nValid, total: a.nTotal, cov: covText(a.nValid, a.nTotal) })}</span>
        <span class="badge" class:bad={years < RULES.minYears}>{years >= RULES.minYears ? '✓' : '✗'} {t('s3.ruleYears', { min: RULES.minYears })}</span>
        <span class="badge" class:bad={a.coverage < RULES.minCoverage}>{a.coverage >= RULES.minCoverage ? '✓' : '✗'} {t('s3.ruleCov', { min: RULES.minCoverage * 100 })}</span>
      </p>
    </div>
  </Step>

  <Step n="4" id="step-look" kicker={t('s4.kicker')} title={t('s4.title')} lead={t('s4.lead')}>
    <div class="chartcard card">
      <p class="chart-title">
        <strong>{t(`var.${ui.variable}.name`)}</strong> · {t(`site.${ui.site}.name`)} · {a.y0}–{a.y1}
      </p>
      <SeriesChart {a} />
      {#if def.group === 'heat'}
        <div class="squares-view">
          <h4>{t('sq.heat.in')}</h4>
          <p class="small">{t('sq.heat.inHelp')}</p>
          <HeatGrid monthly={a.monthly} clim={a.clim} name={t(`var.${ui.variable}.name`)} compact />
        </div>
      {/if}
      <div class="reveal">
        {#if ui.revealed}
          <p class="small">{t('s4.revealed')}</p>
        {:else}
          <button class="btn primary" onclick={doReveal}>{t('s4.reveal')} <span aria-hidden="true">→</span></button>
          <p class="small">{t(ui.guessTouched ? 's4.hintTouched' : 's4.hint')}</p>
        {/if}
      </div>
    </div>
  </Step>

  {#if ui.revealed}
    <Step n="5" id="step-verdict" kicker={t('s5.kicker')} title={t('s5.title')} lead={t('s5.lead')}>
      <Verdict {a} />
    </Step>
    <Step n="6" id="step-alibis" kicker={t('s6.kicker')} title={t('s6.title')} lead={t('s6.lead')}>
      <Alibis {data} {a} />
    </Step>
    <Step n="7" id="step-places" kicker={t('s7.kicker')} title={t('s7.title')} lead={t('s7.lead')}>
      <Where {data} {a} />
    </Step>
    <Step n="8" id="step-witness" kicker={t('s8.kicker')} title={t('s8.title')} lead={t('s8.lead')}>
      <Witness {data} {a} />
    </Step>
  {:else}
    <div class="locked" id="step-verdict">
      <h3>{t('locked.title')}</h3>
      <p>{t('locked.text')}</p>
      <button class="btn primary" onclick={doReveal}>{t('s4.reveal')} <span aria-hidden="true">→</span></button>
    </div>
  {/if}

  <CaseFile {data} {a} />
</section>

<style>
  .lab {
    padding-top: 56px;
  }
  .lab-head {
    display: grid;
    gap: 12px;
    border-top: 2px solid var(--ink);
    padding-top: 26px;
  }
  .lab-head h2 {
    font-size: clamp(28px, 4.4vw, 46px);
    letter-spacing: -0.025em;
  }
  .cases {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    margin-top: 4px;
  }
  .vars {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
    gap: 12px;
  }
  .var {
    text-align: left;
    display: grid;
    gap: 7px;
    align-content: start;
    padding: 15px 16px;
    border-radius: 14px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .var:hover {
    border-color: var(--border-strong);
  }
  .var.sel {
    border-color: var(--ink);
    box-shadow: 0 0 0 1px var(--ink);
  }
  .var .tag {
    justify-self: start;
  }
  .dot.mission {
    background: var(--series-1);
  }
  .dot.model {
    background: var(--series-2);
  }
  .dot.station {
    background: var(--series-3);
  }
  .vname {
    font-size: 17.5px;
    font-weight: 700;
    line-height: 1.2;
  }
  .vdef {
    font-size: 14px;
    color: var(--ink-2);
    line-height: 1.4;
  }
  .vmeta {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.35;
  }
  .place {
    align-items: start;
  }
  .placeinfo {
    display: grid;
    gap: 10px;
    align-content: start;
  }
  .placeinfo h3 {
    font-size: 20px;
    margin-top: 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .chipbtn {
    padding: 7px 13px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
  }
  .chipbtn[aria-pressed='true'] {
    background: var(--ink);
    color: var(--page);
    border-color: var(--ink);
  }
  .period {
    display: grid;
    gap: 16px;
  }
  .sliders {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    align-items: center;
  }
  .sliders label {
    font-weight: 600;
    font-size: 14.5px;
    color: var(--ink-2);
    white-space: nowrap;
  }
  .sliders output {
    display: inline-block;
    min-width: 3.2em;
    font-size: 19px;
    font-weight: 750;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    margin-left: 4px;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .opts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 28px;
    border-top: 1px solid var(--grid);
    padding-top: 14px;
  }
  .check {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    cursor: pointer;
  }
  .check input {
    margin-top: 3px;
    flex: none;
  }
  .quality {
    display: grid;
    gap: 6px;
  }
  .qrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .rule {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    font-size: 14.5px;
    color: var(--ink-2);
    border-top: 1px solid var(--grid);
    padding-top: 12px;
  }
  .badge {
    padding: 3px 9px;
    border-radius: 7px;
    border: 1px solid var(--border-strong);
    font-size: 12.5px;
    font-weight: 650;
    color: var(--ink);
    white-space: nowrap;
  }
  .badge.bad {
    border-style: dashed;
    color: var(--ink-2);
  }
  .chartcard {
    padding: clamp(14px, 2.4vw, 24px);
    display: grid;
    gap: 10px;
  }
  .chart-title {
    font-size: 15px;
    color: var(--ink-2);
  }
  .chart-title strong {
    color: var(--ink);
  }
  .squares-view {
    display: grid;
    gap: 8px;
    border-top: 1px solid var(--grid);
    padding-top: 14px;
    margin-top: 4px;
    min-width: 0;
  }
  .squares-view h4 {
    font-size: 15.5px;
  }
  .reveal {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    border-top: 1px solid var(--grid);
    padding-top: 14px;
    margin-top: 4px;
  }
  .locked {
    margin-top: 32px;
    padding: 26px;
    border: 1.5px dashed var(--axis);
    border-radius: var(--radius);
    display: grid;
    gap: 10px;
    justify-items: start;
  }
  .locked h3 {
    font-size: 20px;
  }
  .locked p {
    color: var(--ink-2);
    max-width: 68ch;
  }
  @media (max-width: 720px) {
    .opts {
      grid-template-columns: 1fr;
    }
  }
</style>
