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

<section id="case" class="opening card">
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
      <button class="btn small-btn" onclick={nextTwins} title={t('oc.twinsHelp')}>
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
        <span class="small muted">{t(`clue.${clue}.def`)}</span>
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
          <p class="small muted">{t('oc.b3.method')}</p>
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
        <p class="small muted">{t('oc.lineup.note')}</p>
      </div>

      <div class="next">
        <p>{t('oc.next')}</p>
        <a class="btn" href="#lab">{t('oc.openLab')} <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  {/if}
</section>

<style>
  .opening {
    padding: clamp(18px, 3vw, 32px);
    display: grid;
    /* minmax(0, 1fr): una tabla ancha no ensancha la tarjeta; se desplaza dentro de .scroll-x */
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  .top {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 28px;
    align-items: start;
  }
  .intro {
    display: grid;
    gap: 12px;
  }
  .intro h2 {
    font-size: clamp(26px, 3.6vw, 38px);
  }
  .selectors {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px 10px;
    margin-top: 6px;
  }
  .selectors label {
    display: grid;
    gap: 3px;
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .sep {
    font-size: 22px;
    color: var(--muted);
    padding-bottom: 6px;
  }
  select {
    font: inherit;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
  }
  .source {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .beat {
    border-top: 1px solid var(--grid);
    margin-top: 22px;
    padding-top: 24px;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
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
    align-items: center;
    gap: 12px;
  }
  .beat-n {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--page);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 14px;
  }
  .beat-head h3 {
    font-size: 21px;
  }
  .pickers {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .pickers label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  .pickers select {
    padding: 6px 10px;
  }
  .bars {
    display: grid;
    gap: 14px;
    max-width: 760px;
  }
  .row {
    display: grid;
    grid-template-columns: 56px 1fr 110px;
    align-items: center;
    gap: 12px;
  }
  .yr {
    font-weight: 700;
    font-size: 17px;
    font-variant-numeric: tabular-nums;
  }
  .track {
    height: 24px;
  }
  .bar {
    height: 24px;
    background: var(--series-1);
    border-radius: 0 4px 4px 0;
    transition: width 0.5s ease;
  }
  .val {
    font-size: 15px;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .val strong {
    font-size: 22px;
    color: var(--ink);
  }
  .caption {
    font-size: 17px;
    max-width: 70ch;
  }
  .caption .muted {
    display: block;
    font-size: 14px;
    margin-top: 2px;
  }
  .cals {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px;
  }
  .cal {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .cal-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .cal-year {
    font-size: 24px;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }
  .cal-total {
    color: var(--ink-2);
  }
  .share {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .share strong {
    font-size: clamp(34px, 5vw, 50px);
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .share span {
    color: var(--ink-2);
    max-width: 24ch;
    font-size: 14.5px;
    line-height: 1.3;
  }
  .days {
    line-height: 1.45;
  }
  .cal-legend {
    margin: 0;
  }
  .key-box.ring {
    background: transparent;
    outline: 2px solid var(--ink);
    outline-offset: -1px;
  }
  .hid h4,
  .lineup h4 {
    font-size: 16px;
    margin-bottom: 8px;
  }
  .scroll-x {
    overflow-x: auto;
  }
  .hid table {
    max-width: 640px;
  }
  tr.same td {
    color: var(--ink-2);
  }
  .clue-pick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .clue-pick select {
    padding: 6px 10px;
  }
  .verdict {
    display: grid;
    gap: 10px;
    justify-items: start;
  }
  .plain {
    font-size: clamp(18px, 2.2vw, 22px);
    line-height: 1.4;
    max-width: 60ch;
    font-weight: 500;
  }
  details.evidence {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
    background: var(--surface-2);
  }
  details.evidence summary {
    cursor: pointer;
    font-weight: 650;
  }
  .ev-body {
    display: grid;
    gap: 10px;
    margin-top: 12px;
    font-size: 15px;
  }
  .jury-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .jury-list li {
    display: flex;
    gap: 10px;
    align-items: baseline;
    flex-wrap: wrap;
  }
  .vote {
    font-size: 12px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--border-strong);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .vote.yes {
    background: var(--ink);
    color: var(--page);
    border-color: var(--ink);
  }
  .lineup-table tr.active td {
    background: var(--accent-wash);
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
      border-bottom: 1px solid var(--grid);
    }
    .lineup-table tr.active {
      background: var(--accent-wash);
      border-radius: 8px;
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
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
    }
  }
  .linkish {
    border: 0;
    background: none;
    padding: 0;
    color: var(--accent-ink);
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 18px;
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--accent-wash);
  }
  .next p {
    flex: 1 1 320px;
    font-weight: 500;
  }
  @media (max-width: 820px) {
    .top,
    .cals {
      grid-template-columns: 1fr;
    }
    .row {
      grid-template-columns: 48px 1fr 92px;
    }
  }
</style>
