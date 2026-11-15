<script lang="ts">
  // One suspect of the water budget: its yearly series, the Sen line, the change per decade with its
  // interval and p-value, the certainty label, and its witnesses on the same axis.
  // Code written with AI assistance (Claude) for team RAACK.
  import { tOr, t } from '../i18n';
  import { ui } from '../state.svelte';
  import type { CaseAnalysis, LineResult, SuspectResult } from './case';
  import { LINE_COLORS } from './catalog';
  import CertaintyChip from './CertaintyChip.svelte';
  import { ciW, lineName, num, pctW, pW, rateNum, rateW, signed, valueW } from './format';
  import type { WaterRegion } from './types';
  import YearChart, { type ChartLine } from './YearChart.svelte';

  let { s, c, region }: { s: SuspectResult; c: CaseAnalysis; region: WaterRegion } = $props();

  const main = $derived(s.main);
  const others = $derived(s.lines.filter((l) => l !== main));

  // Up to two lines can join the main one on the chart. A line keeps its slot (and its colour).
  let slots = $state<(string | null)[] | null>(null);
  const defaults = $derived<(string | null)[]>([others[0]?.id ?? null, others.find((l, i) => i > 0 && l.role !== 'related')?.id ?? null]);
  const shown = $derived((slots ?? defaults).map((id) => (id && others.some((l) => l.id === id) ? id : null)));
  let turn = 0;
  function toggle(id: string) {
    const next = [...shown];
    const at = next.indexOf(id);
    if (at >= 0) next[at] = null;
    else {
      const free = next.indexOf(null);
      if (free >= 0) next[free] = id;
      else {
        next[turn % 2] = id;
        turn++;
      }
    }
    slots = next;
  }

  const chartLines = $derived.by<ChartLine[]>(() => {
    if (!main) return [];
    const out: ChartLine[] = [
      {
        id: main.id,
        label: lineName(main),
        color: LINE_COLORS[0],
        years: main.series.years,
        values: main.series.values,
        main: true,
        trend: main.trend.ok ? { slope: main.trend.sen, intercept: main.trend.senIntercept } : null
      }
    ];
    shown.forEach((id, k) => {
      const l = others.find((o) => o.id === id);
      if (l) out.push({ id: l.id, label: lineName(l), color: LINE_COLORS[k + 1], years: l.series.years, values: l.series.values });
    });
    return out;
  });

  const monthly = $derived.by(() => {
    const g = s.id === 'storage' ? region.monthly.tws_grace : undefined;
    if (!g?.deseasoned) return null;
    return { t: g.months.map((mm) => Number(mm.slice(0, 4)) + (Number(mm.slice(5, 7)) - 0.5) / 12), v: g.deseasoned };
  });
  // Years of the GRACE record without a yearly value (fewer than 9 months): named, never filled.
  const missingYears = $derived.by(() => {
    if (s.id !== 'storage' || !main) return [];
    const out: number[] = [];
    for (let yr = main.series.years[0]; yr <= main.series.years[main.series.years.length - 1]; yr++) if (!main.series.years.includes(yr)) out.push(yr);
    return out;
  });
  const gap = $derived<[number, number] | null>(missingYears.includes(2017) && missingYears.includes(2018) ? [2017, 2018] : null);

  const findingText = $derived.by(() => {
    const hot = s.hotPlace;
    const p = {
      name: t(`w.sus.${s.id}.name`),
      rate: main ? rateW(main.def, main.perDecade) : '—',
      pct: main ? pctW(main.pct, 1) : '—',
      ci: main ? ciW(main.def, main.ci) : '—',
      agree: s.agree,
      others: s.others,
      place: hot ? t(`w.place.${hot.def.place}`) : '—',
      placeRate: hot ? rateW(hot.def, hot.perDecade) : '—',
      placePct: hot ? pctW(hot.pct, 1) : '—',
      neg: c.aquifers?.negative ?? 0,
      total: c.aquifers?.total ?? 0
    };
    return tOr(`w.find.${s.id}.${s.finding}`, `w.find.any.${s.finding}`).replace(/\{(\w+)\}/g, (_, k: string) => String(p[k as keyof typeof p] ?? '—'));
  });

  const periodOf = (l: LineResult) => (l.trend.n ? `${l.series.years[0]}–${l.series.years[l.series.years.length - 1]} · ${t('w.tbl.nYears', { n: l.trend.n })}` : '—');
  const fit = $derived(s.id === 'storage' ? c.rainFit : null);
</script>

<article class="suspect card" id="suspect-{s.id}">
  <header>
    <div class="who">
      <span class="tag"><span class="dot {s.budget}"></span>{t(`w.budget.${s.budget}`)}</span>
      <h3>{t(`w.sus.${s.id}.name`)}</h3>
    </div>
    <span class="status {s.status}">{t(s.status === 'flagged' && s.budget === 'store' ? 'w.status.losing' : `w.status.${s.status}`)}</span>
  </header>
  <p class="def">{t(`w.sus.${s.id}.def`)}</p>

  {#if main}
    <div class="headline">
      <div class="big" class:quiet={main.trend.label !== 'confirmed'}>
        <span class="num">{main.trend.ok ? rateNum(main.def, main.perDecade) : '—'}</span>
        <span class="unit">{t(`w.tunit.${main.def.unit}`)}<br />{t('unit.perDecade')}</span>
      </div>
      <dl class="facts">
        {#if main.pct !== null}
          <div><dt>{t('w.fact.pct')}</dt><dd>{pctW(main.pct, 1)}</dd></div>
        {/if}
        <div><dt>{t('w.fact.ci')}</dt><dd>{ciW(main.def, main.ci)}</dd></div>
        <div><dt>{t('w.fact.p')}</dt><dd>{pW(main.trend.p)}</dd></div>
        <div><dt>{t('w.fact.source')}</dt><dd>{lineName(main)} · {periodOf(main)}</dd></div>
      </dl>
    </div>
    <div class="label-row">
      <CertaintyChip label={main.trend.label} dir={main.trend.dir} />
      <span class="small muted">{t(`w.kind.${main.def.kind}`)} · {main.def.product}</span>
    </div>
  {/if}

  <p class="finding">{findingText}</p>

  {#if main && main.trend.ok}
    {#if others.length}
      <div class="overlay" role="group" aria-label={t('w.card.overlayAria')}>
        <span class="small">{t('w.card.overlay')}</span>
        {#each others as l (l.id)}
          {@const k = shown.indexOf(l.id)}
          <button class="chipbtn" aria-pressed={k >= 0} onclick={() => toggle(l.id)}>
            {#if k >= 0}<span class="sw" style="background: {LINE_COLORS[k + 1]}"></span>{/if}{lineName(l)}
          </button>
        {/each}
      </div>
    {/if}
    <YearChart
      lines={chartLines}
      y0={c.y0}
      y1={c.y1}
      format={(v) => valueW(main.def, v, main.def.unit === 'cm')}
      axisFormat={(v) => (main.def.unit === 'cm' ? signed(v, 0) : num(v, main.def.unit === 'degc' ? 1 : 0))}
      unitLabel={t(`w.unit.${main.def.unit}.axis`)}
      ariaLabel={t('w.chart.aria', { name: t(`w.sus.${s.id}.name`), y0: c.y0, y1: c.y1 })}
      background={monthly}
      backgroundLabel={t('w.chart.monthly')}
      marks={s.id === 'rain' ? c.verdict.droughtYears : []}
      {gap}
      gapLabel={t('w.chart.gap')}
    />
    {#if s.id === 'rain' && c.verdict.droughtYears.length}
      <p class="small muted">{t('w.card.droughtMarks', { years: c.verdict.droughtYears.join(', ') })}</p>
    {/if}
    {#if missingYears.length}
      <p class="small muted">{t('w.card.graceGaps', { years: missingYears.join(', ') })}</p>
    {/if}
  {/if}

  {#if fit}
    <div class="extra">
      <h4>{t('w.card.afterRain')}</h4>
      <p>
        {t('w.card.afterRainText', {
          r2: pctW(fit.r2 * 100, 0, false),
          n: fit.n,
          rate: rateW(c.storage!.def, fit.trend.sen * 10),
          ci: ciW(c.storage!.def, [fit.trend.lo * 10, fit.trend.hi * 10])
        })}
      </p>
      <CertaintyChip label={fit.trend.label} dir={fit.trend.dir} compact />
    </div>
  {/if}

  {#if s.id === 'human'}
    <div class="extra">
      {#if c.aquifers}
        <h4>{t('w.card.official')}</h4>
        <p>{t('w.card.officialText', { neg: c.aquifers.negative, total: c.aquifers.total, deficit: num(Math.abs(c.aquifers.deficit), 1) })}</p>
      {:else}
        <h4>{t('w.card.noOfficial')}</h4>
        <p>{t('w.card.noOfficialText')}</p>
      {/if}
      <a class="btn small-btn" href="#w-evidence">{t('w.card.seeEvidence')} <span aria-hidden="true">↓</span></a>
    </div>
  {/if}

  {#if s.lines.length > 1}
    <details class="lines" open={ui.concern === 'drought' && s.id === 'rain'}>
      <summary>{t('w.card.witnesses', { n: s.lines.length - 1 })}</summary>
      <div class="scroll-x">
        <table class="data wtable">
          <thead>
            <tr>
              <th>{t('w.tbl.source')}</th>
              <th>{t('w.tbl.rate')}</th>
              <th>{t('w.tbl.ci')}</th>
              <th>{t('w.tbl.p')}</th>
              <th>{t('w.tbl.label')}</th>
            </tr>
          </thead>
          <tbody>
            {#each s.lines as l (l.id)}
              <tr>
                <td>
                  <strong>{lineName(l)}</strong>
                  <span class="meta">{t(`w.role.${l.role}`)} · {t(`w.kind.${l.def.kind}`)} · {periodOf(l)}</span>
                </td>
                <td data-label={t('w.tbl.rate')}>{l.trend.ok ? `${rateNum(l.def, l.perDecade)} ${t(`w.tunit.${l.def.unit}`)}` : '—'}{#if l.pct !== null}<span class="meta">{pctW(l.pct, 1)}</span>{/if}</td>
                <td data-label={t('w.tbl.ci')}>{ciW(l.def, l.ci)}</td>
                <td data-label={t('w.tbl.p')}>{pW(l.trend.p)}</td>
                <td><CertaintyChip label={l.trend.label} dir={l.trend.dir} compact /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}
</article>

<style>
  .suspect {
    padding: clamp(16px, 2.4vw, 24px);
    display: grid;
    gap: 12px;
    align-content: start;
    min-width: 0;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .who {
    display: grid;
    gap: 7px;
    justify-items: start;
  }
  h3 {
    font-size: clamp(20px, 2.4vw, 24px);
  }
  .dot.in {
    background: var(--series-1);
  }
  .dot.out {
    background: var(--series-2);
  }
  .dot.store {
    background: var(--series-3);
  }
  .dot.context {
    background: var(--muted);
  }
  .status {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 4px 9px;
    border-radius: 7px;
    border: 1px solid var(--border-strong);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .status.flagged {
    background: var(--ink);
    color: var(--page);
    border-color: var(--ink);
  }
  .status.open {
    border-style: dashed;
  }
  .def {
    color: var(--ink-2);
    font-size: 15px;
    max-width: 66ch;
  }
  .headline {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px 28px;
  }
  .big {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }
  .num {
    font-size: clamp(38px, 5.4vw, 54px);
    font-weight: 780;
    letter-spacing: -0.035em;
    line-height: 0.95;
  }
  .big.quiet .num {
    color: var(--muted);
  }
  .unit {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-2);
    line-height: 1.25;
    padding-bottom: 3px;
  }
  .facts {
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 12px;
    font-size: 13.5px;
  }
  .facts div {
    display: contents;
  }
  .facts dt {
    color: var(--ink-2);
  }
  .facts dd {
    margin: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .label-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .finding {
    font-size: 16.5px;
    line-height: 1.45;
    max-width: 68ch;
  }
  .overlay {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 7px;
  }
  .chipbtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    cursor: pointer;
    font-weight: 600;
    font-size: 12.5px;
    color: var(--ink-2);
  }
  .chipbtn[aria-pressed='true'] {
    color: var(--ink);
    border-color: var(--ink);
  }
  .sw {
    width: 12px;
    height: 3px;
    border-radius: 2px;
  }
  .extra {
    border-top: 1px solid var(--grid);
    padding-top: 12px;
    display: grid;
    gap: 7px;
    justify-items: start;
  }
  .extra h4 {
    font-size: 15px;
  }
  .extra p {
    font-size: 15px;
    color: var(--ink-2);
    max-width: 68ch;
  }
  details.lines {
    border-top: 1px solid var(--grid);
    padding-top: 10px;
    font-size: 14px;
  }
  details.lines summary {
    cursor: pointer;
    font-weight: 650;
    color: var(--accent-ink);
    width: fit-content;
  }
  .wtable {
    margin-top: 8px;
    font-size: 13.5px;
  }
  .wtable td {
    vertical-align: top;
    white-space: nowrap;
  }
  .wtable td:first-child {
    white-space: normal;
    min-width: 170px;
  }
  .meta {
    display: block;
    font-size: 12px;
    color: var(--muted);
    font-weight: 400;
  }
  @media (max-width: 640px) {
    .wtable thead {
      display: none;
    }
    .wtable tr {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--grid);
    }
    .wtable td {
      border: 0;
      padding: 1px 0;
      text-align: left;
      white-space: normal;
    }
    .wtable td:first-child,
    .wtable td:last-child {
      grid-column: 1 / -1;
    }
    .wtable td[data-label]::before {
      content: attr(data-label) ': ';
      color: var(--muted);
      font-size: 12px;
    }
    .wtable td[data-label] .meta {
      display: inline;
      margin-left: 6px;
    }
  }
</style>
