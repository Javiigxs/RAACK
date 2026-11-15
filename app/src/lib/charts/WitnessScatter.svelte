<script lang="ts">
  // Segundo testigo de la lluvia: total mensual del satélite frente al del pluviómetro.
  // Sobre la diagonal, las dos fuentes coinciden.
  import { scaleLinear } from 'd3-scale';
  import type { RainWitness } from '../analysis';
  import { fmt, monthName } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';

  let { w }: { w: RainWitness } = $props();

  let width = $state(420);
  let svgEl = $state<SVGSVGElement | null>(null);
  const size = $derived(Math.min(width, 440));
  const m = { top: 12, right: 14, bottom: 44, left: 54 };
  const max = $derived(Math.max(1, ...w.pairs.map((p) => Math.max(p.sat, p.gauge))));
  const x = $derived(
    scaleLinear()
      .domain([0, max])
      .nice(5)
      .range([m.left, size - m.right])
  );
  const y = $derived(
    scaleLinear()
      .domain(x.domain())
      .range([size - m.bottom, m.top])
  );
  const ticks = $derived(x.ticks(5));

  let hover = $state<number | null>(null);
  function onMove(e: PointerEvent) {
    const r = svgEl!.getBoundingClientRect();
    const px = ((e.clientX - r.left) * size) / r.width;
    const py = ((e.clientY - r.top) * size) / r.height;
    let best = -1;
    let bd = 28 * 28;
    for (let i = 0; i < w.pairs.length; i++) {
      const dx = x(w.pairs[i].gauge) - px;
      const dy = y(w.pairs[i].sat) - py;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    hover = best >= 0 ? best : null;
  }
  const hp = $derived(hover === null ? null : w.pairs[hover]);
  const when = (tt: number) => `${monthName(Math.floor((tt % 1) * 12), ui.lang)} ${Math.floor(tt)}`;
</script>

<div class="chart-holder" bind:clientWidth={width}>
  <svg
    bind:this={svgEl}
    class="chart"
    viewBox="0 0 {size} {size}"
    width={size}
    height={size}
    style="max-width: {size}px"
    role="img"
    aria-label={t('ws.aria')}
    onpointermove={onMove}
    onpointerleave={() => (hover = null)}
  >
    {#each ticks as tk (tk)}
      <g class="tick">
        <line class="gridline" x1={m.left} x2={size - m.right} y1={y(tk)} y2={y(tk)} />
        <line class="gridline" x1={x(tk)} x2={x(tk)} y1={m.top} y2={size - m.bottom} />
        <text x={m.left - 8} y={y(tk)} dy="0.32em" text-anchor="end">{fmt(tk, 0, ui.lang)}</text>
        <text x={x(tk)} y={size - m.bottom + 16} text-anchor="middle">{fmt(tk, 0, ui.lang)}</text>
      </g>
    {/each}
    <line class="axisline" x1={x(0)} y1={y(0)} x2={x(x.domain()[1])} y2={y(x.domain()[1])} stroke-width="1.5" />
    {#each w.pairs as p, i (i)}
      <circle cx={x(p.gauge)} cy={y(p.sat)} r="4" fill="var(--series-1)" fill-opacity="0.55" stroke="var(--surface)" stroke-width="1" />
    {/each}
    {#if hp}
      <circle cx={x(hp.gauge)} cy={y(hp.sat)} r="6" fill="var(--series-1)" stroke="var(--ink)" stroke-width="2" pointer-events="none" />
    {/if}
    <text class="cap" x={(m.left + size - m.right) / 2} y={size - 6} text-anchor="middle">{t('ws.xAxis')}</text>
    <text class="cap" transform="translate(13, {(m.top + size - m.bottom) / 2}) rotate(-90)" text-anchor="middle">{t('ws.yAxis')}</text>
  </svg>
  {#if hp}
    <div class="tooltip" style="left: {x(hp.gauge)}px; top: {y(hp.sat)}px">
      <strong>{fmt(hp.sat, 0, ui.lang)} mm · {fmt(hp.gauge, 0, ui.lang)} mm</strong>
      <div class="sub">{when(hp.t)} · {t('ws.tip')}</div>
    </div>
  {/if}
</div>

<style>
  .cap {
    font-size: 12px;
    fill: var(--ink-2);
    font-weight: 600;
  }
</style>
