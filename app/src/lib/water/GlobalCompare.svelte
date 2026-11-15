<script lang="ts">
  // The same question in two regions, side by side and on the same axis: the stored water of
  // Nuevo León and of California's Central Valley, with what each case can and cannot prove.
  // Code written with AI assistance (Claude) for team RAACK.
  import { scaleLinear } from 'd3-scale';
  import { t } from '../i18n';
  import { setRegion, ui } from '../state.svelte';
  import { analyzeCase } from './case';
  import { LINE_COLORS, REGION_ORDER, REGIONS } from './catalog';
  import CertaintyChip from './CertaintyChip.svelte';
  import { ciW, pW, rateW, signed, valueW } from './format';
  import type { RegionId, WaterData } from './types';
  import YearChart from './YearChart.svelte';

  let { data }: { data: WaterData } = $props();

  // Common period: the years both regions have a yearly value of stored water.
  const y0 = $derived(Math.max(...REGION_ORDER.map((id) => data.regions[id].series.tws_grace?.years[0] ?? REGIONS[id].y0)));
  const y1 = $derived(Math.min(...REGION_ORDER.map((id) => REGIONS[id].y1)));
  const cases = $derived(REGION_ORDER.map((id) => ({ id, c: analyzeCase(data, id, y0, y1) })).filter((x) => x.c.storage));
  const domain = $derived.by<[number, number]>(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const x of cases) {
      for (const v of x.c.storage!.series.values) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    const pad = (hi - lo) * 0.1 || 1;
    return scaleLinear().domain([lo - pad, hi + pad]).nice(5).domain() as [number, number];
  });
  const verdictText = (id: RegionId, c: (typeof cases)[number]['c']) => {
    const v = c.verdict;
    if (v.kind === 'human') return t(v.human === 'backed' ? 'w.g.verdict.backed' : 'w.g.verdict.possible');
    return t(`w.g.verdict.${v.kind}`);
  };
  const state = (c: (typeof cases)[number]['c'], key: 'rain' | 'demand') => {
    const l = key === 'rain' ? c.rain : c.demand;
    return l && l.trend.ok ? { text: rateW(l.def, l.perDecade), label: l.trend.label, dir: l.trend.dir } : { text: t('w.ex.notLoaded'), label: 'nodata' as const, dir: 0 as const };
  };
</script>

<div class="pair">
  {#each cases as x, k (x.id)}
    {@const s = x.c.storage!}
    <article class="side">
      <header>
        <h3>{t(`w.region.${x.id}.name`)}</h3>
        <span class="small">{t('w.g.mascons', { n: data.regions[x.id].cells.tws_grace_mascons ?? 0 })}</span>
      </header>
      <div class="headline">
        <span class="num">{signed(s.perDecade, 1)}</span>
        <span class="unit">{t('w.tunit.cm')}<br />{t('unit.perDecade')}</span>
      </div>
      <div class="label-row">
        <CertaintyChip label={s.trend.label} dir={s.trend.dir} />
        <span class="small">{t('w.fact.ci')} {ciW(s.def, s.ci)} · {pW(s.trend.p)}</span>
      </div>
      <YearChart
        lines={[
          {
            id: `${x.id}-tws`,
            label: t('w.series.tws_grace'),
            color: LINE_COLORS[k],
            years: s.series.years,
            values: s.series.values,
            main: true,
            trend: { slope: s.trend.sen, intercept: s.trend.senIntercept }
          }
        ]}
        {y0}
        {y1}
        {domain}
        format={(val) => valueW(s.def, val, true)}
        axisFormat={(val) => signed(val, 0)}
        unitLabel={t('w.unit.cm.axis')}
        ariaLabel={t('w.chart.aria', { name: `${t('w.sus.storage.name')}, ${t(`w.region.${x.id}.name`)}`, y0, y1 })}
        gap={[2017, 2018]}
        gapLabel={t('w.chart.gap')}
      />
      <dl class="facts">
        {#each ['rain', 'demand'] as const as key (key)}
          {@const q = state(x.c, key)}
          <div>
            <dt>{t(`w.ex.${key}`)}</dt>
            <dd>{q.text} <CertaintyChip label={q.label} dir={q.dir} compact /></dd>
          </div>
        {/each}
        <div>
          <dt>{t('w.ex.official')}</dt>
          <dd>
            {#if x.c.aquifers}
              {t('w.ex.officialValue', { neg: x.c.aquifers.negative, total: x.c.aquifers.total })} <CertaintyChip label="confirmed" text={t('w.cert.official')} compact />
            {:else}
              {t('w.ex.notLoaded')} <CertaintyChip label="nodata" compact />
            {/if}
          </dd>
        </div>
        <div class="verdict-row">
          <dt>{t('w.g.verdict')}</dt>
          <dd><strong>{verdictText(x.id, x.c)}</strong></dd>
        </div>
      </dl>
      {#if ui.region !== x.id}
        <button class="btn" onclick={() => { setRegion(x.id); document.getElementById('w-verdict')?.scrollIntoView({ behavior: 'smooth' }); }}>{t('w.g.open', { name: t(`w.region.${x.id}.name`) })} <span aria-hidden="true">↑</span></button>
      {/if}
    </article>
  {/each}
</div>
<p class="note">{t('w.g.note', { y0, y1 })}</p>

<style>
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gap-block) 64px;
    align-items: start;
  }
  .side {
    display: grid;
    gap: 14px;
    min-width: 0;
    justify-items: start;
    border-top: 1px solid var(--border);
    padding-top: 22px;
  }
  .side > :global(*) {
    width: 100%;
  }
  .side > .btn {
    width: auto;
    margin-top: 6px;
  }
  header {
    display: grid;
    gap: 4px;
  }
  h3 {
    font-size: clamp(22px, 2.3vw, 28px);
    letter-spacing: -0.025em;
  }
  .headline {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    margin-top: 8px;
  }
  .num {
    font-size: var(--fs-figure);
    font-weight: 500;
    letter-spacing: -0.045em;
    line-height: 0.92;
    font-variant-numeric: tabular-nums;
  }
  .unit {
    font-size: var(--fs-small);
    color: var(--ink-2);
    line-height: 1.25;
    padding-bottom: 2px;
  }
  .label-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    margin-bottom: 8px;
  }
  .facts {
    margin: 6px 0 0;
    display: grid;
    gap: 0;
    font-size: var(--fs-small);
  }
  .facts div {
    display: grid;
    grid-template-columns: minmax(110px, 0.8fr) 1.6fr;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--border);
    align-items: center;
  }
  .facts dt {
    color: var(--ink-2);
  }
  .facts dd {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    font-variant-numeric: tabular-nums;
  }
  .verdict-row dd strong {
    font-weight: 600;
  }
  @media (max-width: 860px) {
    .pair {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
