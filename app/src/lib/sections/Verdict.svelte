<script lang="ts">
  // El veredicto: cuánto cambia, con qué certeza y qué dice cada una de las tres pruebas.
  import type { SeriesAnalysis } from '../analysis';
  import { RULES, VARS, fmt, fmtSigned } from '../catalog';
  import { amountText, ciText, covText, pText, rateAbsText, rateText } from '../format';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import VerdictChip from '../ui/VerdictChip.svelte';

  let { a }: { a: SeriesAnalysis } = $props();

  const def = $derived(VARS[a.varId]);
  const tr = $derived(a.trend);
  const v = $derived(a.verdict);
  const nYears = $derived(a.y1 - a.y0 + 1);
  const total = $derived(a.perDecade * (nYears / 10));
  const decided = $derived(v.level === 'strong' || v.level === 'some');
  const guess = $derived(((2 * ui.guessEnd) / (a.y1 + 1 - a.y0)) * 10 * def.trendScale);
  const guessInside = $derived(guess >= a.ci[0] && guess <= a.ci[1]);

  const sentence = $derived.by(() => {
    const p = {
      subject: t(`var.${a.varId}.subject`),
      at: t(`site.${a.site}.at`),
      y0: a.y0,
      y1: a.y1,
      rate: rateAbsText(a.varId, a.perDecade),
      dir: t(v.direction > 0 ? 'dir.rising' : 'dir.falling'),
      years: nYears,
      min: RULES.minYears,
      cov: covText(a.nValid, a.nTotal),
      minCov: RULES.minCoverage * 100
    };
    if (v.level === 'insufficient') return t(`vd.insufficient.${v.reason ?? 'few'}`, p);
    return t(`vd.${v.level}`, p);
  });
</script>

{#snippet juror(name: string, how: string, result: string, vote: boolean | null)}
  <li>
    <div class="jhead">
      <strong>{name}</strong>
      <span class="vote" class:yes={vote === true}>{t(vote ? 'jury.yes' : 'jury.no')}</span>
    </div>
    <p class="how">{how}</p>
    <p class="res">{result}</p>
  </li>
{/snippet}

<div class="verdict">
  <div class="main">
    <p class="kicker">{t('vd.kicker', { y0: a.y0, y1: a.y1 })}</p>
    <div class="headline" class:quiet={!decided}>
      <span class="num">{tr.ok ? fmtSigned(a.perDecade, def.trendDecimals, ui.lang) : '—'}</span>
      <span class="unit">{t(`trendUnit.${a.varId}`)}<br />{t('unit.perDecade')}</span>
    </div>
    {#if tr.ok}
      <p class="ci">{t('vd.ci')} <strong>{ciText(a.varId, a.ci)}</strong></p>
    {/if}
    <VerdictChip verdict={v} />
    <p class="plain">{sentence}</p>
    {#if decided}
      <p class="small">{t('vd.total', { total: amountText(a.varId, total), n: nYears })}</p>
    {/if}
    {#if ui.guessTouched && tr.ok}
      <p class="guess">
        <span class="swatch" aria-hidden="true"></span>
        {t(guessInside ? 'vd.guessIn' : 'vd.guessOut', { guess: rateText(a.varId, guess), data: rateText(a.varId, a.perDecade) })}
      </p>
    {/if}
  </div>

  {#if tr.ok}
    <div class="jury">
      <h3>{t('jury.title')}</h3>
      <p class="small">{t('jury.lead')}</p>
      <ul>
        {@render juror(t('jury.t.name'), t('jury.t.how'), pText(tr.ols.p), tr.votes.t)}
        {@render juror(t('jury.mk.name'), t('jury.mk.how'), pText(tr.mk.p), tr.votes.mk)}
        {#if tr.boot}
          {@render juror(t('jury.boot.name'), t('jury.boot.how'), `${t('ev.interval')}: ${ciText(a.varId, a.bootCi)}`, tr.votes.boot)}
        {/if}
      </ul>
    </div>
  {/if}
</div>

<ul class="notes">
  {#if tr.ok && (v.level === 'none' || v.level === 'weak') && tr.yearsToDetect !== null}
    <li>
      <strong>{t('ev.howLong')}</strong>
      {tr.yearsToDetect > 300 ? t('ev.yearsMany') : t('ev.years', { n: fmt(tr.yearsToDetect, 0, ui.lang), have: fmt(tr.spanYears, 0, ui.lang) })}
    </li>
  {/if}
  {#if tr.ok && tr.phi > 0}
    <li>
      <strong>{t('vd.memoryTitle')}</strong>
      {t('vd.memory', { r1: fmt(tr.r1, 2, ui.lang), n: tr.n, nEff: fmt(tr.nEff, 0, ui.lang) })}
    </li>
  {/if}
  <li>
    <strong>{t('vd.coverageTitle')}</strong>
    {t('vd.coverage', { valid: a.nValid, total: a.nTotal, cov: covText(a.nValid, a.nTotal) })}
    {#if def.hasQuality}{t(`vd.quality.${ui.quality}`)}{/if}
  </li>
  <li>
    <strong>{t('vd.meansTitle')}</strong>
    {t(decided ? 'vd.meansYes' : 'vd.meansNo')}
  </li>
</ul>

<style>
  .verdict {
    display: grid;
    grid-template-columns: minmax(0, 11fr) minmax(0, 9fr);
    gap: 32px 64px;
  }
  .main {
    display: grid;
    gap: 14px;
    justify-items: start;
    align-content: start;
  }
  .headline {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    margin-top: 6px;
  }
  .num {
    font-size: clamp(56px, 8vw, 104px);
    font-weight: 500;
    letter-spacing: -0.055em;
    line-height: 0.88;
    font-variant-numeric: tabular-nums;
  }
  .headline.quiet .num {
    color: var(--muted);
  }
  .unit {
    font-size: var(--fs-body);
    color: var(--ink-2);
    line-height: 1.25;
    padding-bottom: 6px;
  }
  .ci {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ci strong {
    color: var(--ink);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .plain {
    font-size: var(--fs-lead);
    line-height: 1.42;
    letter-spacing: -0.008em;
    max-width: 46ch;
  }
  .guess {
    display: flex;
    gap: 10px;
    align-items: baseline;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .swatch {
    flex: none;
    width: 16px;
    height: 0;
    border-top: 2px dashed var(--series-2);
    transform: translateY(-4px);
  }
  .jury {
    display: grid;
    gap: 6px;
    align-content: start;
  }
  .jury h3 {
    font-size: 20px;
  }
  .jury ul {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    display: grid;
  }
  .jury li {
    border-top: 1px solid var(--border);
    padding: 14px 0;
    display: grid;
    gap: 4px;
  }
  .jhead {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .jhead strong {
    font-weight: 600;
  }
  /* The vote of a test: a word, in ink when it sees the change. */
  .vote {
    font-size: var(--fs-small);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .vote.yes {
    color: var(--ink);
    font-weight: 600;
  }
  .vote.yes::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 7px;
    border-radius: 50%;
    background: currentColor;
    transform: translateY(-1px);
  }
  .how {
    font-size: var(--fs-small);
    color: var(--ink-2);
    line-height: 1.45;
  }
  .res {
    font-size: var(--fs-small);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .notes {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 48px;
    font-size: var(--fs-small);
    line-height: 1.5;
    color: var(--ink-2);
  }
  .notes li {
    border-top: 1px solid var(--border);
    padding: 16px 0 20px;
  }
  .notes strong {
    color: var(--ink);
    display: block;
    margin-bottom: 4px;
  }
  @media (max-width: 820px) {
    .verdict,
    .notes {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
