<script lang="ts">
  // Un cuadro por mes: filas = meses del año, columnas = años. Cada cuadro compara ese mes con la
  // media del mismo mes en el periodo; cuanto más cálido, más rojo (una sola tonalidad, de claro a
  // oscuro). Es la pareja del calendario de lluvia: azul para la lluvia, rojo para el calor.
  // Código escrito con ayuda de IA (Claude) para el equipo RAACK.
  import type { Snippet } from 'svelte';
  import { HEAT_BINS, fmt, fmtSigned, monthName } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import type { Monthly } from '../stats/series';

  let {
    monthly,
    clim,
    name,
    compact = false,
    year = null,
    children
  }: {
    /** Valores mensuales (°C) desde enero de `monthly.y0`. */
    monthly: Monthly;
    /** Media de cada mes del calendario en el periodo. */
    clim: (number | null)[];
    /** Nombre de la variable, para la descripción accesible. */
    name: string;
    compact?: boolean;
    /** Año que se marca con un recuadro (el del selector de la tarjeta), si hay uno. */
    year?: number | null;
    /** Lo que se lee justo debajo de la leyenda, antes de la tabla (los textos de la tarjeta). */
    children?: Snippet;
  } = $props();

  let width = $state(520);
  let svgEl = $state<SVGSVGElement | null>(null);
  const labelW = 34;
  const top = 18;
  const gap = 2;
  const nYears = $derived(Math.floor(monthly.values.length / 12));
  const y1 = $derived(monthly.y0 + nYears - 1);
  const cell = $derived(Math.max(5, Math.min(compact ? 20 : 26, Math.floor((width - labelW - 4) / Math.max(nYears, 1)) - gap)));
  const pitch = $derived(cell + gap);
  const height = $derived(top + 12 * pitch + 4);

  interface Cell {
    k: number;
    year: number;
    col: number;
    m: number;
    v: number | null;
    diff: number | null;
  }
  const cells = $derived.by(() => {
    const out: Cell[] = [];
    for (let k = 0; k < nYears * 12; k++) {
      const v = monthly.values[k] ?? null;
      const c = clim[k % 12];
      out.push({ k, year: monthly.y0 + Math.floor(k / 12), col: Math.floor(k / 12), m: k % 12, v, diff: v === null || c === null ? null : v - c });
    }
    return out;
  });

  function bin(d: number): number {
    let b = 0;
    for (const th of HEAT_BINS) if (d >= th) b++;
    return b;
  }
  /** Column of the marked year, or -1. */
  const pickCol = $derived(year !== null && year >= monthly.y0 && year <= y1 ? year - monthly.y0 : -1);
  const yearTicks = $derived.by(() => {
    const step = pitch >= 30 ? 2 : pitch >= 13 ? 5 : 10;
    const out: number[] = [];
    for (let y = monthly.y0; y <= y1; y++) if (y % step === 0) out.push(y);
    // The marked year gets its own label: the ticks that would touch it step aside.
    return pickCol < 0 ? out : out.filter((y) => y !== year && Math.abs(y - (year as number)) * pitch >= 30);
  });

  let hover = $state<Cell | null>(null);
  function onMove(e: PointerEvent) {
    const r = svgEl!.getBoundingClientRect();
    const px = ((e.clientX - r.left) * width) / r.width;
    const py = ((e.clientY - r.top) * height) / r.height;
    const col = Math.floor((px - labelW) / pitch);
    const row = Math.floor((py - top) / pitch);
    hover = col >= 0 && col < nYears && row >= 0 && row < 12 ? (cells[col * 12 + row] ?? null) : null;
  }
  const monthLabel = (c: Cell) => `${monthName(c.m, ui.lang)} ${c.year}`;
  const tableYears = $derived(Array.from({ length: nYears }, (_, i) => monthly.y0 + i));
</script>

<div class="chart-holder" bind:clientWidth={width}>
  <svg
    bind:this={svgEl}
    class="chart"
    viewBox="0 0 {width} {height}"
    {width}
    {height}
    role="img"
    aria-label={t('sq.heat.aria', { name, y0: monthly.y0, y1 })}
    onpointermove={onMove}
    onpointerleave={() => (hover = null)}
  >
    {#each yearTicks as y (y)}
      <text class="tick-top" x={labelW + (y - monthly.y0) * pitch + cell / 2} y={11} text-anchor="middle">{y}</text>
    {/each}
    {#each Array(12) as _, mm (mm)}
      <text class="tick-month" x={labelW - 8} y={top + mm * pitch + cell / 2} dy="0.34em" text-anchor="end">{monthName(mm, ui.lang)}</text>
    {/each}
    {#each cells as c (c.k)}
      {#if c.diff === null}
        <rect x={labelW + c.col * pitch + 0.5} y={top + c.m * pitch + 0.5} width={cell - 1} height={cell - 1} rx="2" fill="none" stroke="var(--axis)" />
      {:else}
        <rect x={labelW + c.col * pitch} y={top + c.m * pitch} width={cell} height={cell} rx="2" fill="var(--heat-{bin(c.diff)})" />
      {/if}
    {/each}
    {#if pickCol >= 0}
      <text class="tick-pick" x={labelW + pickCol * pitch + cell / 2} y={11} text-anchor="middle">{year}</text>
      <rect
        x={labelW + pickCol * pitch - 2}
        y={top - 2}
        width={cell + 4}
        height={12 * pitch - gap + 4}
        rx="4"
        fill="none"
        stroke="var(--ink)"
        stroke-width="1.5"
        pointer-events="none"
      />
    {/if}
    {#if hover}
      <rect
        x={labelW + hover.col * pitch - 1}
        y={top + hover.m * pitch - 1}
        width={cell + 2}
        height={cell + 2}
        rx="3"
        fill="none"
        stroke="var(--ink)"
        stroke-width="1.5"
        pointer-events="none"
      />
    {/if}
  </svg>
  {#if hover}
    <div class="tooltip" style="left: {Math.max(70, Math.min(width - 70, labelW + hover.col * pitch + cell / 2))}px; top: {top + hover.m * pitch}px">
      {#if hover.diff === null || hover.v === null}
        <strong>{t('chart.noData')}</strong>
        <div class="sub">{monthLabel(hover)}</div>
      {:else}
        <strong>{fmtSigned(hover.diff, 1, ui.lang)} °C</strong>
        <div class="sub">{t('sq.heat.tip', { month: monthName(hover.m, ui.lang) })}</div>
        <div class="sub">{monthLabel(hover)} · {fmt(hover.v, 1, ui.lang)} °C</div>
      {/if}
    </div>
  {/if}
</div>

<div class="legend heat-legend">
  <span class="item about">{t('sq.heat.legend')}</span>
  <span class="item"><span class="key-box" style="background: var(--heat-0)"></span>{t('sq.heat.below', { v: fmtSigned(HEAT_BINS[0], 0, ui.lang) })}</span>
  {#each [1, 2, 3] as b (b)}
    <span class="item"
      ><span class="key-box" style="background: var(--heat-{b})"></span>{t('sq.heat.between', { a: fmtSigned(HEAT_BINS[b - 1], 0, ui.lang), b: fmtSigned(HEAT_BINS[b], 0, ui.lang) })}</span
    >
  {/each}
  <span class="item"><span class="key-box" style="background: var(--heat-4)"></span>{t('sq.heat.above', { v: fmtSigned(HEAT_BINS[3], 0, ui.lang) })}</span>
  <span class="item"><span class="key-box none"></span>{t('sq.heat.missing')}</span>
</div>

{@render children?.()}

<details class="table-view">
  <summary>{t('chart.tableToggle')}</summary>
  <div class="scroll">
    <table class="data">
      <thead>
        <tr>
          <th>{t('chart.year')}</th>
          {#each Array(12) as _, mm (mm)}<th>{monthName(mm, ui.lang)}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each tableYears as y, i (y)}
          <tr>
            <td>{y}</td>
            {#each Array(12) as _, mm (mm)}
              {@const c = cells[i * 12 + mm]}
              <td>{c.diff === null ? '—' : fmtSigned(c.diff, 1, ui.lang)}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</details>

<style>
  .tick-top,
  .tick-month {
    font-size: 11px;
    fill: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .tick-pick {
    font-size: 11px;
    font-weight: 600;
    fill: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .heat-legend {
    margin: 8px 0 0;
  }
  .heat-legend .about {
    font-weight: 500;
    color: var(--ink);
  }
  .key-box.none {
    background: transparent;
    outline: 1px solid var(--axis);
    outline-offset: -1px;
  }
</style>
