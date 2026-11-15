<script lang="ts">
  // Tendencia de cada mes del calendario por separado: ¿en qué meses se concentra el cambio?
  // Color = dirección (sube / baja); relleno pleno = las pruebas ven tendencia en ese mes.
  import { scaleLinear } from 'd3-scale';
  import type { MonthTrend } from '../analysis';
  import { fmtSigned, monthName } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';

  let { months, unit, decimals }: { months: MonthTrend[]; unit: string; decimals: number } = $props();

  let width = $state(720);
  const narrow = $derived(width < 520);
  const height = $derived(narrow ? 230 : 270);
  const m = { top: 16, right: 12, bottom: 30, left: 58 };

  const solid = (mt: MonthTrend) => mt.verdict.level === 'strong' || mt.verdict.level === 'some';

  const y = $derived.by(() => {
    let lo = 0;
    let hi = 0;
    for (const mt of months) {
      if (mt.perDecade === null) continue;
      lo = Math.min(lo, mt.perDecade, mt.ci ? mt.ci[0] : 0);
      hi = Math.max(hi, mt.perDecade, mt.ci ? mt.ci[1] : 0);
    }
    if (lo === 0 && hi === 0) hi = 1;
    return scaleLinear()
      .domain([lo, hi])
      .nice(5)
      .range([height - m.bottom, m.top]);
  });
  const ticks = $derived(y.ticks(5));
  const band = $derived((width - m.left - m.right) / 12);
  const bw = $derived(Math.min(24, band * 0.56));
  const cx = (i: number) => m.left + band * (i + 0.5);

  function barPath(x: number, w: number, yBase: number, yEnd: number): string {
    const h = Math.abs(yEnd - yBase);
    const r = Math.min(4, h, w / 2);
    const s = yEnd < yBase ? 1 : -1; // 1: la barra sube
    return `M${x},${yBase} V${yEnd + s * r} Q${x},${yEnd} ${x + r},${yEnd} H${x + w - r} Q${x + w},${yEnd} ${x + w},${yEnd + s * r} V${yBase} Z`;
  }

  let hover = $state<number | null>(null);
  const hm = $derived(hover === null ? null : months[hover]);
  const val = (v: number | null) => (v === null ? '—' : `${fmtSigned(v, decimals, ui.lang)} ${unit}`);
</script>

<div class="legend" aria-hidden="true">
  <span class="item"><span class="key-box" style="background: var(--up)"></span>{t('mb.up')}</span>
  <span class="item"><span class="key-box" style="background: var(--down)"></span>{t('mb.down')}</span>
  <span class="item"><span class="key-box" style="background: var(--ink-2); opacity: 0.3"></span>{t('mb.pale')}</span>
  <span class="item"><span class="key-line" style="border-color: var(--ink-2); border-top-width: 1.5px"></span>{t('chart.band')}</span>
</div>
<div class="chart-holder" bind:clientWidth={width}>
  <svg class="chart" viewBox="0 0 {width} {height}" {width} {height} role="img" aria-label={t('mb.aria')}>
    {#each ticks as tk (tk)}
      <g class="tick">
        <line class={tk === 0 ? 'axisline' : 'gridline'} x1={m.left} x2={width - m.right} y1={y(tk)} y2={y(tk)} />
        <text x={m.left - 8} y={y(tk)} dy="0.32em" text-anchor="end">{fmtSigned(tk, decimals, ui.lang)}</text>
      </g>
    {/each}
    {#each months as mt, i (mt.month)}
      {#if mt.perDecade !== null}
        <path
          d={barPath(cx(i) - bw / 2, bw, y(0), y(mt.perDecade))}
          fill={mt.perDecade >= 0 ? 'var(--up)' : 'var(--down)'}
          opacity={solid(mt) ? 1 : 0.3}
        />
        {#if mt.ci}
          <line x1={cx(i)} x2={cx(i)} y1={y(mt.ci[0])} y2={y(mt.ci[1])} stroke="var(--ink-2)" stroke-width="1.5" />
          <line x1={cx(i) - 4} x2={cx(i) + 4} y1={y(mt.ci[0])} y2={y(mt.ci[0])} stroke="var(--ink-2)" stroke-width="1.5" />
          <line x1={cx(i) - 4} x2={cx(i) + 4} y1={y(mt.ci[1])} y2={y(mt.ci[1])} stroke="var(--ink-2)" stroke-width="1.5" />
        {/if}
      {/if}
      <text class="tick-m" class:strong={solid(mt)} x={cx(i)} y={height - m.bottom + 18} text-anchor="middle"
        >{narrow ? monthName(mt.month, ui.lang).slice(0, 1).toUpperCase() : monthName(mt.month, ui.lang)}</text
      >
      <rect
        x={m.left + band * i}
        y={m.top}
        width={band}
        height={height - m.top - m.bottom}
        fill="transparent"
        role="presentation"
        onpointerenter={() => (hover = i)}
        onpointerleave={() => (hover = null)}
      />
    {/each}
  </svg>
  {#if hm && hover !== null}
    <div class="tooltip" style="left: {cx(hover)}px; top: {hm.perDecade === null ? m.top + 30 : Math.min(y(hm.perDecade), y(0))}px">
      <strong>{val(hm.perDecade)}</strong>
      <div class="sub">
        {monthName(hm.month, ui.lang)} · {t('unit.perDecade')}{#if hm.ci}
          · {t('fmt.range', { lo: fmtSigned(hm.ci[0], decimals, ui.lang), hi: fmtSigned(hm.ci[1], decimals, ui.lang) })}{/if}
      </div>
      <div class="sub">{t(`verdict.${hm.verdict.level}`)}</div>
    </div>
  {/if}
</div>
<details class="table-view">
  <summary>{t('chart.tableToggle')}</summary>
  <div class="scroll">
    <table class="data">
      <thead>
        <tr><th>{t('mb.month')}</th><th>{t('mb.change')} ({unit})</th><th>{t('ev.interval')}</th><th>{t('oc.lineup.verdict')}</th></tr>
      </thead>
      <tbody>
        {#each months as mt (mt.month)}
          <tr>
            <td>{monthName(mt.month, ui.lang)}</td>
            <td>{mt.perDecade === null ? '—' : fmtSigned(mt.perDecade, decimals, ui.lang)}</td>
            <td>{mt.ci ? t('fmt.range', { lo: fmtSigned(mt.ci[0], decimals, ui.lang), hi: fmtSigned(mt.ci[1], decimals, ui.lang) }) : '—'}</td>
            <td>{t(`verdict.${mt.verdict.level}`)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</details>

<style>
  .tick-m {
    font-size: 12px;
    fill: var(--muted);
  }
  .tick-m.strong {
    fill: var(--ink);
    font-weight: 700;
  }
</style>
