<script lang="ts">
  // Calendario de un año de lluvia: un cuadro por día, más oscuro cuanto más llovió.
  // Los cinco días más lluviosos llevan un aro: es la idea de Fran hecha imagen.
  import { RAIN_BINS, fmt, monthName } from '../catalog';
  import { t } from '../i18n';
  import type { RainYear } from '../stats/rain';
  import { daysInMonth } from '../stats/series';
  import { ui } from '../state.svelte';

  let { year, ring = true }: { year: RainYear; ring?: boolean } = $props();

  let width = $state(480);
  let svgEl = $state<SVGSVGElement | null>(null);
  const labelW = 34;
  const top = 18;
  const gap = 2;
  const cell = $derived(Math.max(5, Math.floor((width - labelW - 4) / 31) - gap));
  const pitch = $derived(cell + gap);
  const height = $derived(top + 12 * pitch + 4);

  interface Cell {
    k: number;
    m: number;
    d: number;
    v: number | null;
    rank: number;
  }
  const cells = $derived.by(() => {
    const out: Cell[] = [];
    const top5 = new Map(year.top5Days.map((d, i) => [d, i + 1]));
    let k = 0;
    for (let m = 0; m < 12; m++) {
      const nd = daysInMonth(year.year, m);
      for (let d = 0; d < nd; d++, k++) out.push({ k, m, d, v: year.daily[k] ?? null, rank: top5.get(k) ?? 0 });
    }
    return out;
  });
  const byPos = $derived(new Map(cells.map((c) => [c.m * 31 + c.d, c])));

  function bin(v: number | null): number {
    if (v === null) return -1;
    let b = 0;
    for (const th of RAIN_BINS) if (v >= th) b++;
    return b;
  }

  let hover = $state<Cell | null>(null);
  function onMove(e: PointerEvent) {
    const r = svgEl!.getBoundingClientRect();
    const px = ((e.clientX - r.left) * width) / r.width;
    const py = ((e.clientY - r.top) * height) / r.height;
    const col = Math.floor((px - labelW) / pitch);
    const row = Math.floor((py - top) / pitch);
    hover = col >= 0 && col < 31 && row >= 0 && row < 12 ? (byPos.get(row * 31 + col) ?? null) : null;
  }
  const dateLabel = (c: Cell) => (ui.lang === 'es' ? `${c.d + 1} ${monthName(c.m, 'es')} ${year.year}` : `${monthName(c.m, 'en')} ${c.d + 1}, ${year.year}`);
</script>

<div class="chart-holder" bind:clientWidth={width}>
  <svg
    bind:this={svgEl}
    class="chart"
    viewBox="0 0 {width} {height}"
    {width}
    {height}
    role="img"
    aria-label={t('cal.aria', { year: year.year })}
    onpointermove={onMove}
    onpointerleave={() => (hover = null)}
  >
    {#each [1, 10, 20, 31] as dd (dd)}
      <text class="tick-day" x={labelW + (dd - 1) * pitch + cell / 2} y={11} text-anchor="middle">{dd}</text>
    {/each}
    {#each Array(12) as _, mm (mm)}
      <text class="tick-month" x={labelW - 8} y={top + mm * pitch + cell / 2} dy="0.34em" text-anchor="end">{monthName(mm, ui.lang)}</text>
    {/each}
    {#each cells as c (c.k)}
      {#if c.v === null}
        <rect x={labelW + c.d * pitch + 0.5} y={top + c.m * pitch + 0.5} width={cell - 1} height={cell - 1} rx="2" fill="none" stroke="var(--axis)" />
      {:else}
        <rect x={labelW + c.d * pitch} y={top + c.m * pitch} width={cell} height={cell} rx="2" fill="var(--seq-{bin(c.v)})" />
      {/if}
    {/each}
    {#if ring}
      {#each cells.filter((c) => c.rank > 0) as c (c.k)}
        <rect
          class="ring"
          x={labelW + c.d * pitch - 2.5}
          y={top + c.m * pitch - 2.5}
          width={cell + 5}
          height={cell + 5}
          rx="4"
          fill="none"
          stroke="var(--ink)"
          stroke-width="2"
        />
      {/each}
    {/if}
    {#if hover}
      <rect
        x={labelW + hover.d * pitch - 1}
        y={top + hover.m * pitch - 1}
        width={cell + 2}
        height={cell + 2}
        rx="3"
        fill="none"
        stroke="var(--ink-2)"
        stroke-width="1.5"
        pointer-events="none"
      />
    {/if}
  </svg>
  {#if hover}
    <div class="tooltip" style="left: {labelW + hover.d * pitch + cell / 2}px; top: {top + hover.m * pitch}px">
      <strong>{hover.v === null ? t('chart.noData') : `${fmt(hover.v, 1, ui.lang)} mm`}</strong>
      <div class="sub">
        {dateLabel(hover)}{#if hover.rank > 0}
          · {t('cal.rank', { n: hover.rank })}{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .tick-day,
  .tick-month {
    font-size: 11px;
    fill: var(--muted);
  }
  .ring {
    pointer-events: none;
  }
</style>
