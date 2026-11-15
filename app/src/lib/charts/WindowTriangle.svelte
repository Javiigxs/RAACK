<script lang="ts">
  // La coartada del periodo: la misma prueba para cada combinación de año inicial y final.
  // Color = ritmo de cambio (divergente, gris en cero); punto = las pruebas ven tendencia.
  import type { WindowCell, WindowScan } from '../analysis';
  import { fmtSigned } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';

  let {
    scan,
    unit,
    decimals,
    y0,
    y1,
    onpick
  }: {
    scan: WindowScan;
    unit: string;
    decimals: number;
    y0: number;
    y1: number;
    onpick?: (start: number, end: number) => void;
  } = $props();

  let width = $state(640);
  let svgEl = $state<SVGSVGElement | null>(null);
  const m = { top: 28, right: 10, bottom: 44, left: 58 };
  const nStart = $derived(scan.yMax - scan.minYears + 1 - scan.yMin + 1);
  const nEnd = $derived(nStart);
  const cell = $derived(Math.max(9, Math.min(30, Math.floor((width - m.left - m.right) / Math.max(nStart, 1)))));
  const height = $derived(m.top + nEnd * cell + m.bottom);
  const x = (start: number) => m.left + (start - scan.yMin) * cell;
  const y = (end: number) => m.top + (scan.yMax - end) * cell;

  function fill(c: WindowCell): string {
    if (!c.enough || c.perDecade === null) return 'transparent';
    const k = scan.maxAbs > 0 ? Math.min(1, Math.abs(c.perDecade) / scan.maxAbs) : 0;
    return `color-mix(in srgb, var(${c.perDecade >= 0 ? '--up' : '--down'}) ${Math.round(10 + 90 * k)}%, var(--neutral-mid))`;
  }

  const byKey = $derived(new Map(scan.cells.map((c) => [`${c.start}-${c.end}`, c])));
  const selected = $derived(byKey.get(`${y0}-${y1}`) ?? null);
  const stepYears = $derived(cell >= 24 ? 2 : 5);
  const startTicks = $derived.by(() => {
    const out: number[] = [];
    for (let v = scan.yMin; v <= scan.yMax - scan.minYears + 1; v++) if ((v - scan.yMin) % stepYears === 0) out.push(v);
    return out;
  });
  const endTicks = $derived.by(() => {
    const out: number[] = [];
    for (let v = scan.yMin + scan.minYears - 1; v <= scan.yMax; v++) if ((scan.yMax - v) % stepYears === 0) out.push(v);
    return out;
  });

  let hover = $state<WindowCell | null>(null);
  function locate(e: PointerEvent | MouseEvent): WindowCell | null {
    const r = svgEl!.getBoundingClientRect();
    const px = ((e.clientX - r.left) * width) / r.width;
    const py = ((e.clientY - r.top) * height) / r.height;
    const start = scan.yMin + Math.floor((px - m.left) / cell);
    const end = scan.yMax - Math.floor((py - m.top) / cell);
    return byKey.get(`${start}-${end}`) ?? null;
  }
  function click(e: MouseEvent) {
    const c = locate(e);
    if (c) onpick?.(c.start, c.end);
  }
</script>

<div class="chart-holder" bind:clientWidth={width}>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <svg
    bind:this={svgEl}
    class="chart"
    class:pickable={!!onpick}
    viewBox="0 0 {width} {height}"
    {width}
    {height}
    role="img"
    aria-label={t('wt.aria')}
    onpointermove={(e) => (hover = locate(e))}
    onpointerleave={() => (hover = null)}
    onclick={click}
  >
    {#each scan.cells as c (c.start * 10000 + c.end)}
      <rect
        x={x(c.start) + 1}
        y={y(c.end) + 1}
        width={cell - 2}
        height={cell - 2}
        rx="3"
        fill={fill(c)}
        stroke={c.enough ? 'none' : 'var(--axis)'}
        stroke-dasharray={c.enough ? undefined : '2 2'}
      />
      {#if c.significant}
        <circle cx={x(c.start) + cell / 2} cy={y(c.end) + cell / 2} r={Math.max(1.8, cell * 0.11)} fill="var(--ink)" stroke="var(--surface)" stroke-width="1" />
      {/if}
    {/each}
    {#if selected}
      <rect x={x(selected.start) - 1} y={y(selected.end) - 1} width={cell + 2} height={cell + 2} rx="5" fill="none" stroke="var(--ink)" stroke-width="2.5" pointer-events="none" />
    {/if}
    {#if hover && hover !== selected}
      <rect x={x(hover.start)} y={y(hover.end)} width={cell} height={cell} rx="4" fill="none" stroke="var(--ink-2)" stroke-width="1.5" pointer-events="none" />
    {/if}
    {#each startTicks as v (v)}
      <text class="tk" x={x(v) + cell / 2} y={m.top + nEnd * cell + 16} text-anchor="middle">{v}</text>
    {/each}
    {#each endTicks as v (v)}
      <text class="tk" x={m.left - 8} y={y(v) + cell / 2} dy="0.32em" text-anchor="end">{v}</text>
    {/each}
    <text class="cap" x={m.left} y={height - 6}>{t('wt.start')} →</text>
    <text class="cap" x={8} y={14}>↑ {t('wt.end')}</text>
  </svg>
  {#if hover}
    <div class="tooltip" style="left: {x(hover.start) + cell / 2}px; top: {y(hover.end)}px">
      <strong>{hover.perDecade === null ? '—' : `${fmtSigned(hover.perDecade, decimals, ui.lang)} ${unit}`}</strong>
      <div class="sub">{hover.start}–{hover.end} · {hover.years} {t('wt.years')} · {t('unit.perDecade')}</div>
      <div class="sub">{hover.enough ? t(hover.significant ? 'wt.sig' : 'wt.notSig') : t('verdict.insufficient')}</div>
    </div>
  {/if}
</div>
<div class="scale" aria-hidden="true">
  <span>{fmtSigned(-scan.maxAbs, decimals, ui.lang)}</span>
  <span class="ramp"></span>
  <span>{fmtSigned(scan.maxAbs, decimals, ui.lang)} {unit} {t('unit.perDecade')}</span>
  <span class="item"><span class="sigdot"></span>{t('wt.sig')}</span>
  <span class="item"><span class="nodata"></span>{t('verdict.insufficient')}</span>
</div>

<style>
  svg.pickable {
    cursor: pointer;
  }
  .tk {
    font-size: 11px;
    fill: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .cap {
    font-size: 11.5px;
    fill: var(--ink-2);
    font-weight: 600;
  }
  .scale {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    font-size: 12.5px;
    color: var(--ink-2);
    margin-top: 6px;
    font-variant-numeric: tabular-nums;
  }
  .ramp {
    width: 140px;
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(to right, var(--down), var(--neutral-mid), var(--up));
  }
  .item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 10px;
  }
  .sigdot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ink);
  }
  .nodata {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px dashed var(--axis);
  }
</style>
