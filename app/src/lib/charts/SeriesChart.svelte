<script lang="ts">
  // Serie mensual con media anual, la línea que el usuario cree ver y, tras revelar, la tendencia calculada.
  import { scaleLinear } from 'd3-scale';
  import { line as d3line } from 'd3-shape';
  import type { SeriesAnalysis } from '../analysis';
  import { VARS, fmt, fmtSigned, monthName, withUnit } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';

  let { a }: { a: SeriesAnalysis } = $props();
  const def = $derived(VARS[a.varId]);

  let width = $state(760);
  let svgEl = $state<SVGSVGElement | null>(null);
  const narrow = $derived(width < 560);
  const height = $derived(narrow ? 300 : 380);
  const m = $derived({ top: 26, right: narrow ? 14 : 92, bottom: 34, left: 52 });

  const x = $derived(
    scaleLinear()
      .domain([a.y0, a.y1 + 1])
      .range([m.left, width - m.right])
  );
  const yDomain = $derived.by(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of a.plotted) {
      if (v !== null) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    if (!Number.isFinite(lo)) return [-1, 1];
    const pad = (hi - lo) * 0.06 || 1;
    return [lo - pad, hi + pad];
  });
  const y = $derived(
    scaleLinear()
      .domain(yDomain)
      .nice(6)
      .range([height - m.bottom, m.top])
  );

  const yTicks = $derived(y.ticks(6));
  const tickDecimals = $derived.by(() => {
    const step = yTicks.length > 1 ? Math.abs(yTicks[1] - yTicks[0]) : 1;
    return step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
  });
  const xTicks = $derived.by(() => {
    const span = a.y1 - a.y0 + 1;
    const room = Math.max(3, Math.floor((width - m.left - m.right) / 62));
    const step = [1, 2, 5, 10].find((s) => span / s <= room) ?? 10;
    const out: number[] = [];
    for (let yr = Math.ceil(a.y0 / step) * step; yr <= a.y1; yr += step) out.push(yr);
    return out;
  });

  const monthlyPath = $derived(
    d3line<number | null>()
      .defined((d) => d !== null)
      .x((_, i) => x(a.times[i]))
      .y((d) => y(d as number))(a.plotted) ?? ''
  );
  const annualPath = $derived(
    d3line<{ year: number; value: number | null }>()
      .defined((d) => d.value !== null)
      .x((d) => x(d.year + 0.5))
      .y((d) => y(d.value as number))(a.annual) ?? ''
  );

  // Centro alrededor del que gira la línea del usuario: la media de lo dibujado.
  const center = $derived.by(() => {
    let s = 0;
    let c = 0;
    for (const v of a.plotted) {
      if (v !== null) {
        s += v;
        c++;
      }
    }
    return c ? s / c : 0;
  });
  const t0 = $derived(a.y0);
  const t1 = $derived(a.y1 + 1);
  const guessLine = $derived({
    x1: x(t0),
    y1: y(center - ui.guessEnd),
    x2: x(t1),
    y2: y(center + ui.guessEnd)
  });
  const guessPerDecade = $derived(((2 * ui.guessEnd) / (t1 - t0)) * 10 * def.trendScale);

  const tr = $derived(a.trend);
  const pivotT = $derived((tr.tFirst + tr.tLast) / 2);
  const pivotY = $derived(tr.sen.intercept + tr.sen.slope * pivotT);
  const lineAt = (slope: number, tt: number) => y(pivotY + slope * (tt - pivotT));
  const band = $derived(
    tr.ok
      ? `M${x(t0)},${lineAt(tr.sen.ci[0], t0)} L${x(t1)},${lineAt(tr.sen.ci[0], t1)} L${x(t1)},${lineAt(tr.sen.ci[1], t1)} L${x(t0)},${lineAt(tr.sen.ci[1], t0)} Z`
      : ''
  );

  let dragging = $state(false);
  function valueAt(clientY: number): number {
    const r = svgEl!.getBoundingClientRect();
    return y.invert(((clientY - r.top) * height) / r.height);
  }
  function setGuess(v: number) {
    const [lo, hi] = y.domain();
    ui.guessEnd = Math.max(lo, Math.min(hi, v)) - center;
    ui.guessTouched = true;
  }
  function onDown(e: PointerEvent) {
    if (ui.revealed) return;
    dragging = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setGuess(valueAt(e.clientY));
  }
  function onDrag(e: PointerEvent) {
    if (dragging) setGuess(valueAt(e.clientY));
  }
  function onKey(e: KeyboardEvent) {
    if (ui.revealed) return;
    const [lo, hi] = y.domain();
    const step = (hi - lo) / 80;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setGuess(center + ui.guessEnd + (e.key === 'ArrowUp' ? step : -step));
    }
  }

  let hover = $state<number | null>(null);
  function onHover(e: PointerEvent) {
    if (dragging) return;
    const r = svgEl!.getBoundingClientRect();
    const tt = x.invert(((e.clientX - r.left) * width) / r.width);
    const i = Math.floor((tt - a.y0) * 12);
    hover = i >= 0 && i < a.plotted.length ? i : null;
  }
  const hoverInfo = $derived.by(() => {
    if (hover === null) return null;
    const v = a.plotted[hover];
    const raw = a.monthly.values[hover];
    return {
      x: x(a.times[hover]),
      y: v === null ? m.top + 30 : y(v),
      label: `${monthName(hover % 12, ui.lang)} ${a.y0 + Math.floor(hover / 12)}`,
      v,
      raw
    };
  });

  const valueDec = $derived(Math.max(def.valueDecimals, tickDecimals));
  const unitLabel = $derived(a.deseason ? t('chart.anomalyAxis', { unit: def.unit }) : def.unit);
</script>

<div class="legend" aria-hidden="true">
  <span class="item"><span class="key-line" style="border-color: var(--deemph)"></span>{t('chart.monthly')}</span>
  <span class="item"
    ><span class="key-line" style="border-color: var(--series-1)"></span><span class="key-dot" style="background: var(--series-1); margin-left: -13px"
    ></span>{t('chart.yearly')}</span
  >
  <span class="item"><span class="key-line" style="border-color: var(--series-2)"></span>{t('chart.yourLine')}</span>
  {#if ui.revealed && tr.ok}
    <span class="item"><span class="key-line" style="border-color: var(--ink); border-top-width: 3px"></span>{t('chart.trend')}</span>
    <span class="item"><span class="key-box" style="background: var(--ink); opacity: 0.14"></span>{t('chart.band')}</span>
  {/if}
</div>

<div class="chart-holder" bind:clientWidth={width}>
  <svg
    bind:this={svgEl}
    class="chart"
    viewBox="0 0 {width} {height}"
    {width}
    {height}
    role="img"
    aria-label={t('chart.aria', { variable: t(`var.${a.varId}.name`), y0: a.y0, y1: a.y1 })}
  >
    <text x={m.left - 40} y={12} class="unit">{unitLabel}</text>

    {#each yTicks as tk (tk)}
      <g class="tick">
        <line class={a.deseason && tk === 0 ? 'axisline' : 'gridline'} x1={m.left} x2={width - m.right} y1={y(tk)} y2={y(tk)} />
        <text x={m.left - 8} y={y(tk)} dy="0.32em" text-anchor="end">{a.deseason ? fmtSigned(tk, tickDecimals, ui.lang) : fmt(tk, tickDecimals, ui.lang)}</text>
      </g>
    {/each}
    {#each xTicks as yr (yr)}
      <g class="tick">
        <line class="axisline" x1={x(yr)} x2={x(yr)} y1={height - m.bottom} y2={height - m.bottom + 5} />
        <text x={x(yr)} y={height - m.bottom + 19} text-anchor="middle">{yr}</text>
      </g>
    {/each}
    <line class="axisline" x1={m.left} x2={width - m.right} y1={height - m.bottom} y2={height - m.bottom} />

    {#if ui.revealed && tr.ok}
      <path d={band} fill="var(--ink)" opacity="0.1" />
    {/if}

    <path d={monthlyPath} fill="none" stroke="var(--deemph)" stroke-width="1.25" stroke-linejoin="round" />
    <path d={annualPath} fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    {#each a.annual as d (d.year)}
      {#if d.value !== null}
        <circle cx={x(d.year + 0.5)} cy={y(d.value)} r="4" fill="var(--series-1)" stroke="var(--surface)" stroke-width="2" />
      {/if}
    {/each}

    {#if ui.revealed && tr.ok}
      <line x1={x(t0)} y1={lineAt(tr.sen.slope, t0)} x2={x(t1)} y2={lineAt(tr.sen.slope, t1)} stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
      {#if !narrow}
        <text x={x(t1) + 8} y={lineAt(tr.sen.slope, t1)} dy="0.32em" class="direct">{t('chart.trend')}</text>
      {/if}
    {/if}

    <!-- La línea que el usuario cree ver -->
    <line
      x1={guessLine.x1}
      y1={guessLine.y1}
      x2={guessLine.x2}
      y2={guessLine.y2}
      stroke="var(--series-2)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-dasharray={ui.revealed ? '5 5' : undefined}
      opacity={ui.revealed ? 0.9 : 1}
    />
    {#if !narrow && !(ui.revealed && tr.ok && Math.abs(guessLine.y2 - lineAt(tr.sen.slope, t1)) < 16)}
      <text x={guessLine.x2 + (ui.revealed ? 8 : 18)} y={guessLine.y2} dy="0.32em" class="direct">{t('chart.yourLine')}</text>
    {/if}

    <!-- Capa de lectura: la retícula busca el mes -->
    <rect
      x={m.left}
      y={m.top}
      width={Math.max(0, width - m.left - m.right)}
      height={Math.max(0, height - m.top - m.bottom)}
      fill="transparent"
      onpointermove={onHover}
      onpointerleave={() => (hover = null)}
      role="presentation"
    />
    {#if hoverInfo}
      <line class="axisline" x1={hoverInfo.x} x2={hoverInfo.x} y1={m.top} y2={height - m.bottom} pointer-events="none" />
      {#if hoverInfo.v !== null}
        <circle cx={hoverInfo.x} cy={hoverInfo.y} r="4.5" fill="var(--ink)" stroke="var(--surface)" stroke-width="2" pointer-events="none" />
      {/if}
    {/if}

    {#if !ui.revealed}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        class="handle"
        class:dragging
        role="slider"
        tabindex="0"
        aria-label={t('chart.handleAria')}
        aria-valuenow={Number(guessPerDecade.toFixed(def.trendDecimals))}
        aria-valuetext={`${fmtSigned(guessPerDecade, def.trendDecimals, ui.lang)} ${def.trendUnit} ${t('unit.perDecade')}`}
        onpointerdown={onDown}
        onpointermove={onDrag}
        onpointerup={() => (dragging = false)}
        onpointercancel={() => (dragging = false)}
        onkeydown={onKey}
      >
        <circle cx={guessLine.x2} cy={guessLine.y2} r="22" fill="transparent" />
        <circle cx={guessLine.x2} cy={guessLine.y2} r="9" fill="var(--series-2)" stroke="var(--surface)" stroke-width="2.5" />
        <path
          d="M{guessLine.x2 - 3.5},{guessLine.y2 - 1.5} L{guessLine.x2},{guessLine.y2 - 5} L{guessLine.x2 + 3.5},{guessLine.y2 - 1.5} M{guessLine.x2 -
            3.5},{guessLine.y2 + 1.5} L{guessLine.x2},{guessLine.y2 + 5} L{guessLine.x2 + 3.5},{guessLine.y2 + 1.5}"
          fill="none"
          stroke="#fff"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    {/if}
  </svg>

  {#if hoverInfo}
    <div class="tooltip" style="left: {hoverInfo.x}px; top: {hoverInfo.y}px">
      {#if hoverInfo.v === null}
        <strong>{t('chart.noData')}</strong>
      {:else if a.deseason}
        <strong>{withUnit(fmtSigned(hoverInfo.v, valueDec, ui.lang), def.unit)}</strong>
      {:else}
        <strong>{withUnit(fmt(hoverInfo.v, valueDec, ui.lang), def.unit)}</strong>
      {/if}
      <div class="sub">
        {hoverInfo.label}{#if a.deseason && hoverInfo.raw !== null}
          · {t('chart.measured')} {withUnit(fmt(hoverInfo.raw, valueDec, ui.lang), def.unit)}{/if}
      </div>
    </div>
  {/if}
</div>

{#if a.annual.some((d) => d.value === null)}
  <p class="small muted gap-note">{t('chart.gapNote')}</p>
{/if}

<details class="table-view">
  <summary>{t('chart.tableToggle')}</summary>
  <div class="scroll">
    <table class="data">
      <thead>
        <tr><th>{t('chart.year')}</th><th>{t('chart.yearlyMean')} ({unitLabel})</th><th>{t('chart.monthsUsed')}</th></tr>
      </thead>
      <tbody>
        {#each a.annual as d (d.year)}
          <tr>
            <td>{d.year}</td>
            <td>{d.value === null ? '—' : a.deseason ? fmtSigned(d.value, valueDec + 1, ui.lang) : fmt(d.value, valueDec + 1, ui.lang)}</td>
            <td>{d.months}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</details>

<style>
  .unit {
    font-size: 11.5px;
    fill: var(--muted);
  }
  .direct {
    font-size: 12.5px;
    font-weight: 600;
    fill: var(--ink);
  }
  .gap-note {
    margin-top: 6px;
  }
  .handle {
    cursor: ns-resize;
    touch-action: none;
  }
  .handle:focus-visible {
    outline: none;
  }
  .handle:focus-visible circle:nth-child(2) {
    stroke: var(--ink);
    stroke-width: 3;
  }
  .handle.dragging circle:nth-child(2) {
    r: 10.5px;
  }
</style>
