<script lang="ts">
  // El caso guiado: México → Monterrey → Lluvia.
  // Dos barras (el total anual) → dos calendarios (los días) → ¿es una tendencia?
  // La idea de mirar dentro del año es de Fran (equipo RAACK).
  import { fade, slide } from 'svelte/transition';
  import { rainInside, twinYears, type IndicatorTrend } from '../analysis';
  import { RAIN_FMT, VAR_ORDER, fmt, fmtSigned, refDayLabel, type VarId } from '../catalog';
  import { pText } from '../format';
  import IndicatorChart from '../charts/IndicatorChart.svelte';
  import RainCalendar from '../charts/RainCalendar.svelte';
  import SiteMap from '../charts/SiteMap.svelte';
  import { t } from '../i18n';
  import { ui, selectVariable } from '../state.svelte';
  import { rainIndicator, refDayOfYear, type RainIndicatorId, type RainYear } from '../stats/rain';
  import type { CaseData } from '../types';
  import VerdictChip from '../ui/VerdictChip.svelte';

  let { data }: { data: CaseData } = $props();

  let stage = $state(1);
  let clue = $state<RainIndicatorId>('top5Share');
  let twinIdx = $state(-1);

  const inside = $derived(rainInside(data, 'imerg', 2002, 2024));
  const years = $derived(inside.years.filter((y) => y.complete));
  const A = $derived(years.find((y) => y.year === ui.yearA) ?? years[0]);
  const B = $derived(years.find((y) => y.year === ui.yearB) ?? years[years.length - 1]);
  const twins = $derived(twinYears(inside.years, 0.02));
  const maxTotal = $derived(Math.max(A.total ?? 0, B.total ?? 0, 1));
  const gapMm = $derived(Math.abs((A.total ?? 0) - (B.total ?? 0)));
  const gapPct = $derived((gapMm / (((A.total ?? 0) + (B.total ?? 0)) / 2)) * 100);
  const alike = $derived(gapPct <= 5);
  const hi = $derived((A.top5Share ?? 0) >= (B.top5Share ?? 0) ? A : B);
  const lo = $derived(hi === A ? B : A);

  const ind = $derived(inside.indicators.find((i) => i.id === clue)!);
  const lineup = $derived([...inside.indicators].sort((p, q) => Math.abs(q.trend.mk.z) - Math.abs(p.trend.mk.z)));

  function nextTwins() {
    if (!twins.length) return;
    let k = (twinIdx + 1) % twins.length;
    if (twins[k].a === ui.yearA && twins[k].b === ui.yearB) k = (k + 1) % twins.length;
    twinIdx = k;
    ui.yearA = twins[k].a;
    ui.yearB = twins[k].b;
  }
  const currentTwin = $derived(twins.find((p) => (p.a === ui.yearA && p.b === ui.yearB) || (p.a === ui.yearB && p.b === ui.yearA)) ?? null);

  function fmtClue(id: RainIndicatorId, v: number | null): string {
    if (v === null) return '—';
    const f = RAIN_FMT[id];
    if (f.unit === 'date') return refDayLabel(v, ui.lang);
    if (f.unit === 'pct') return `${fmt(v, f.decimals, ui.lang)} %`;
    return `${fmt(v, f.decimals, ui.lang)} ${t(`unit.${f.unit}`)}`;
  }
  function fmtRate(i: IndicatorTrend): string {
    if (i.perDecade === null) return '—';
    const f = RAIN_FMT[i.id];
    return `${fmtSigned(i.perDecade, f.trendDecimals, ui.lang)} ${t(`unit.${f.trendUnit}`)} ${t('unit.perDecade')}`;
  }
  function fmtCi(i: IndicatorTrend): string {
    if (!i.ci) return '—';
    const f = RAIN_FMT[i.id];
    return t('fmt.range', { lo: fmtSigned(i.ci[0], f.trendDecimals, ui.lang), hi: fmtSigned(i.ci[1], f.trendDecimals, ui.lang) });
  }
  const val = (y: RainYear, id: RainIndicatorId) => rainIndicator(y, id);
  const compareRows: RainIndicatorId[] = ['wetDays', 'intensity', 'max1Day', 'maxDrySpell', 'day50', 'spread2080'];

  function topDays(y: RainYear): string {
    return y.top5Days
      .map((d) => `${refDayLabel(refDayOfYear(y.year, d), ui.lang)} (${fmt(y.daily[d] ?? 0, 0, ui.lang)} mm)`)
      .join(' · ');
  }

  function pickClue(e: Event) {
    const id = (e.currentTarget as HTMLSelectElement).value as VarId;
    if (id !== 'rain') {
      selectVariable(id);
      (e.currentTarget as HTMLSelectElement).value = 'rain';
      document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  function go(n: number, id: string) {
    stage = Math.max(stage, n);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const yearsToDetect = $derived(ind.trend.yearsToDetect);
</script>

<section id="case" class="opening">
  <div class="top">
    <div class="intro">
      <p class="kicker">{t('oc.kicker')}</p>
      <h2>{t('oc.title')}</h2>
      <p class="lead">{t('oc.lead')}</p>

      <div class="selectors" role="group" aria-label={t('oc.selectorsAria')}>
        <label>
          <span>{t('oc.country')}</span>
          <select aria-label={t('oc.country')}><option>{t('oc.mexico')}</option></select>
        </label>
        <span class="sep" aria-hidden="true">›</span>
        <label>
          <span>{t('oc.city')}</span>
          <select aria-label={t('oc.city')}><option>Monterrey</option></select>
        </label>
        <span class="sep" aria-hidden="true">›</span>
        <label>
          <span>{t('oc.clue')}</span>
          <select aria-label={t('oc.clue')} onchange={pickClue}>
            {#each VAR_ORDER as id (id)}
              <option value={id} selected={id === 'rain'}>{t(`var.${id}.name`)}</option>
            {/each}
          </select>
        </label>
      </div>
      <p class="source small">
        <span class="tag"><span class="dot" style="background: var(--series-1)"></span>{t('kind.mission')}</span>
        {t('oc.source')}
      </p>
    </div>
    <div class="mapbox">
      <SiteMap {data} selected="cell" cells={['cell']} showStation={true} showPins={false} />
    </div>
  </div>

  <!-- 1 · El total anual -->
  <div class="beat" id="beat-1">
    <div class="beat-head">
      <span class="beat-n">1</span>
      <h3>{t('oc.b1.title')}</h3>
    </div>
    <div class="pickers">
      <label>
        {t('oc.yearA')}
        <select bind:value={ui.yearA}>
          {#each years as y (y.year)}<option value={y.year}>{y.year}</option>{/each}
        </select>
      </label>
      <label>
        {t('oc.yearB')}
        <select bind:value={ui.yearB}>
          {#each years as y (y.year)}<option value={y.year}>{y.year}</option>{/each}
        </select>
      </label>
      <button class="chipbtn" onclick={nextTwins} title={t('oc.twinsHelp')}>
        <span aria-hidden="true">⟳</span>
        {t('oc.twins')}
      </button>
    </div>

    <div class="bars" role="img" aria-label={t('oc.b1.aria', { a: A.year, b: B.year, va: fmt(A.total, 0, ui.lang), vb: fmt(B.total, 0, ui.lang) })}>
      {#each [A, B] as y (y.year)}
        <div class="row">
          <div class="yr">{y.year}</div>
          <div class="track"><div class="bar" style="width: {((y.total ?? 0) / maxTotal) * 100}%"></div></div>
          <div class="val"><strong>{fmt(y.total, 0, ui.lang)}</strong> mm</div>
        </div>
      {/each}
    </div>
    <p class="caption">
      {#if alike}
        {t('oc.b1.alike', { gap: fmt(gapMm, 0, ui.lang), pct: fmt(gapPct, 1, ui.lang) })}
      {:else}
        {t('oc.b1.differ', { gap: fmt(gapMm, 0, ui.lang), pct: fmt(gapPct, 0, ui.lang) })}
      {/if}
      {#if currentTwin}
        <span class="muted">{t('oc.b1.twinNote', { clue: t(`clue.${currentTwin.clue}.name`).toLowerCase() })}</span>
      {/if}
    </p>
    {#if stage === 1}
      <button class="btn primary" onclick={() => go(2, 'beat-2')}>{t('oc.seeDays')} <span aria-hidden="true">→</span></button>
    {/if}
  </div>

  <!-- 2 · Los días -->
  {#if stage >= 2}
    <div class="beat" id="beat-2" transition:slide={{ duration: 420 }}>
      <div class="beat-head">
        <span class="beat-n">2</span>
        <h3>{t('oc.b2.title')}</h3>
      </div>
      <div class="cals">
        {#each [A, B] as y (y.year)}
          <div class="cal" in:fade={{ duration: 500, delay: 150 }}>
            <div class="cal-head">
              <span class="cal-year">{y.year}</span>
              <span class="cal-total">{fmt(y.total, 0, ui.lang)} mm</span>
            </div>
            <p class="share">
              <strong>{fmt(y.top5Share, 1, ui.lang)}&nbsp;%</strong>
              <span>{t('oc.b2.share')}</span>
            </p>
            <RainCalendar year={y} />
            <p class="small days">{t('oc.b2.fiveDays')} {topDays(y)}</p>
          </div>
        {/each}
      </div>
      <div class="legend cal-legend" aria-hidden="true">
        <span class="item"><span class="key-box" style="background: var(--seq-0)"></span>&lt; 1 mm</span>
        <span class="item"><span class="key-box" style="background: var(--seq-1)"></span>1–5</span>
        <span class="item"><span class="key-box" style="background: var(--seq-2)"></span>5–20</span>
        <span class="item"><span class="key-box" style="background: var(--seq-3)"></span>20–50</span>
        <span class="item"><span class="key-box" style="background: var(--seq-4)"></span>≥ 50 mm</span>
        <span class="item"><span class="key-box ring"></span>{t('oc.b2.ringLegend')}</span>
      </div>

      <p class="caption">
        {t('oc.b2.caption', {
          hiYear: hi.year,
          hiShare: fmt(hi.top5Share, 1, ui.lang),
          loYear: lo.year,
          loShare: fmt(lo.top5Share, 1, ui.lang)
        })}
        {#if (hi.top5Share ?? 0) > 50}{t('oc.b2.half', { year: hi.year })}{/if}
      </p>

      <div class="hid">
        <h4>{t('oc.b2.alsoHid')}</h4>
        <div class="scroll-x">
          <table class="data">
            <thead>
              <tr><th>{t('oc.b2.clueCol')}</th><th>{A.year}</th><th>{B.year}</th></tr>
            </thead>
            <tbody>
              <tr class="same">
                <td>{t('clue.total.name')}</td>
                <td>{fmtClue('total', val(A, 'total'))}</td>
                <td>{fmtClue('total', val(B, 'total'))}</td>
              </tr>
              <tr>
                <td>{t('clue.top5Share.name')}</td>
                <td>{fmtClue('top5Share', val(A, 'top5Share'))}</td>
                <td>{fmtClue('top5Share', val(B, 'top5Share'))}</td>
              </tr>
              {#each compareRows as id (id)}
                <tr>
                  <td>{t(`clue.${id}.name`)}</td>
                  <td>{fmtClue(id, val(A, id))}</td>
                  <td>{fmtClue(id, val(B, id))}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      {#if stage === 2}
        <button class="btn primary" onclick={() => go(3, 'beat-3')}>{t('oc.isTrend')} <span aria-hidden="true">→</span></button>
      {/if}
    </div>
  {/if}

  <!-- 3 · ¿Es una tendencia? -->
  {#if stage >= 3}
    <div class="beat" id="beat-3" transition:slide={{ duration: 420 }}>
      <div class="beat-head">
        <span class="beat-n">3</span>
        <h3>{t('oc.b3.title')}</h3>
      </div>
      <p class="small">{t('oc.b3.lead', { n: years.length, y0: years[0].year, y1: years[years.length - 1].year })}</p>

      <div class="clue-pick">
        <label for="clue-select" class="small">{t('oc.b3.pick')}</label>
        <select id="clue-select" bind:value={clue}>
          {#each inside.indicators as i (i.id)}
            <option value={i.id}>{t(`clue.${i.id}.name`)}</option>
          {/each}
        </select>
        <span class="small">{t(`clue.${clue}.def`)}</span>
      </div>

      <IndicatorChart {ind} highlight={[A.year, B.year]} format={(v) => fmtClue(clue, v)} title={t(`clue.${clue}.name`)} />

      <div class="verdict">
        <VerdictChip verdict={ind.verdict} />
        <p class="plain">
          {t(`oc.v.${ind.verdict.level}`, {
            n: ind.trend.n,
            y0: years[0].year,
            y1: years[years.length - 1].year,
            clue: t(`clue.${clue}.phrase`),
            rate: fmtRate(ind),
            dir: t(ind.verdict.direction > 0 ? 'dir.rising' : 'dir.falling')
          })}
        </p>
      </div>

      <details class="evidence">
        <summary>{t('oc.evidence')}</summary>
        <div class="ev-body">
          <p>
            <strong>{t('ev.rate')}</strong>
            {fmtRate(ind)} · {t('ev.interval')} {fmtCi(ind)}.
          </p>
          <ul class="jury-list">
            <li>
              <span class="vote" class:yes={ind.trend.votes.t}>{ind.trend.votes.t ? t('jury.yes') : t('jury.no')}</span>
              <span><strong>{t('jury.t.name')}</strong> — {pText(ind.trend.ols.p)}</span>
            </li>
            <li>
              <span class="vote" class:yes={ind.trend.votes.mk}>{ind.trend.votes.mk ? t('jury.yes') : t('jury.no')}</span>
              <span><strong>{t('jury.mk.name')}</strong> — {pText(ind.trend.mk.p)}</span>
            </li>
            {#if ind.trend.boot}
              <li>
                <span class="vote" class:yes={ind.trend.votes.boot}>{ind.trend.votes.boot ? t('jury.yes') : t('jury.no')}</span>
                <span
                  ><strong>{t('jury.boot.name')}</strong> — {t('fmt.range', {
                    lo: fmtSigned(ind.trend.boot.ci[0] * 10, RAIN_FMT[clue].trendDecimals, ui.lang),
                    hi: fmtSigned(ind.trend.boot.ci[1] * 10, RAIN_FMT[clue].trendDecimals, ui.lang)
                  })}</span
                >
              </li>
            {/if}
          </ul>
          {#if ind.verdict.level !== 'strong' && yearsToDetect !== null}
            <p>
              <strong>{t('ev.howLong')}</strong>
              {yearsToDetect > 300 ? t('ev.yearsMany') : t('ev.years', { n: fmt(yearsToDetect, 0, ui.lang), have: ind.trend.n })}
            </p>
          {/if}
          <p class="small">{t('oc.b3.method')}</p>
        </div>
      </details>

      <div class="lineup">
        <h4>{t('oc.lineup.title')}</h4>
        <p class="small">{t('oc.lineup.lead')}</p>
        <div class="scroll-x">
          <table class="data lineup-table">
            <thead>
              <tr>
                <th>{t('oc.b2.clueCol')}</th>
                <th>{t('oc.lineup.rate')}</th>
                <th>{t('oc.lineup.interval')}</th>
                <th>{t('oc.lineup.votes')}</th>
                <th>{t('oc.lineup.verdict')}</th>
              </tr>
            </thead>
            <tbody>
              {#each lineup as i (i.id)}
                <tr class:active={i.id === clue}>
                  <td><button class="linkish" onclick={() => (clue = i.id)}>{t(`clue.${i.id}.name`)}</button></td>
                  <td data-label={t('oc.lineup.rate')}>{fmtRate(i)}</td>
                  <td data-label={t('oc.lineup.interval')}>{fmtCi(i)}</td>
                  <td data-label={t('oc.lineup.votes')}>{i.trend.nVotes} / {i.trend.nJurors}</td>
                  <td><VerdictChip verdict={i.verdict} compact /></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="small">{t('oc.lineup.note')}</p>
      </div>

      <div class="next">
        <p>{t('oc.next')}</p>
        <a class="btn" href="#lab">{t('oc.openLab')} <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  {/if}
</section>

<style>
  /* The opening case sits on the page itself: three beats, each under a thin line. */
  .opening {
    display: grid;
    /* minmax(0, 1fr): a wide table never widens the section; it scrolls inside .scroll-x */
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    margin-top: var(--gap-block);
    padding-top: 18px;
    border-top: 1px solid var(--border-strong);
  }
  .top {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: var(--gap-block) 56px;
    align-items: start;
  }
  .intro {
    display: grid;
    gap: 14px;
  }
  .intro h2 {
    font-size: var(--fs-h2);
    line-height: 1.03;
    letter-spacing: -0.034em;
    margin-top: clamp(8px, 1.6vw, 20px);
  }
  .selectors {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px 10px;
    margin-top: 10px;
  }
  .selectors label {
    display: grid;
    gap: 5px;
    font-size: var(--fs-micro);
    color: var(--ink-2);
  }
  .sep {
    font-size: 20px;
    color: var(--muted);
    padding-bottom: 5px;
  }
  .source {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }
  .beat {
    border-top: 1px solid var(--border);
    margin-top: var(--gap-block);
    padding-top: 22px;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    justify-items: start;
  }
  .beat > :global(*) {
    width: 100%;
  }
  .beat > .btn {
    width: auto;
  }
  .beat-head {
    display: flex;
    align-items: baseline;
    gap: 14px;
  }
  /* The number of the beat: an index in grey, not a badge. */
  .beat-n {
    font-size: clamp(22px, 2.3vw, 28px);
    font-weight: 500;
    letter-spacing: -0.03em;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .beat-head h3 {
    font-size: clamp(22px, 2.3vw, 28px);
    letter-spacing: -0.028em;
  }
  .pickers {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 18px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pickers label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .bars {
    display: grid;
    gap: 14px;
    max-width: 780px;
  }
  .row {
    display: grid;
    grid-template-columns: 56px 1fr 116px;
    align-items: center;
    gap: 14px;
  }
  .yr {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .track {
    height: 14px;
    background: color-mix(in srgb, var(--ink) 7%, transparent);
    border-radius: 0 var(--r-mark) var(--r-mark) 0;
  }
  .bar {
    height: 14px;
    background: var(--series-1);
    border-radius: 0 var(--r-mark) var(--r-mark) 0;
    transition: width 0.5s ease;
  }
  .val {
    font-size: var(--fs-small);
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .val strong {
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--ink);
  }
  .caption {
    font-size: var(--fs-lead);
    line-height: 1.42;
    letter-spacing: -0.008em;
    max-width: 64ch;
  }
  .caption .muted {
    display: block;
    font-size: var(--fs-small);
    letter-spacing: 0;
    color: var(--ink-2);
    margin-top: 6px;
  }
  .cals {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gap-block) 56px;
  }
  .cal {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .cal-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .cal-year {
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.025em;
    font-variant-numeric: tabular-nums;
  }
  .cal-total {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .share {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }
  .share strong {
    font-size: var(--fs-figure);
    font-weight: 500;
    line-height: 0.92;
    letter-spacing: -0.045em;
    font-variant-numeric: tabular-nums;
  }
  .share span {
    color: var(--ink-2);
    max-width: 24ch;
    font-size: var(--fs-small);
    line-height: 1.3;
    padding-bottom: 2px;
  }
  .cal-legend {
    margin: 0;
  }
  .key-box.ring {
    background: transparent;
    outline: 1.5px solid var(--ink);
    outline-offset: -1px;
  }
  .hid h4,
  .lineup h4 {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-bottom: 12px;
  }
  .lineup .small {
    margin-bottom: 14px;
  }
  .lineup .small:last-child {
    margin: 14px 0 0;
  }
  .scroll-x {
    overflow-x: auto;
  }
  .hid table {
    max-width: 680px;
  }
  tr.same td {
    color: var(--ink-2);
  }
  .clue-pick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
  }
  .verdict {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  .plain {
    font-size: var(--fs-lead);
    line-height: 1.42;
    letter-spacing: -0.008em;
    max-width: 60ch;
  }
  /* The evidence behind the sentence opens under it: two lines, no box. */
  details.evidence {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 14px 0;
  }
  details.evidence summary {
    width: fit-content;
    font-size: var(--fs-small);
    font-weight: 500;
    color: var(--ink-2);
    text-decoration: underline;
    text-decoration-color: var(--border-strong);
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }
  details.evidence summary:hover {
    color: var(--ink);
    text-decoration-color: currentColor;
  }
  .ev-body {
    display: grid;
    gap: 12px;
    margin-top: 16px;
    font-size: var(--fs-small);
    max-width: 84ch;
  }
  .jury-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .jury-list li {
    display: grid;
    grid-template-columns: 5.5em minmax(0, 1fr);
    gap: 12px;
    align-items: baseline;
  }
  /* The vote of a test: a word, in ink when it sees the change. */
  .vote {
    color: var(--ink-2);
    white-space: nowrap;
  }
  .vote.yes {
    color: var(--ink);
    font-weight: 600;
  }
  .lineup-table tr.active td {
    background: color-mix(in srgb, var(--ink) 6%, transparent);
  }
  .lineup-table tr.active td:first-child {
    box-shadow: inset 2px 0 0 var(--ink);
    padding-left: 12px;
  }
  @media (max-width: 620px) {
    .lineup-table thead {
      display: none;
    }
    .lineup-table tr {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px 12px;
      padding: 12px 8px;
      border-bottom: 1px solid var(--border);
    }
    .lineup-table tr.active {
      background: color-mix(in srgb, var(--ink) 6%, transparent);
    }
    .lineup-table tr.active td {
      background: none;
    }
    .lineup-table tr.active td:first-child {
      box-shadow: none;
      padding-left: 0;
    }
    .lineup-table td {
      display: block;
      border: 0;
      padding: 0;
      text-align: left;
    }
    .lineup-table td:first-child,
    .lineup-table td:last-child {
      grid-column: 1 / -1;
    }
    .lineup-table td[data-label]::before {
      content: attr(data-label);
      display: block;
      font-size: var(--fs-micro);
      color: var(--muted);
    }
  }
  .linkish {
    border: 0;
    background: none;
    padding: 0;
    color: var(--ink);
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    text-decoration: underline;
    text-decoration-color: var(--border-strong);
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }
  .linkish:hover {
    text-decoration-color: currentColor;
  }
  /* The way on to the full investigation: a quiet row under a line. */
  .next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }
  .next p {
    flex: 1 1 320px;
    color: var(--ink-2);
  }
  @media (max-width: 820px) {
    .top,
    .cals {
      grid-template-columns: minmax(0, 1fr);
    }
    .row {
      grid-template-columns: 48px 1fr 96px;
    }
  }
</style>
