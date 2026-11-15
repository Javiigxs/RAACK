<script lang="ts" module>
  export interface ChartLine {
    id: string;
    label: string;
    /** CSS colour of the line (a series variable). */
    color: string;
    years: number[];
    values: number[];
    /** The main line gets dots and, if given, its Sen trend line: value = intercept + slope · year. */
    main?: boolean;
    trend?: { slope: number; intercept: number } | null;
  }
</script>

<script lang="ts">
  // One value per year for up to three lines on a single axis, with the trend of the main one.
  // Code written with AI assistance (Claude) for team RAACK.
  import { scaleLinear } from 'd3-scale';
  import { line as d3line } from 'd3-shape';
  import { t } from '../i18n';

  let {
    lines,
    y0,
    y1,
    format,
    axisFormat = format,
    unitLabel,
    ariaLabel,
    background = null,
    backgroundLabel = '',
    marks = [],
    gap = null,
    gapLabel = '',
    domain = null,
    legend = true
  }: {
    lines: ChartLine[];
    y0: number;
    y1: number;
    /** Value with its unit, for tooltips and the table. */
    format: (v: number) => string;
    axisFormat?: (v: number) => string;
    unitLabel: string;
    ariaLabel: string;
    /** Faint monthly line behind the yearly values: decimal years and values. */
    background?: { t: number[]; v: number[] } | null;
    backgroundLabel?: string;
    /** Years ringed and named on the main line. */
    marks?: number[];
    /** A stretch without data worth naming (first and last missing year). */
    gap?: [number, number] | null;
    gapLabel?: string;
    /** Fixed value axis, to compare two charts honestly. */
    domain?: [number, number] | null;
    /** False when the caller draws the legend itself (the suspects merge it with their switches). */
    legend?: boolean;
  } = $props();

  let width = $state(640);
  let svgEl = $state<SVGSVGElement | null>(null);
  const narrow = $derived(width < 520);
  const height = $derived(narrow ? 250 : 300);
  const main = $derived(lines.find((l) => l.main) ?? lines[0]);
  const hasTrend = $derived(!!main?.trend);
  const m = $derived({ top: 24, right: narrow || !hasTrend ? 14 : 58, bottom: 30, left: 52 });

  const x = $derived(
    scaleLinear()
      .domain([y0 - 0.6, y1 + 0.6])
      .range([m.left, width - m.right])
  );
  const y = $derived.by(() => {
    if (domain) return scaleLinear().domain(domain).range([height - m.bottom, m.top]);
    let lo = Infinity;
    let hi = -Infinity;
    for (const l of lines) {
      for (let i = 0; i < l.years.length; i++) {
        if (l.years[i] < y0 || l.years[i] > y1) continue;
        lo = Math.min(lo, l.values[i]);
        hi = Math.max(hi, l.values[i]);
      }
    }
    if (background) {
      for (let i = 0; i < background.t.length; i++) {
        if (background.t[i] < y0 - 0.6 || background.t[i] > y1 + 0.6) continue;
        lo = Math.min(lo, background.v[i]);
        hi = Math.max(hi, background.v[i]);
      }
    }
    if (!Number.isFinite(lo)) {
      lo = 0;
      hi = 1;
    }
    const pad = (hi - lo) * 0.1 || 1;
    return scaleLinear()
      .domain([lo - pad, hi + pad])
      .nice(5)
      .range([height - m.bottom, m.top]);
  });
  const yTicks = $derived(y.ticks(5));
  const xTicks = $derived.by(() => {
    const span = y1 - y0 + 1;
    const room = Math.max(3, Math.floor((width - m.left - m.right) / 54));
    const step = [1, 2, 5, 10].find((s) => span / s <= room) ?? 10;
    const out: number[] = [];
    for (let v = Math.ceil(y0 / step) * step; v <= y1; v += step) out.push(v);
    return out;
  });

  type Pt = { year: number; v: number };
  const inside = (l: ChartLine): Pt[] => l.years.map((year, i) => ({ year, v: l.values[i] })).filter((p) => p.year >= y0 && p.year <= y1);
  // The line breaks where a year is missing, so a gap is never drawn as if it had been measured.
  const pathOf = (pts: Pt[]) => {
    const gen = d3line<Pt>()
      .x((d) => x(d.year))
      .y((d) => y(d.v));
    const runs: Pt[][] = [];
    for (const p of pts) {
      const last = runs[runs.length - 1];
      if (last && p.year === last[last.length - 1].year + 1) last.push(p);
      else runs.push([p]);
    }
    return runs.map((r) => gen(r) ?? '').join(' ');
  };
  const drawn = $derived(lines.map((l) => ({ line: l, pts: inside(l), d: pathOf(inside(l)) })));
  const bgPath = $derived.by(() => {
    if (!background) return '';
    const pts: [number, number][] = [];
    for (let i = 0; i < background.t.length; i++) {
      if (background.t[i] >= y0 - 0.6 && background.t[i] <= y1 + 0.6) pts.push([background.t[i], background.v[i]]);
    }
    // Break the line where more than two months are missing.
    let d = '';
    pts.forEach((p, i) => {
      const jump = i === 0 || p[0] - pts[i - 1][0] > 0.21;
      d += `${jump ? 'M' : 'L'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`;
    });
    return d;
  });

  const ta = $derived(y0 - 0.4);
  const tb = $derived(y1 + 0.4);
  const trendAt = (tt: number) => (main?.trend ? y(main.trend.intercept + main.trend.slope * tt) : 0);

  let hover = $state<number | null>(null);
  function onMove(e: PointerEvent) {
    const r = svgEl!.getBoundingClientRect();
    const yr = Math.round(x.invert(((e.clientX - r.left) * width) / r.width));
    hover = yr >= y0 && yr <= y1 ? yr : null;
  }
  const hoverRows = $derived.by(() => {
    if (hover === null) return [];
    return lines
      .map((l) => {
        const i = l.years.indexOf(hover as number);
        return i < 0 ? null : { line: l, v: l.values[i] };
      })
      .filter((r): r is { line: ChartLine; v: number } => r !== null);
  });
  const hoverY = $derived(hoverRows.length ? Math.min(...hoverRows.map((r) => y(r.v))) : m.top + 24);

  const tableYears = $derived.by(() => {
    const set = new Set<number>();
    for (const d of drawn) for (const p of d.pts) set.add(p.year);
    return [...set].sort((a, b) => a - b);
  });
  const cell = (l: ChartLine, yr: number) => {
    const i = l.years.indexOf(yr);
    return i < 0 ? '—' : format(l.values[i]);
  };
</script>

{#if legend && (lines.length > 1 || hasTrend || background)}
  <div class="legend" aria-hidden="true">
    {#each lines as l (l.id)}
      <span class="item"><span class="key-line" style="border-color: {l.color}"></span>{l.label}</span>
    {/each}
    {#if background}
      <span class="item"><span class="key-line" style="border-color: var(--deemph); border-top-width: 1.5px"></span>{backgroundLabel}</span>
    {/if}
    {#if hasTrend}
      <span class="item"><span class="key-line" style="border-color: var(--ink); border-top-width: 3px"></span>{t('w.chart.sen')}</span>
    {/if}
  </div>
{/if}

<div class="chart-holder" bind:clientWidth={width}>
  <svg bind:this={svgEl} class="chart" viewBox="0 0 {width} {height}" {width} {height} role="img" aria-label={ariaLabel}>
    <text x={m.left - 44} y={11} class="unit">{unitLabel}</text>
    {#each yTicks as tk (tk)}
      <g class="tick">
        <line class={tk === 0 && y.domain()[0] < 0 ? 'axisline' : 'gridline'} x1={m.left} x2={width - m.right} y1={y(tk)} y2={y(tk)} />
        <text x={m.left - 8} y={y(tk)} dy="0.32em" text-anchor="end">{axisFormat(tk)}</text>
      </g>
    {/each}
    {#each xTicks as v (v)}
      <g class="tick">
        <line class="axisline" x1={x(v)} x2={x(v)} y1={height - m.bottom} y2={height - m.bottom + 5} />
        <text x={x(v)} y={height - m.bottom + 19} text-anchor="middle">{v}</text>
      </g>
    {/each}
    <line class="axisline" x1={m.left} x2={width - m.right} y1={height - m.bottom} y2={height - m.bottom} />

    {#if gap && gap[0] >= y0 && gap[1] <= y1}
      <rect x={x(gap[0] - 0.5)} y={m.top} width={x(gap[1] + 0.5) - x(gap[0] - 0.5)} height={height - m.bottom - m.top} class="gapband" />
      {#if !narrow}
        <text x={(x(gap[0] - 0.5) + x(gap[1] + 0.5)) / 2} y={m.top + 14} text-anchor="middle" class="gaplabel">{gapLabel}</text>
      {/if}
    {/if}

    {#if bgPath}
      <path d={bgPath} fill="none" stroke="var(--deemph)" stroke-width="1.25" stroke-linejoin="round" />
    {/if}

    {#each drawn as d (d.line.id)}
      {#if !d.line.main}
        <path d={d.d} fill="none" stroke={d.line.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        {#each d.pts as p, i (p.year)}
          {#if (i === 0 || d.pts[i - 1].year !== p.year - 1) && (i === d.pts.length - 1 || d.pts[i + 1].year !== p.year + 1)}
            <circle cx={x(p.year)} cy={y(p.v)} r="3" fill={d.line.color} />
          {/if}
        {/each}
      {/if}
    {/each}
    {#each drawn as d (d.line.id)}
      {#if d.line.main}
        <path d={d.d} fill="none" stroke={d.line.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        {#if hasTrend}
          <line x1={x(ta)} y1={trendAt(ta)} x2={x(tb)} y2={trendAt(tb)} stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" />
          {#if !narrow}
            <text x={x(tb) + 7} y={trendAt(tb)} dy="0.32em" class="direct">{t('chart.trend')}</text>
          {/if}
        {/if}
        {#each d.pts as p (p.year)}
          {#if marks.includes(p.year)}
            <circle cx={x(p.year)} cy={y(p.v)} r="8" fill="var(--page)" stroke="var(--ink)" stroke-width="1.5" />
            <circle cx={x(p.year)} cy={y(p.v)} r="4" fill={d.line.color} />
            <text x={Math.max(m.left + 18, Math.min(width - m.right - 18, x(p.year)))} y={y(p.v) + 25} text-anchor="middle" class="direct">{p.year}</text>
          {:else}
            <circle cx={x(p.year)} cy={y(p.v)} r="3.5" fill={d.line.color} stroke="var(--page)" stroke-width="1.5" />
          {/if}
        {/each}
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
    {#if hover !== null}
      <line class="axisline" x1={x(hover)} x2={x(hover)} y1={m.top} y2={height - m.bottom} pointer-events="none" />
    {/if}
  </svg>
  {#if hover !== null}
    <div class="tooltip" style="left: {Math.max(70, Math.min(width - 70, x(hover)))}px; top: {hoverY}px">
      <div class="sub">{hover}</div>
      {#if hoverRows.length === 0}
        <strong>{t('w.chart.noYear')}</strong>
      {/if}
      {#each hoverRows as r (r.line.id)}
        <div class="trow"><span class="tkey" style="background: {r.line.color}"></span><strong>{format(r.v)}</strong>{#if lines.length > 1}<span class="sub">{r.line.label}</span>{/if}</div>
      {/each}
    </div>
  {/if}
</div>

<details class="table-view">
  <summary>{t('chart.tableToggle')}</summary>
  <div class="scroll">
    <table class="data">
      <thead>
        <tr>
          <th>{t('chart.year')}</th>
          {#each lines as l (l.id)}<th>{l.label}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each tableYears as yr (yr)}
          <tr>
            <td>{yr}</td>
            {#each lines as l (l.id)}<td>{cell(l, yr)}</td>{/each}
          </tr>
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
  .direct {
    font-size: 12px;
    font-weight: 600;
    fill: var(--ink);
    paint-order: stroke;
    stroke: var(--page);
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  .gapband {
    fill: color-mix(in srgb, var(--ink) 5%, transparent);
  }
  .gaplabel {
    font-size: 12px;
    fill: var(--muted);
  }
  .trow {
    display: flex;
    align-items: baseline;
    gap: 7px;
  }
  .tkey {
    width: 12px;
    height: 2.5px;
    border-radius: 2px;
    align-self: center;
    flex: none;
  }
</style>
