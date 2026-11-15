<script lang="ts">
  // One suspect of the water budget: its yearly series, the Sen line, the change per decade with its
  // interval and p-value, the certainty label, and its witnesses on the same axis.
  // The row opens and closes like a file: closed, it keeps the name, the change and its certainty.
  // Code written with AI assistance (Claude) for team RAACK.
  import { tOr, t } from '../i18n';
  import { ui } from '../state.svelte';
  import type { CaseAnalysis, LineResult, SuspectResult } from './case';
  import { LINE_COLORS } from './catalog';
  import CertaintyChip from './CertaintyChip.svelte';
  import { ciW, lineName, num, pctW, pW, rateNum, rateW, signed, valueW } from './format';
  import type { WaterRegion } from './types';
  import YearChart, { type ChartLine } from './YearChart.svelte';

  let {
    s,
    c,
    region,
    open: openByDefault = true
  }: {
    s: SuspectResult;
    c: CaseAnalysis;
    region: WaterRegion;
    /** A suspect whose alibi holds waits in one line; the reader opens its file with a click. */
    open?: boolean;
  } = $props();

  // What the reader chose wins over the default, and stays while the case is recomputed.
  let picked = $state<boolean | null>(null);
  const open = $derived(picked ?? openByDefault);

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

<article class="suspect" class:closed={!open} id="suspect-{s.id}">
  <!-- The line that is always there. The button covers it all: one click opens or closes the file. -->
  <div class="bar">
    <div class="who">
      <span class="tag"><span class="dot {s.budget}"></span>{t(`w.budget.${s.budget}`)}</span>
      <h3><button class="toggle" aria-expanded={open} aria-controls="suspect-{s.id}-file" onclick={() => (picked = !open)}>{t(`w.sus.${s.id}.name`)}</button></h3>
    </div>
    {#if !open && main}
      <span class="glance" class:quiet={main.trend.label !== 'confirmed'}>{main.trend.ok ? rateW(main.def, main.perDecade) : '—'}</span>
      <span class="glance-cert"><CertaintyChip label={main.trend.label} dir={main.trend.dir} compact /></span>
    {/if}
    <span class="status {s.status}">{t(s.status === 'flagged' && s.budget === 'store' ? 'w.status.losing' : `w.status.${s.status}`)}</span>
    <span class="sign" class:minus={open} aria-hidden="true"></span>
  </div>

  {#if open}
    <div class="file" id="suspect-{s.id}-file">
      <div class="brief">
        <p class="def">{t(`w.sus.${s.id}.def`)}</p>

        {#if main}
          <div class="headline">
            <div class="big" class:quiet={main.trend.label !== 'confirmed'}>
              <span class="num">{main.trend.ok ? rateNum(main.def, main.perDecade) : '—'}</span>
              <span class="unit">{t(`w.tunit.${main.def.unit}`)}<br />{t('unit.perDecade')}</span>
            </div>
            <CertaintyChip label={main.trend.label} dir={main.trend.dir} />
          </div>
        {/if}

        <p class="finding">{findingText}</p>

        {#if main}
          <dl class="facts">
            {#if main.pct !== null}
              <div><dt>{t('w.fact.pct')}</dt><dd>{pctW(main.pct, 1)}</dd></div>
            {/if}
            <div><dt>{t('w.fact.ci')}</dt><dd>{ciW(main.def, main.ci)}</dd></div>
            <div><dt>{t('w.fact.p')}</dt><dd>{pW(main.trend.p)}</dd></div>
            <div><dt>{t('w.fact.source')}</dt><dd>{lineName(main)} · {periodOf(main)}<span class="kind">{t(`w.kind.${main.def.kind}`)} · {main.def.product}</span></dd></div>
          </dl>
        {/if}
      </div>

      <div class="proof">
        {#if main && main.trend.ok}
          <!-- The legend of the chart and the lines that can join it, in one row. -->
          <div class="series">
            <span class="s-item"><span class="key" style="background: {LINE_COLORS[0]}"></span>{lineName(main)}</span>
            {#if monthly}
              <span class="s-item"><span class="key thin"></span>{t('w.chart.monthly')}</span>
            {/if}
            <span class="s-item"><span class="key ink"></span>{t('w.chart.sen')}</span>
            {#if others.length}
              <span class="s-group" role="group" aria-label={t('w.card.overlayAria')}>
                <span class="s-label">{t('w.card.overlay')}</span>
                {#each others as l (l.id)}
                  {@const k = shown.indexOf(l.id)}
                  <button class="s-toggle" aria-pressed={k >= 0} onclick={() => toggle(l.id)}>
                    <span class="key" style={k >= 0 ? `background: ${LINE_COLORS[k + 1]}` : ''}></span>{lineName(l)}
                  </button>
                {/each}
              </span>
            {/if}
          </div>
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
            legend={false}
          />
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
          <div class="extra first">
            {#if c.aquifers}
              <h4>{t('w.card.official')}</h4>
              <p>{t('w.card.officialText', { neg: c.aquifers.negative, total: c.aquifers.total, deficit: num(Math.abs(c.aquifers.deficit), 1) })}</p>
            {:else}
              <h4>{t('w.card.noOfficial')}</h4>
              <p>{t('w.card.noOfficialText')}</p>
            {/if}
            <a class="textlink" href="#w-evidence">{t('w.card.seeEvidence')} <span aria-hidden="true">↓</span></a>
          </div>
        {/if}

        {#if s.lines.length > 1}
          <details class="lines" open={ui.concern === 'drought' && s.id === 'rain'}>
            <summary class="more">{t('w.card.witnesses', { n: s.lines.length - 1 })}</summary>
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

        {#if main && main.trend.ok}
          {#if s.id === 'rain' && c.verdict.droughtYears.length}
            <p class="small foot">{t('w.card.droughtMarks', { years: c.verdict.droughtYears.join(', ') })}</p>
          {/if}
          {#if missingYears.length}
            <p class="small foot">{t('w.card.graceGaps', { years: missingYears.join(', ') })}</p>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</article>

<style>
  /* One suspect, one row of the file. A thin line between rows; no card. The bar is always there;
     under it, what it is and what was found on the left, the proof on the right. */
  .suspect {
    border-top: 1px solid var(--border);
    min-width: 0;
  }
  .suspect:last-child {
    border-bottom: 1px solid var(--border);
  }
  .bar {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: end;
    gap: 6px 28px;
    padding: 22px 0;
  }
  .closed .bar {
    grid-template-columns: minmax(0, 9fr) minmax(0, 6fr) minmax(0, 5fr) minmax(0, 4fr) auto;
  }
  .who {
    display: grid;
    gap: 8px;
    justify-items: start;
  }
  h3 {
    font-size: clamp(26px, 2.9vw, 36px);
    letter-spacing: -0.03em;
    line-height: 1.05;
  }
  .closed h3 {
    font-size: clamp(22px, 2.3vw, 28px);
  }
  /* The name is the button; its hit area is the whole bar. */
  .toggle {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    letter-spacing: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .toggle::after {
    content: '';
    position: absolute;
    inset: 0;
  }
  .toggle:focus-visible {
    outline: none;
  }
  .bar:has(.toggle:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 6px;
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
  .glance {
    font-size: clamp(18px, 1.8vw, 22px);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.25;
    font-variant-numeric: tabular-nums;
    padding-bottom: 2px;
  }
  .glance.quiet {
    color: var(--muted);
  }
  .glance-cert {
    padding-bottom: 5px;
  }
  /* The state of the suspect: a word. Heavier and in ink when the case points at it. */
  .status {
    font-size: var(--fs-small);
    font-weight: 500;
    color: var(--ink-2);
    white-space: nowrap;
    padding-bottom: 5px;
  }
  .status.flagged {
    color: var(--ink);
    font-weight: 600;
  }
  .status.flagged::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 7px;
    background: currentColor;
    transform: translateY(-1px);
  }
  /* Plus when the file is closed, minus when it is open: the same sign as the blocks of the file. */
  .sign {
    width: 14px;
    height: 14px;
    margin-bottom: 9px;
    background:
      linear-gradient(var(--ink), var(--ink)) center / 100% 1.5px no-repeat,
      linear-gradient(var(--ink), var(--ink)) center / 1.5px 100% no-repeat;
    opacity: 0.55;
  }
  .sign.minus {
    background: linear-gradient(var(--ink), var(--ink)) center / 100% 1.5px no-repeat;
  }
  .bar:hover .sign {
    opacity: 1;
  }

  .file {
    display: grid;
    grid-template-columns: minmax(0, 9fr) minmax(0, 13fr);
    gap: 28px 64px;
    align-items: start;
    padding: 4px 0 clamp(32px, 4vw, 52px);
  }
  .brief,
  .proof {
    display: grid;
    gap: 14px;
    align-content: start;
    min-width: 0;
  }
  .def {
    color: var(--ink-2);
    max-width: 52ch;
  }
  .headline {
    display: grid;
    gap: 10px;
    justify-items: start;
    margin-top: 10px;
  }
  .big {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }
  .num {
    font-size: var(--fs-figure);
    font-weight: 500;
    letter-spacing: -0.045em;
    line-height: 0.92;
    font-variant-numeric: tabular-nums;
  }
  /* A change that is not confirmed is written in grey: the eye goes first to what the tests back. */
  .big.quiet .num {
    color: var(--muted);
  }
  .unit {
    font-size: var(--fs-small);
    color: var(--ink-2);
    line-height: 1.25;
    padding-bottom: 2px;
  }
  .finding {
    font-size: var(--fs-body);
    line-height: 1.5;
    max-width: 54ch;
  }
  .facts {
    margin: 6px 0 0;
    display: grid;
    font-size: var(--fs-small);
  }
  .facts div {
    display: grid;
    grid-template-columns: minmax(0, 11fr) minmax(0, 14fr);
    gap: 16px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
  }
  .facts dt {
    color: var(--ink-2);
  }
  .facts dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
  .kind {
    display: block;
    color: var(--ink-2);
  }

  /* ---- the legend that is also the switch */
  .series {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 18px;
    font-size: var(--fs-micro);
    line-height: 1.4;
    color: var(--ink-2);
  }
  .s-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--ink);
  }
  .s-group {
    display: contents;
  }
  .s-label {
    flex-basis: 100%;
    margin-top: 2px;
  }
  .key {
    flex: none;
    width: 16px;
    height: 2px;
    border-radius: 2px;
    background: var(--axis);
  }
  .key.thin {
    height: 1.5px;
    background: var(--deemph);
  }
  .key.ink {
    height: 3px;
    background: var(--ink);
  }
  .s-toggle {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 3px 0;
    border: 0;
    background: none;
    cursor: pointer;
    font-size: var(--fs-micro);
    color: var(--ink-2);
  }
  .s-toggle:hover {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .s-toggle[aria-pressed='true'] {
    color: var(--ink);
  }
  .s-toggle[aria-pressed='false'] .key {
    height: 6px;
    width: 6px;
    margin: 0 5px;
    border-radius: 50%;
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--muted);
  }
  @media (pointer: coarse) {
    .s-toggle {
      padding: 9px 0;
    }
  }

  .extra {
    border-top: 1px solid var(--border);
    padding-top: 14px;
    margin-top: 6px;
    display: grid;
    gap: 8px;
    justify-items: start;
  }
  .extra.first {
    border-top: 0;
    padding-top: 0;
    margin-top: 0;
  }
  .extra p {
    font-size: var(--fs-small);
    line-height: 1.5;
    color: var(--ink-2);
    max-width: 68ch;
  }
  details.lines {
    font-size: var(--fs-small);
  }
  .foot {
    max-width: 70ch;
  }
  .wtable {
    margin-top: 14px;
  }
  .wtable td {
    vertical-align: top;
    white-space: nowrap;
  }
  .wtable td:first-child {
    white-space: normal;
    min-width: 170px;
  }
  .wtable td strong {
    font-weight: 500;
  }
  .meta {
    display: block;
    font-size: var(--fs-micro);
    color: var(--ink-2);
    font-weight: 400;
  }
  @media (max-width: 900px) {
    .file {
      grid-template-columns: minmax(0, 1fr);
    }
    /* Closed, on a narrow screen: the name and the sign above, the change and its labels below. */
    .closed .bar {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
    .closed .who {
      grid-column: 1;
    }
    .closed .sign {
      grid-column: 2;
      grid-row: 1;
      margin-bottom: 0;
    }
    .closed .glance,
    .closed .glance-cert,
    .closed .status {
      grid-column: 1 / -1;
      padding-bottom: 0;
    }
  }
  @media (max-width: 640px) {
    .bar {
      gap: 6px 16px;
    }
    .wtable thead {
      display: none;
    }
    .wtable tr {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
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
      font-size: var(--fs-micro);
    }
    .wtable td[data-label] .meta {
      display: inline;
      margin-left: 6px;
    }
  }
</style>
