<script lang="ts">
  // The rain of one year, month by month, next to the usual rain of each calendar month.
  // Code written with AI assistance (Claude) for team RAACK.
  import { scaleLinear } from 'd3-scale';
  import { fmt, monthName } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';

  let { year, values, usual, source }: { year: number; values: number[]; usual: number[]; source: string } = $props();

  let width = $state(640);
  const narrow = $derived(width < 480);
  const height = $derived(narrow ? 220 : 260);
  const m = { top: 20, right: 10, bottom: 28, left: 44 };
  const slot = $derived((width - m.left - m.right) / 12);
  const barW = $derived(Math.min(24, slot * 0.46));
  const y = $derived(
    scaleLinear()
      .domain([0, Math.max(...values, ...usual, 1)])
      .nice(4)
      .range([height - m.bottom, m.top])
  );
  const yTicks = $derived(y.ticks(4));
  const cx = (i: number) => m.left + slot * (i + 0.5);
  const base = $derived(y(0));

  let hover = $state<number | null>(null);
  const mm = (v: number) => `${fmt(v, 0, ui.lang)} mm`;
  // Rounded top, square on the baseline.
  function bar(i: number): string {
    const x0 = cx(i) - barW / 2;
    const top = y(values[i]);
    const h = base - top;
    const r = Math.min(3, h, barW / 2);
    return `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z`;
  }
</script>

<div class="legend" aria-hidden="true">
  <span class="item"><span class="key-box" style="background: var(--series-1)"></span>{t('w.crisis.legendYear', { year })}</span>
  <span class="item"><span class="key-line" style="border-color: var(--ink); border-top-width: 3px"></span>{t('w.crisis.legendUsual')}</span>
</div>

<div class="chart-holder" bind:clientWidth={width}>
  <svg class="chart" viewBox="0 0 {width} {height}" {width} {height} role="img" aria-label={t('w.crisis.chartAria', { year, source })}>
    <text x={m.left - 36} y={11} class="unit">{t('w.crisis.axis')}</text>
    {#each yTicks as tk (tk)}
      <g class="tick">
        <line class="gridline" x1={m.left} x2={width - m.right} y1={y(tk)} y2={y(tk)} />
        <text x={m.left - 8} y={y(tk)} dy="0.32em" text-anchor="end">{fmt(tk, 0, ui.lang)}</text>
      </g>
    {/each}
    <line class="axisline" x1={m.left} x2={width - m.right} y1={base} y2={base} />
    {#each values as v, i (i)}
      <g class="tick">
        <text x={cx(i)} y={base + 18} text-anchor="middle">{narrow ? monthName(i, ui.lang).slice(0, 1).toUpperCase() : monthName(i, ui.lang)}</text>
      </g>
      {#if v > 0}
        <path d={bar(i)} fill="var(--series-1)" opacity={hover === null || hover === i ? 1 : 0.55} />
      {/if}
      <line x1={cx(i) - slot * 0.36} x2={cx(i) + slot * 0.36} y1={y(usual[i])} y2={y(usual[i])} stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" />
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <rect
        x={cx(i) - slot / 2}
        y={m.top}
        width={slot}
        height={base - m.top}
        fill="transparent"
        role="img"
        tabindex="0"
        aria-label={t('w.crisis.monthAria', { month: monthName(i, ui.lang), year, value: mm(v), usual: mm(usual[i]) })}
        onpointerenter={() => (hover = i)}
        onpointerleave={() => (hover = null)}
        onfocus={() => (hover = i)}
        onblur={() => (hover = null)}
      />
    {/each}
  </svg>
  {#if hover !== null}
    <div class="tooltip" style="left: {Math.max(80, Math.min(width - 80, cx(hover)))}px; top: {Math.min(y(values[hover]), y(usual[hover]))}px">
      <strong>{mm(values[hover])}</strong>
      <div class="sub">{monthName(hover, ui.lang)} {year} · {t('w.crisis.usual')} {mm(usual[hover])}</div>
    </div>
  {/if}
</div>

<details class="table-view">
  <summary>{t('chart.tableToggle')}</summary>
  <div class="scroll">
    <table class="data">
      <thead><tr><th>{t('mb.month')}</th><th>{year} (mm)</th><th>{t('w.crisis.legendUsual')} (mm)</th></tr></thead>
      <tbody>
        {#each values as v, i (i)}
          <tr><td>{monthName(i, ui.lang)}</td><td>{fmt(v, 0, ui.lang)}</td><td>{fmt(usual[i], 0, ui.lang)}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</details>

<style>
  .unit {
    font-size: 12px;
    fill: var(--muted);
  }
  rect:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
</style>
