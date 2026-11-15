<script lang="ts" module>
  import type { Certainty } from './engine';

  export interface BalanceRow {
    id: string;
    label: string;
    sub: string;
    /** Change per decade and its 95% interval, already in the unit of the panel. */
    value: number;
    lo: number;
    hi: number;
    certainty: Certainty;
    dir: 1 | -1 | 0;
    decimals: number;
  }
</script>

<script lang="ts">
  // Who is moving? Change per decade of every term that shares a unit, on one axis, with its
  // 95% interval. An interval that crosses zero is the picture of "no evidence".
  // Code written with AI assistance (Claude) for team RAACK.
  import { scaleLinear } from 'd3-scale';
  import { fmtSigned } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import CertaintyChip from './CertaintyChip.svelte';

  let { rows, unit, title, note = '' }: { rows: BalanceRow[]; unit: string; title: string; note?: string } = $props();

  const scale = $derived.by(() => {
    let lo = 0;
    let hi = 0;
    for (const r of rows) {
      if (r.certainty === 'nodata' && !Number.isFinite(r.value)) continue;
      lo = Math.min(lo, r.lo, r.value);
      hi = Math.max(hi, r.hi, r.value);
    }
    if (lo === hi) {
      lo = -1;
      hi = 1;
    }
    return scaleLinear().domain([lo, hi]).nice(5).range([0, 100]);
  });
  const ticks = $derived(scale.ticks(5));
  const tickDec = $derived(ticks.length > 1 && Math.abs(ticks[1] - ticks[0]) < 1 ? 1 : 0);
  const zero = $derived(scale(0));
  const range = (lo: number, hi: number) => t('fmt.range', { lo: fmtSigned(lo, 0, ui.lang), hi: fmtSigned(hi, 0, ui.lang) });
</script>

<div class="balance">
  <div class="head">
    <h3>{title}</h3>
    <span class="small">{unit}</span>
  </div>
  <div class="rows">
    {#each rows as r (r.id)}
      {@const usable = Number.isFinite(r.value)}
      <div class="frow">
        <div class="flabel">
          <strong>{r.label}</strong>
          <span class="small muted">{r.sub}</span>
        </div>
        <div
          class="fplot"
          role="img"
          aria-label={usable ? t('w.bal.rowAria', { name: `${r.label}, ${r.sub}`, value: fmtSigned(r.value, r.decimals, ui.lang), ci: range(r.lo, r.hi) }) : r.label}
          title={usable ? `${fmtSigned(r.value, r.decimals, ui.lang)} · ${t('w.fact.ci')} ${range(r.lo, r.hi)}` : ''}
        >
          {#each ticks as tk (tk)}
            <span class="grid" class:zero={tk === 0} style="left: {scale(tk)}%"></span>
          {/each}
          {#if usable}
            <span
              class="bar"
              class:up={r.dir > 0}
              class:down={r.dir < 0}
              class:pale={r.certainty !== 'confirmed'}
              style="left: {Math.min(zero, scale(r.value))}%; width: {Math.abs(scale(r.value) - zero)}%"
            ></span>
            <span class="whisk" style="left: {scale(r.lo)}%; width: {scale(r.hi) - scale(r.lo)}%"></span>
          {/if}
        </div>
        <div class="fval">
          <span class="v">{usable ? fmtSigned(r.value, r.decimals, ui.lang) : '—'}</span>
          <CertaintyChip label={r.certainty} compact />
        </div>
      </div>
    {/each}
    <div class="frow axis" aria-hidden="true">
      <div class="flabel"></div>
      <div class="fplot ticks">
        {#each ticks as tk (tk)}
          <span class="tk" style="left: {scale(tk)}%">{fmtSigned(tk, tickDec, ui.lang)}</span>
        {/each}
      </div>
      <div class="fval"></div>
    </div>
  </div>
  <div class="legend" aria-hidden="true">
    <span class="item"><span class="key-box" style="background: var(--down)"></span>{t('w.bal.falling')}</span>
    <span class="item"><span class="key-box" style="background: var(--up)"></span>{t('w.bal.rising')}</span>
    <span class="item"><span class="key-box" style="background: var(--down); opacity: 0.3"></span>{t('w.bal.pale')}</span>
    <span class="item"><span class="key-line" style="border-color: var(--ink)"></span>{t('w.bal.interval')}</span>
  </div>
  {#if note}<p class="note">{note}</p>{/if}
</div>

<style>
  .balance {
    display: grid;
    gap: 14px;
    border-top: 1px solid var(--border);
    padding-top: 22px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 16px;
    margin-bottom: 4px;
  }
  .head h3 {
    font-size: 20px;
    margin: 0;
  }
  .rows {
    display: grid;
    gap: 10px;
  }
  .frow {
    display: grid;
    grid-template-columns: minmax(150px, 0.9fr) minmax(0, 2.2fr) minmax(150px, auto);
    align-items: center;
    gap: 16px;
  }
  .flabel {
    display: grid;
    line-height: 1.3;
  }
  .flabel strong {
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .flabel .small {
    font-size: var(--fs-micro);
    color: var(--ink-2);
  }
  .fplot {
    position: relative;
    height: 26px;
  }
  .grid {
    position: absolute;
    top: -5px;
    bottom: -5px;
    width: 1px;
    background: var(--grid);
  }
  .grid.zero {
    background: var(--axis);
  }
  .bar {
    position: absolute;
    top: 7px;
    height: 12px;
    border-radius: 0 var(--r-mark) var(--r-mark) 0;
    background: var(--deemph);
  }
  .bar.up {
    background: var(--up);
  }
  .bar.down {
    background: var(--down);
    border-radius: var(--r-mark) 0 0 var(--r-mark);
  }
  .bar.pale {
    opacity: 0.3;
  }
  .whisk {
    position: absolute;
    top: 12.25px;
    height: 1.5px;
    background: var(--ink);
  }
  .whisk::before,
  .whisk::after {
    content: '';
    position: absolute;
    top: -4px;
    width: 1.5px;
    height: 9.5px;
    background: var(--ink);
  }
  .whisk::before {
    left: 0;
  }
  .whisk::after {
    right: 0;
  }
  .fval {
    display: grid;
    grid-template-columns: 4.5ch minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    font-variant-numeric: tabular-nums;
  }
  .v {
    font-weight: 500;
    font-size: var(--fs-body);
    text-align: right;
  }
  .axis .fplot {
    height: 16px;
  }
  .tk {
    position: absolute;
    transform: translateX(-50%);
    font-size: var(--fs-micro);
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .legend {
    margin: 4px 0 0;
  }
  @media (max-width: 720px) {
    .frow {
      grid-template-columns: 1fr auto;
      gap: 4px 10px;
    }
    .flabel {
      grid-column: 1;
    }
    .fval {
      grid-column: 2;
      grid-row: 1;
    }
    .fplot {
      grid-column: 1 / -1;
    }
    .axis .flabel,
    .axis .fval {
      display: none;
    }
  }
</style>
