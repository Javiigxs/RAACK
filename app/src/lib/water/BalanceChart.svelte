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

<div class="balance panel">
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
  {#if note}<p class="small muted">{note}</p>{/if}
</div>

<style>
  .balance {
    display: grid;
    gap: 12px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 16px;
  }
  .head h3 {
    margin: 0;
  }
  .rows {
    display: grid;
    gap: 8px;
  }
  .frow {
    display: grid;
    grid-template-columns: minmax(150px, 0.9fr) minmax(0, 2fr) minmax(150px, auto);
    align-items: center;
    gap: 12px;
  }
  .flabel {
    display: grid;
    line-height: 1.25;
  }
  .flabel strong {
    font-size: 14.5px;
  }
  .fplot {
    position: relative;
    height: 26px;
  }
  .grid {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 1px;
    background: var(--grid);
  }
  .grid.zero {
    background: var(--axis);
    width: 1.5px;
  }
  .bar {
    position: absolute;
    top: 6px;
    height: 14px;
    border-radius: 0 4px 4px 0;
    background: var(--deemph);
  }
  .bar.up {
    background: var(--up);
  }
  .bar.down {
    background: var(--down);
    border-radius: 4px 0 0 4px;
  }
  .bar.pale {
    opacity: 0.3;
  }
  .whisk {
    position: absolute;
    top: 12px;
    height: 2px;
    background: var(--ink);
    border-radius: 2px;
  }
  .whisk::before,
  .whisk::after {
    content: '';
    position: absolute;
    top: -4px;
    width: 2px;
    height: 10px;
    background: var(--ink);
    border-radius: 2px;
  }
  .whisk::before {
    left: 0;
  }
  .whisk::after {
    right: 0;
  }
  .fval {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    font-variant-numeric: tabular-nums;
  }
  .v {
    font-weight: 700;
    font-size: 15px;
  }
  .axis .fplot {
    height: 16px;
  }
  .tk {
    position: absolute;
    transform: translateX(-50%);
    font-size: 11.5px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
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
