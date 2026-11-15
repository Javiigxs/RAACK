<script lang="ts">
  // «Dónde cambia»: el mismo análisis en cada lugar, ordenado de mayor a menor ritmo.
  import type { SiteResult } from '../analysis';
  import { fmtSigned, type SiteId } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import VerdictChip from '../ui/VerdictChip.svelte';

  let {
    results,
    selected,
    unit,
    decimals,
    onselect
  }: {
    results: SiteResult[];
    selected: SiteId;
    unit: string;
    decimals: number;
    onselect?: (s: SiteId) => void;
  } = $props();

  const rows = $derived([...results].sort((p, q) => (q.analysis.trend.ok ? q.analysis.perDecade : -Infinity) - (p.analysis.trend.ok ? p.analysis.perDecade : -Infinity)));

  const domain = $derived.by(() => {
    let lo = 0;
    let hi = 0;
    for (const r of results) {
      if (!r.analysis.trend.ok) continue;
      lo = Math.min(lo, r.analysis.ci[0], r.analysis.perDecade);
      hi = Math.max(hi, r.analysis.ci[1], r.analysis.perDecade);
    }
    if (lo === hi) hi = lo + 1;
    const pad = (hi - lo) * 0.06;
    return [lo - (lo < 0 ? pad : 0), hi + (hi > 0 ? pad : 0)];
  });
  const pct = (v: number) => ((v - domain[0]) / (domain[1] - domain[0])) * 100;
</script>

<div class="rows" role="list">
  {#each rows as r (r.site)}
    {@const a = r.analysis}
    <div class="row" class:sel={r.site === selected} role="listitem">
      <button class="name" onclick={() => onselect?.(r.site)} aria-pressed={r.site === selected}>{t(`site.${r.site}.short`)}</button>
      <div class="plot" aria-hidden="true">
        <div class="zero" style="left: {pct(0)}%"></div>
        {#if a.trend.ok}
          <div
            class="bar"
            class:up={a.perDecade >= 0}
            class:pale={!(a.verdict.level === 'strong' || a.verdict.level === 'some')}
            style="left: {pct(Math.min(0, a.perDecade))}%; width: {Math.abs(pct(a.perDecade) - pct(0))}%"
          ></div>
          <div class="whisk" style="left: {pct(a.ci[0])}%; width: {pct(a.ci[1]) - pct(a.ci[0])}%"></div>
        {/if}
      </div>
      <div class="val">{a.trend.ok ? fmtSigned(a.perDecade, decimals, ui.lang) : '—'}</div>
      <div class="chip"><VerdictChip verdict={a.verdict} compact /></div>
    </div>
  {/each}
  <div class="row axis" aria-hidden="true">
    <span></span>
    <div class="plot scale">
      {#if domain[0] < 0}
        <span style="left: {pct(domain[0])}%">{fmtSigned(domain[0], decimals, ui.lang)}</span>
      {/if}
      <span class={domain[0] < 0 ? 'mid' : ''} style="left: {pct(0)}%">0</span>
      <span class="end" style="left: {pct(domain[1])}%">{fmtSigned(domain[1], decimals, ui.lang)}</span>
    </div>
    <span class="unit">{unit} {t('unit.perDecade')}</span>
    <span></span>
  </div>
</div>

<style>
  .rows {
    display: grid;
    gap: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 118px minmax(80px, 1fr) 62px auto;
    align-items: center;
    gap: 10px;
    padding: 5px 8px;
    border-radius: 9px;
  }
  .row.sel {
    background: var(--accent-wash);
  }
  .name {
    border: 0;
    background: none;
    padding: 0;
    text-align: left;
    font-weight: 650;
    font-size: 14.5px;
    cursor: pointer;
    color: var(--ink);
  }
  .name:hover {
    text-decoration: underline;
  }
  .plot {
    position: relative;
    height: 26px;
  }
  .zero {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--axis);
  }
  .bar {
    position: absolute;
    top: 5px;
    height: 16px;
    background: var(--down);
    border-radius: 4px 0 0 4px;
  }
  .bar.up {
    background: var(--up);
    border-radius: 0 4px 4px 0;
  }
  .bar.pale {
    opacity: 0.32;
  }
  .whisk {
    position: absolute;
    top: 12px;
    height: 2px;
    background: var(--ink-2);
  }
  .whisk::before,
  .whisk::after {
    content: '';
    position: absolute;
    top: -4px;
    width: 2px;
    height: 10px;
    background: var(--ink-2);
  }
  .whisk::before {
    left: 0;
  }
  .whisk::after {
    right: 0;
  }
  .val {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
    font-size: 14.5px;
  }
  .axis {
    padding-top: 0;
    font-size: 11.5px;
    color: var(--muted);
  }
  .scale {
    height: 16px;
    font-variant-numeric: tabular-nums;
  }
  .scale span {
    position: absolute;
    top: 0;
    white-space: nowrap;
  }
  .scale .mid {
    transform: translateX(-50%);
  }
  .scale .end {
    transform: translateX(-100%);
  }
  .unit {
    white-space: nowrap;
    text-align: right;
  }
  @media (max-width: 620px) {
    .row {
      grid-template-columns: 96px minmax(60px, 1fr) 54px;
    }
    .chip {
      grid-column: 1 / -1;
    }
    .axis span:last-child {
      display: none;
    }
  }
</style>
