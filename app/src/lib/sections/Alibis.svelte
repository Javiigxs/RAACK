<script lang="ts">
  // Las coartadas: comprobaciones que podrían tumbar el veredicto.
  // ¿Depende del periodo? ¿De un mes? ¿Del satélite? ¿Es una pendiente o un escalón?
  import { analyzeSeries, monthTrends, stepCheck, windowScan, type SeriesAnalysis } from '../analysis';
  import { RULES, VARS, monthName } from '../catalog';
  import MonthBars from '../charts/MonthBars.svelte';
  import WindowTriangle from '../charts/WindowTriangle.svelte';
  import { amountText, ciText, joinList, rateText } from '../format';
  import { t } from '../i18n';
  import { setPeriod, ui } from '../state.svelte';
  import type { CaseData } from '../types';
  import VerdictChip from '../ui/VerdictChip.svelte';

  let { data, a }: { data: CaseData; a: SeriesAnalysis } = $props();

  const def = $derived(VARS[a.varId]);
  const decided = (x: SeriesAnalysis) => x.verdict.level === 'strong' || x.verdict.level === 'some';

  // 1 · Meses
  const months = $derived(monthTrends(a.monthly));
  const monthUnit = $derived(a.varId === 'rain' ? 'mm' : t(`trendUnit.${a.varId}`));
  const monthDecimals = $derived(a.varId === 'rain' ? 1 : def.trendDecimals);
  const sigMonths = $derived(months.filter((mt) => mt.verdict.level === 'strong' || mt.verdict.level === 'some'));

  // 2 · Periodo
  const scan = $derived(windowScan(data, a.varId, a.site, ui.quality, ui.deseason));
  const scanStats = $derived.by(() => {
    const enough = scan.cells.filter((c) => c.enough);
    const sig = enough.filter((c) => c.significant);
    return {
      n: enough.length,
      sig: sig.length,
      up: sig.filter((c) => (c.perDecade ?? 0) > 0).length,
      down: sig.filter((c) => (c.perDecade ?? 0) < 0).length
    };
  });
  const scanKey = $derived.by(() => {
    const { n, sig, up, down } = scanStats;
    if (n === 0) return 'al.period.noData';
    if (sig === 0) return 'al.period.none';
    const minor = Math.min(up, down);
    // Las dos direcciones aparecen con peso: la dirección misma depende de los años.
    if (minor / sig > 0.1) return 'al.period.mixed';
    const share = sig / n;
    // El periodo elegido no muestra tendencia: ¿y los demás?
    if (!decided(a)) return share <= 0.1 ? 'al.period.fewSig' : 'al.period.someSig';
    if (minor > 0) return up > down ? 'al.period.mostlyUp' : 'al.period.mostlyDown';
    return share >= 0.8 ? 'al.period.robust' : share >= 0.5 ? 'al.period.mostly' : 'al.period.depends';
  });

  // 3 · Deriva de la órbita de Terra (solo temperatura superficial MODIS)
  const DRIFT_YEAR = 2019;
  const isLst = $derived(a.varId === 'lstDay' || a.varId === 'lstNight');
  const pre = $derived(
    isLst && a.y1 > DRIFT_YEAR && DRIFT_YEAR - a.y0 + 1 >= RULES.minYears
      ? analyzeSeries(data, a.varId, a.site, ui.quality, a.y0, DRIFT_YEAR, ui.deseason, 1000)
      : null
  );
  const driftKey = $derived.by(() => {
    if (!pre) return '';
    const full = decided(a);
    const before = decided(pre);
    if (full && before && a.verdict.direction === pre.verdict.direction) return 'al.drift.survives';
    if (full && !before) return 'al.drift.fails';
    if (!full && before) return 'al.drift.appears';
    return 'al.drift.neither';
  });

  // 4 · ¿Pendiente o escalón?
  const step = $derived(stepCheck(a.annual));
  const stepWins = $derived(step !== null && step.ratio < 0.7 && decided(a));

  // 5 · Ciclo estacional: el mismo análisis con el ajuste contrario
  const other = $derived(analyzeSeries(data, a.varId, a.site, ui.quality, a.y0, a.y1, !ui.deseason, 500));
  const withCycle = $derived(ui.deseason ? other : a);
  const withoutCycle = $derived(ui.deseason ? a : other);
</script>

<div class="grid">
  <article class="panel wide period">
    <div class="p-head">
      <p class="kicker">{t('al.k', { n: 1 })}</p>
      <h3>{t('al.period.title')}</h3>
    </div>
    <div class="p-chart">
      <WindowTriangle {scan} unit={t(`trendUnit.${a.varId}`)} decimals={def.trendDecimals} y0={a.y0} y1={a.y1} onpick={(s, e) => setPeriod(s, e, true)} />
    </div>
    <div class="p-text">
      <p class="result">
        {t(scanKey, { sig: scanStats.sig, n: scanStats.n, up: scanStats.up, down: scanStats.down, min: scan.minYears })}
      </p>
      <p class="small">{t('al.period.lead')}</p>
    </div>
  </article>

  <article class="panel wide">
    <p class="kicker">{t('al.k', { n: 2 })}</p>
    <h3>{t('al.months.title')}</h3>
    <p class="small">{t('al.months.lead')}</p>
    <MonthBars {months} unit={monthUnit} decimals={monthDecimals} />
    <p class="result">
      {#if sigMonths.length === 0}
        {t('al.months.none')}
      {:else if sigMonths.length >= 9}
        {t('al.months.most', { n: sigMonths.length })}
      {:else}
        {t(decided(a) ? 'al.months.some' : 'al.months.only', { list: joinList(sigMonths.map((mt) => monthName(mt.month, ui.lang))) })}
      {/if}
      <span class="muted">{t('al.months.note')}</span>
    </p>
  </article>

  {#if isLst}
    <article class="panel">
      <p class="kicker">{t('al.k', { n: 3 })}</p>
      <h3>{t('al.drift.title')}</h3>
      <p class="small">{t('al.drift.lead')}</p>
      {#if pre}
        <table class="data mini">
          <tbody>
            <tr>
              <td>{a.y0}–{a.y1}</td>
              <td>{rateText(a.varId, a.perDecade)}</td>
              <td><VerdictChip verdict={a.verdict} compact /></td>
            </tr>
            <tr>
              <td>{pre.y0}–{pre.y1}<br /><span class="muted">{t('al.drift.before')}</span></td>
              <td>{rateText(a.varId, pre.perDecade)}</td>
              <td><VerdictChip verdict={pre.verdict} compact /></td>
            </tr>
          </tbody>
        </table>
        <p class="result">{t(driftKey, { rate: rateText(a.varId, pre.perDecade) })}</p>
        <button class="btn small-btn use" onclick={() => setPeriod(a.y0, DRIFT_YEAR, true)}>{t('al.drift.use', { y0: a.y0, y1: DRIFT_YEAR })}</button>
      {:else if a.y1 <= DRIFT_YEAR}
        <p class="result">{t('al.drift.clean')}</p>
      {:else}
        <p class="result">{t('al.drift.short', { min: RULES.minYears })}</p>
      {/if}
      <p class="small muted">{t('al.drift.src')}</p>
    </article>
  {/if}

  <article class="panel">
    <p class="kicker">{t('al.k', { n: isLst ? 4 : 3 })}</p>
    <h3>{t('al.step.title')}</h3>
    <p class="small">{t('al.step.lead')}</p>
    <p class="result">
      {#if step === null}
        {t('al.step.na')}
      {:else if stepWins}
        {t('al.step.yes', { year: step.year, jump: amountText(a.varId, step.jump * def.trendScale), pct: Math.round((1 - step.ratio) * 100) })}
      {:else}
        {t('al.step.no')}
      {/if}
    </p>
  </article>

  <article class="panel">
    <p class="kicker">{t('al.k', { n: isLst ? 5 : 4 })}</p>
    <h3>{t('al.season.title')}</h3>
    <p class="small">{t('al.season.lead')}</p>
    <table class="data mini">
      <tbody>
        <tr>
          <td>{t('al.season.removed')}{#if ui.deseason}<br /><span class="muted">{t('al.season.yours')}</span>{/if}</td>
          <td>{ciText(a.varId, withoutCycle.ci)}</td>
          <td><VerdictChip verdict={withoutCycle.verdict} compact /></td>
        </tr>
        <tr>
          <td>{t('al.season.left')}{#if !ui.deseason}<br /><span class="muted">{t('al.season.yours')}</span>{/if}</td>
          <td>{ciText(a.varId, withCycle.ci)}</td>
          <td><VerdictChip verdict={withCycle.verdict} compact /></td>
        </tr>
      </tbody>
    </table>
    <p class="result">{t(withCycle.verdict.level === withoutCycle.verdict.level ? 'al.season.same' : 'al.season.differs')}</p>
  </article>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }
  .panel {
    display: grid;
    gap: 10px;
    align-content: start;
    min-width: 0;
  }
  .wide,
  .panel:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
  .period {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    grid-template-areas:
      'head head'
      'chart text';
    column-gap: 28px;
  }
  .p-head {
    grid-area: head;
    display: grid;
    gap: 10px;
  }
  .p-chart {
    grid-area: chart;
    min-width: 0;
  }
  .p-text {
    grid-area: text;
    display: grid;
    gap: 12px;
    align-content: start;
    padding-top: 22px;
  }
  .use {
    justify-self: start;
  }
  .result {
    font-size: 16px;
    font-weight: 500;
    max-width: 78ch;
  }
  .result .muted {
    display: block;
    font-size: 13.5px;
    font-weight: 400;
    margin-top: 2px;
  }
  table.mini td {
    padding: 8px 8px 8px 0;
    vertical-align: middle;
  }
  table.mini td:first-child {
    font-weight: 650;
  }
  @media (max-width: 820px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .period {
      grid-template-columns: 1fr;
      grid-template-areas:
        'head'
        'text'
        'chart';
    }
    .p-text {
      padding-top: 0;
    }
  }
</style>
