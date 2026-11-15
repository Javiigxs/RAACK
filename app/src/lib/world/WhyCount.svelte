<script lang="ts">
  // «Why 10 / 10?»: the result opens with the question and its answer, right above the count: with
  // all ten layers the verdict reaches the top label, and every trend behind it is tested at the 95%
  // confidence level. «What backs it» unfolds the rest: for a case of the tool, figures measured on
  // its data file (why.ts); for a country, how the count is made and what is still untested. The
  // count measures how complete the evidence is, not how sure a figure is, and the last line says
  // so. The question and the wish to open with it are Fran's (team RAACK).
  // Code written with AI assistance (Claude) for team RAACK.
  import { dete, openDete, type Place as Asked } from '../dete/dete.svelte';
  import { t } from '../i18n';
  import CertaintyChip from '../water/CertaintyChip.svelte';
  import { num, pctW } from '../water/format';
  import type { Readiness } from './layers';
  import { CONFIDENCE_PCT, type CaseEvidence } from './why';

  let {
    r,
    name,
    full,
    evidence,
    tested,
    asked
  }: {
    r: Readiness;
    name: string;
    /** Every layer is in the case file. */
    full: boolean;
    /** For a case of the tool: what its evidence supports. Null for a country. */
    evidence: CaseEvidence | null;
    /** For a country: the first look at its stored water exists. */
    tested: boolean;
    /** The place DE-T is asked about. */
    asked: Asked;
  } = $props();

  let open = $state(false);

  /** The complete case whose verdict reaches the top label: the answer leads with it. */
  const top = $derived(full && evidence?.verdict === 'confirmed');
  /** «95%»: the confidence level of the tests, as the page writes percentages in each language. */
  const level = $derived(pctW(CONFIDENCE_PCT, 0, false));

  /** Share of years with a value. It never reads 100 while a year is missing. */
  const yearsPct = $derived.by(() => {
    if (!evidence || !evidence.yearsSpan) return '';
    const pct = (100 * evidence.yearsWith) / evidence.yearsSpan;
    const whole = Math.round(pct) < 100 || evidence.yearsWith === evidence.yearsSpan;
    return whole ? pctW(pct, 0, false) : pctW(Math.floor(pct * 10) / 10, 1, false);
  });

  function ask() {
    openDete({ question: t('wr.why.ask.q', { name, ready: r.ready, total: r.total }), place: asked });
  }
</script>

<div class="why">
  <!-- The result opens with the question and its answer (Fran's request); what backs it unfolds. -->
  <h4 class="ask">{t('wr.why.q', { ready: r.ready, total: r.total })}</h4>
  <p class="answer">
    {#if top}
      {t('wr.why.lead.full', { verdict: t('w.cert.confirmed'), level })}
    {:else}
      {t('wr.why.lead.place', { ready: r.ready, name })}
      {t(tested ? 'wr.why.lead.tested' : 'wr.why.lead.untested', { level })}
    {/if}
  </p>

  <details class="more" bind:open>
  <summary><span class="q">{t('wr.why.more')}</span><span class="mark" aria-hidden="true"></span></summary>
  {#if open}
    <div class="body">
      <p>
        {full && evidence ? t('wr.why.full', { sources: evidence.sources, files: evidence.files }) : t('wr.why.place', { ready: r.ready, name })}
      </p>

      {#if evidence}
        <h4>{t('wr.why.supports')}</h4>
        <dl class="facts">
          <div>
            <dt>{t('wr.why.verdict.k')}</dt>
            <dd>
              <CertaintyChip label={evidence.verdict} />
              <span class="d">{t('wr.why.verdict.d', { known: evidence.rulesKnown, rules: evidence.rules, y0: evidence.y0, y1: evidence.y1 })}</span>
              {#if evidence.withoutGround && evidence.withoutGround !== evidence.verdict}
                <span class="d ground">{t('wr.why.ground')} <CertaintyChip label={evidence.withoutGround} compact /></span>
              {/if}
            </dd>
          </div>
          <div>
            <dt>{t('wr.why.trends.k')}</dt>
            <dd>
              <span class="v">{num(evidence.series)}</span>
              <span class="d">
                {t('wr.why.trends.d', { confirmed: evidence.labels.confirmed, hint: evidence.labels.hint, none: evidence.labels.none })}
                {#if evidence.labels.nodata > 0}{t('wr.why.trends.short', { n: evidence.labels.nodata })}{/if}
              </span>
            </dd>
          </div>
          <div>
            <dt>{t('wr.why.years.k')}</dt>
            <dd>
              <span class="v">{t('wr.why.years.v', { have: num(evidence.yearsWith), span: num(evidence.yearsSpan) })}</span>
              <span class="d">{t('wr.why.years.d', { pct: yearsPct })}</span>
            </dd>
          </div>
          <div>
            <dt>{t('wr.why.python.k')}</dt>
            <dd>
              <span class="v">{num(evidence.checked)}</span>
              <span class="d">{t('wr.why.python.d')}</span>
            </dd>
          </div>
        </dl>
      {:else}
        <p>{t(tested ? 'wr.why.place.tested' : 'wr.why.place.none', { name })}</p>
        <p>{t('wr.why.place.ceiling')}</p>
      {/if}

      <p>{t(evidence ? 'wr.why.limit.full' : 'wr.why.limit.place', { name })}</p>

      {#if dete.status === 'on'}
        <button class="textlink" type="button" onclick={ask} disabled={dete.busy}>{t('wr.why.ask')} <span aria-hidden="true">→</span></button>
      {/if}
    </div>
  {/if}
  </details>
</div>

<style>
  .why {
    display: grid;
    gap: 8px;
    justify-items: start;
    width: 100%;
  }
  /* The question, then its answer in the ink of the page: the first thing read under the name. */
  .ask {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
  }
  .answer {
    margin: 0 0 2px;
    max-width: 46ch;
    font-size: var(--fs-body);
    line-height: 1.45;
    color: var(--ink);
  }
  .more {
    width: 100%;
  }
  /* The question reads as a link of the page: ink, a thin underline and the mark of what unfolds. */
  summary {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    list-style: none;
    cursor: pointer;
    font-size: var(--fs-small);
    font-weight: 500;
    color: var(--ink);
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .q {
    text-decoration: underline;
    text-decoration-color: var(--border-strong);
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }
  summary:hover .q {
    text-decoration-color: currentColor;
  }
  /* Plus when closed, minus when open: the same mark as the blocks that unfold further down. */
  .mark {
    flex: none;
    width: 10px;
    height: 10px;
    background:
      linear-gradient(var(--ink), var(--ink)) center / 100% 1.5px no-repeat,
      linear-gradient(var(--ink), var(--ink)) center / 1.5px 100% no-repeat;
  }
  .more[open] .mark {
    background: linear-gradient(var(--ink), var(--ink)) center / 100% 1.5px no-repeat;
  }

  .body {
    display: grid;
    gap: 12px;
    justify-items: start;
    max-width: 54ch;
    padding: 14px 0 10px;
    font-size: var(--fs-small);
    line-height: 1.5;
    color: var(--ink-2);
  }
  .body p,
  .body h4 {
    margin: 0;
  }
  .body h4 {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
    margin-top: 6px;
  }
  /* What it is called on the left, what it measures on the right; a thin line between the rows. */
  .facts {
    margin: 0;
    width: 100%;
    border-bottom: 1px solid var(--border);
  }
  .facts > div {
    display: grid;
    grid-template-columns: minmax(0, 0.42fr) minmax(0, 1fr);
    gap: 4px 20px;
    padding: 11px 0 12px;
    border-top: 1px solid var(--border);
  }
  .facts dt,
  .facts dd {
    margin: 0;
  }
  .facts dd {
    display: grid;
    gap: 3px;
    justify-items: start;
  }
  .v {
    font-size: var(--fs-body);
    font-weight: 500;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .ground {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px 8px;
  }
  .textlink:disabled {
    cursor: default;
    color: var(--muted);
  }

  @media (max-width: 520px) {
    .facts > div {
      grid-template-columns: 1fr;
    }
  }
</style>
