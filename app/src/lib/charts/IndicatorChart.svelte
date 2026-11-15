<script lang="ts">
  // Un valor por año (una «pista oculta») con su tendencia y su banda de incertidumbre.
  import { scaleLinear } from 'd3-scale';
  import { line as d3line } from 'd3-shape';
  import type { IndicatorTrend } from '../analysis';
  import { t } from '../i18n';

  let {
    ind,
    highlight = [],
    format,
    showTrend = true,
    title
  }: {
    ind: IndicatorTrend;
    highlight?: number[];
    format: (v: number) => string;
    showTrend?: boolean;
    title: string;
  } = $props();

  let width = $state(720);
  let svgEl = $state<SVGSVGElement | null>(null);
  const narrow = $derived(width < 520);
  const height = $derived(narrow ? 260 : 320);
  const m = $derived({ top: 28, right: narrow ? 14 : 70, bottom: 32, left: 56 });

  const pts = $derived(ind.years.map((year, i) => ({ year, v: ind.values[i] })));
  const yr0 = $derived(ind.years[0]);
  const yr1 = $derived(ind.years[ind.years.length - 1]);
  const x = $derived(
    scaleLinear()
      .domain([yr0 - 0.6, yr1 + 0.6])
      .range([m.left, width - m.right])
  );
  const y = $derived.by(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of pts) {
      if (p.v !== null) {
        lo = Math.min(lo, p.v);
        hi = Math.max(hi, p.v);
      }
    }
    if (!Number.isFinite(lo)) {
      lo = 0;
      hi = 1;
    }
    const pad = (hi - lo) * 0.12 || 1;
    return scaleLinear()
      .domain([lo - pad, hi + pad])
      .nice(5)
      .range([height - m.bottom, m.top]);
  });
  const yTicks = $derived(y.ticks(5));
  const xTicks = $derived.by(() => {
    const span = yr1 - yr0 + 1;
    const room = Math.max(3, Math.floor((width - m.left - m.right) / 58));
    const step = [1, 2, 5, 10].find((s) => span / s <= room) ?? 10;
    const out: number[] = [];
    for (let yv = Math.ceil(yr0 / step) * step; yv <= yr1; yv += step) out.push(yv);
    return out;
  });

  const path = $derived(
    d3line<{ year: number; v: number | null }>()
      .defined((d) => d.v !== null)
      .x((d) => x(d.year))
      .y((d) => y(d.v as number))(pts) ?? ''
  );

  const tr = $derived(ind.trend);
  const pivotT = $derived((tr.tFirst + tr.tLast) / 2);
  const pivotY = $derived(tr.sen.intercept + tr.sen.slope * pivotT);
  const lineAt = (slope: number, tt: number) => y(pivotY + slope * (tt - pivotT));
  const ta = $derived(yr0 - 0.4);
  const tb = $derived(yr1 + 0.4);
  const band = $derived(
    tr.ok
      ? `M${x(ta)},${lineAt(tr.sen.ci[0], ta)} L${x(tb)},${lineAt(tr.sen.ci[0], tb)} L${x(tb)},${lineAt(tr.sen.ci[1], tb)} L${x(ta)},${lineAt(tr.sen.ci[1], ta)} Z`
      : ''
  );

  let hover = $state<number | null>(null);
  function onMove(e: PointerEvent) {
    const r = svgEl!.getBoundingClientRect();
    const yr = Math.round(x.invert(((e.clientX - r.left) * width) / r.width));
    const i = yr - yr0;
    hover = i >= 0 && i < pts.length ? i : null;
  }
  const hp = $derived(hover === null ? null : pts[hover]);
</script>

<div class="legend" aria-hidden="true">
  <span class="item"><span class="key-dot" style="background: var(--series-1)"></span>{title}</span>
  {#if highlight.length}
    <span class="item"><span class="key-dot ringed"></span>{t('ind.legendChosen')}</span>
  {/if}
  {#if showTrend && tr.ok}
    <span class="item"><span class="key-line" style="border-color: var(--ink); border-top-width: 3px"></span>{t('chart.trend')}</span>
    <span class="item"><span class="key-box" style="background: var(--ink); opacity: 0.14"></span>{t('chart.band')}</span>
  {/if}
</div>

<div class="chart-holder" bind:clientWidth={width}>
  <svg bind:this={svgEl} class="chart" viewBox="0 0 {width} {height}" {width} {height} role="img" aria-label={t('ind.aria', { title, y0: yr0, y1: yr1 })}>
    {#each yTicks as tk (tk)}
      <g class="tick">
        <line class="gridline" x1={m.left} x2={width - m.right} y1={y(tk)} y2={y(tk)} />
        <text x={m.left - 8} y={y(tk)} dy="0.32em" text-anchor="end">{format(tk)}</text>
      </g>
    {/each}
    {#each xTicks as yv (yv)}
      <g class="tick">
        <line class="axisline" x1={x(yv)} x2={x(yv)} y1={height - m.bottom} y2={height - m.bottom + 5} />
        <text x={x(yv)} y={height - m.bottom + 19} text-anchor="middle">{yv}</text>
      </g>
    {/each}
    <line class="axisline" x1={m.left} x2={width - m.right} y1={height - m.bottom} y2={height - m.bottom} />

    {#if showTrend && tr.ok}
      <path d={band} fill="var(--ink)" opacity="0.1" />
    {/if}
    <path d={path} fill="none" stroke="var(--deemph)" stroke-width="1.5" stroke-linejoin="round" />
    {#if showTrend && tr.ok}
      <line x1={x(ta)} y1={lineAt(tr.sen.slope, ta)} x2={x(tb)} y2={lineAt(tr.sen.slope, tb)} stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
      {#if !narrow}
        <text x={x(tb) + 8} y={lineAt(tr.sen.slope, tb)} dy="0.32em" class="direct">{t('chart.trend')}</text>
      {/if}
    {/if}
    {#each pts as p (p.year)}
      {#if p.v !== null}
        {#if highlight.includes(p.year)}
          <circle cx={x(p.year)} cy={y(p.v)} r="8.5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2" />
          <circle cx={x(p.year)} cy={y(p.v)} r="4.5" fill="var(--series-1)" />
          {@const below = showTrend && tr.ok ? y(p.v) > lineAt(tr.sen.slope, p.year) : p.v < (y.domain()[0] + y.domain()[1]) / 2}
          <text
            x={Math.max(m.left + 44, Math.min(width - m.right - 44, x(p.year)))}
            y={y(p.v) + (below ? 26 : -15)}
            text-anchor="middle"
            class="direct">{p.year} · {format(p.v)}</text
          >
        {:else}
          <circle cx={x(p.year)} cy={y(p.v)} r="4.5" fill="var(--series-1)" stroke="var(--surface)" stroke-width="2" />
        {/if}
      {/if}
    {/each}

    <rect
      x={m.left}
      y={m.top}
      width={Math.max(0, width - m.left - m.right)}
      height={Math.max(0, height - m.top - m.bottom)}
      fill="transparent"
      role="presentation"
      onpointermove={onMove}
      onpointerleave={() => (hover = null)}
    />
    {#if hp}
      <line class="axisline" x1={x(hp.year)} x2={x(hp.year)} y1={m.top} y2={height - m.bottom} pointer-events="none" />
    {/if}
  </svg>
  {#if hp}
    <div class="tooltip" style="left: {x(hp.year)}px; top: {hp.v === null ? m.top + 24 : y(hp.v)}px">
      <strong>{hp.v === null ? t('ind.incomplete') : format(hp.v)}</strong>
      <div class="sub">{hp.year}</div>
    </div>
  {/if}
</div>

<details class="table-view">
  <summary>{t('chart.tableToggle')}</summary>
  <div class="scroll">
    <table class="data">
      <thead><tr><th>{t('chart.year')}</th><th>{title}</th></tr></thead>
      <tbody>
        {#each pts as p (p.year)}
          <tr><td>{p.year}</td><td>{p.v === null ? '—' : format(p.v)}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</details>

<style>
  .direct {
    font-size: 12.5px;
    font-weight: 600;
    fill: var(--ink);
    paint-order: stroke;
    stroke: var(--surface);
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  .key-dot.ringed {
    background: var(--series-1);
    outline: 2px solid var(--ink);
    outline-offset: 2px;
    width: 7px;
    height: 7px;
  }
</style>
