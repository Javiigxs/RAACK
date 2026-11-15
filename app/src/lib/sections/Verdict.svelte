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

<div class="verdict card">
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
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 28px;
    padding: clamp(18px, 3vw, 30px);
  }
  .main {
    display: grid;
    gap: 12px;
    justify-items: start;
    align-content: start;
  }
  .headline {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }
  .num {
    font-size: clamp(48px, 8vw, 84px);
    font-weight: 780;
    letter-spacing: -0.04em;
    line-height: 0.95;
  }
  .headline.quiet .num {
    color: var(--muted);
  }
  .unit {
    font-size: 16px;
    font-weight: 600;
    color: var(--ink-2);
    line-height: 1.25;
    padding-bottom: 6px;
  }
  .ci {
    color: var(--ink-2);
    font-size: 15px;
  }
  .ci strong {
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .plain {
    font-size: clamp(18px, 2.1vw, 21px);
    line-height: 1.4;
    font-weight: 500;
    max-width: 46ch;
  }
  .guess {
    display: flex;
    gap: 9px;
    align-items: baseline;
    font-size: 14.5px;
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
    border-left: 1px solid var(--grid);
    padding-left: 28px;
    display: grid;
    gap: 8px;
    align-content: start;
  }
  .jury h3 {
    font-size: 18px;
  }
  .jury ul {
    list-style: none;
    padding: 0;
    margin: 6px 0 0;
    display: grid;
    gap: 10px;
  }
  .jury li {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    background: var(--surface-2);
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
  .how {
    font-size: 13.5px;
    color: var(--ink-2);
    line-height: 1.4;
  }
  .res {
    font-size: 14.5px;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
  .notes {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 24px;
    font-size: 14.5px;
    color: var(--ink-2);
  }
  .notes li {
    border-left: 3px solid var(--axis);
    padding-left: 12px;
  }
  .notes strong {
    color: var(--ink);
    display: block;
  }
  @media (max-width: 820px) {
    .verdict,
    .notes {
      grid-template-columns: 1fr;
    }
    .jury {
      border-left: 0;
      padding-left: 0;
      border-top: 1px solid var(--grid);
      padding-top: 18px;
    }
  }
</style>
