<script lang="ts">
  // El expediente: resumen del caso, fuentes de datos, métodos, límites y uso de IA.
  import type { SeriesAnalysis } from '../analysis';
  import { VARS, fmt, kindOf, productOf, type SiteId } from '../catalog';
  import { ciText, coordText, covText, pText, rateText } from '../format';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import type { CaseData } from '../types';

  let { data, a }: { data: CaseData; a: SeriesAnalysis } = $props();

  const def = $derived(VARS[a.varId]);
  const tr = $derived(a.trend);
  const coords = (s: SiteId) => (s === 'station' ? data.station : s === 'cell' || s === 'merra' ? data.cell : data.sites[s]);
  const here = $derived(coords(a.site));

  const nasaSources = [
    { key: 'imerg', url: 'https://power.larc.nasa.gov/' },
    { key: 'merra', url: 'https://power.larc.nasa.gov/' },
    { key: 'lst', url: 'https://doi.org/10.5067/MODIS/MOD11A2.061' },
    { key: 'ndvi', url: 'https://doi.org/10.5067/MODIS/MOD13A3.061' },
    { key: 'appeears', url: 'https://appeears.earthdatacloud.nasa.gov/' },
    { key: 'gibs', url: 'https://nasa-gibs.github.io/gibs-api-docs/' },
    { key: 'terra', url: 'https://terra.nasa.gov/about/terra-orbital-drift-information' }
  ];
  const otherSources = [
    { key: 'smn', url: 'https://smn.conagua.gob.mx/' },
    { key: 'challenge', url: 'https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/' },
    { key: 'repo', url: 'https://github.com/Javiigxs/RAACK' }
  ];
  const methodKeys = ['mt.1', 'mt.2', 'mt.3', 'mt.4', 'mt.5', 'mt.6', 'mt.7', 'mt.8', 'mt.9', 'mt.10'];
  const limitKeys = ['lm.1', 'lm.2', 'lm.3', 'lm.4', 'lm.5', 'lm.6', 'lm.7', 'lm.8'];
  const references = [
    'Mann, H. B. (1945). Nonparametric tests against trend. Econometrica, 13(3), 245–259.',
    'Kendall, M. G. (1975). Rank Correlation Methods (4th ed.). Charles Griffin, London.',
    'Theil, H. (1950). A rank-invariant method of linear and polynomial regression analysis. Proceedings of the Royal Netherlands Academy of Sciences, 53.',
    "Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. Journal of the American Statistical Association, 63(324), 1379–1389.",
    'Santer, B. D., et al. (2000). Statistical significance of trends and trend differences in layer-average atmospheric temperature time series. Journal of Geophysical Research, 105(D6), 7337–7356.',
    'Yue, S., & Wang, C. (2004). The Mann–Kendall test modified by effective sample size to detect trend in serially correlated hydrological series. Water Resources Management, 18, 201–218.',
    'Politis, D. N., & Romano, J. P. (1992). A circular block-resampling procedure for stationary data. In Exploring the Limits of Bootstrap. Wiley.',
    'Weatherhead, E. C., et al. (1998). Factors affecting the detection of trends: Statistical considerations and applications to environmental data. Journal of Geophysical Research, 103(D14), 17149–17161.'
  ];

  function download() {
    const payload = {
      tool: 'RAACK · Trend Detective',
      challenge: 'NASA Space Apps Challenge 2026 — Be An Earth System Trend Detective!',
      created: new Date().toISOString(),
      selection: {
        variable: a.varId,
        product: productOf(a.varId, a.site),
        sourceKind: kindOf(a.varId, a.site),
        site: a.site,
        latitude: here.lat,
        longitude: here.lon,
        period: [a.y0, a.y1],
        seasonalCycleRemoved: a.deseason,
        qualityFilter: def.hasQuality ? ui.quality : null
      },
      data: { monthsValid: a.nValid, monthsTotal: a.nTotal, coverage: a.coverage },
      result: {
        verdict: a.verdict.level,
        direction: a.verdict.direction,
        unitPerDecade: `${def.trendUnit} per decade`,
        theilSenPerDecade: a.perDecade,
        senInterval95: a.ci,
        olsPerDecade: a.olsPerDecade,
        tTestP: tr.ols.p,
        mannKendallP: tr.mk.p,
        bootstrapInterval95: a.bootCi,
        lag1Autocorrelation: tr.r1,
        effectiveSampleSize: tr.nEff,
        yearsToDetect: tr.yearsToDetect
      },
      inputs: data.inputs,
      note: 'Computed in the browser from the files listed in "inputs" (SHA-256 of each). Code written with AI assistance for team RAACK.'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `raack-case-${a.varId}-${a.site}-${a.y0}-${a.y1}.json`;
    document.body.appendChild(el);
    el.click();
    el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
</script>

<section id="file" class="file">
  <header>
    <p class="kicker">{t('cf.kicker')}</p>
    <h2>{t('cf.title')}</h2>
    <p class="lead">{t('cf.lead')}</p>
  </header>

  <div class="panel">
    <h3>{t('cf.summary')}</h3>
    {#if ui.revealed}
      <div class="scroll-x">
        <table class="data">
          <tbody>
            <tr><td>{t('cf.row.clue')}</td><td>{t(`var.${a.varId}.name`)} — {t(a.varId === 'rain' && a.site === 'station' ? 'var.rain.metaStation' : `var.${a.varId}.meta`)}</td></tr>
            <tr><td>{t('cf.row.place')}</td><td>{t(`site.${a.site}.name`)} ({coordText(here)})</td></tr>
            <tr><td>{t('cf.row.period')}</td><td>{a.y0}–{a.y1}</td></tr>
            <tr><td>{t('cf.row.months')}</td><td>{a.nValid} / {a.nTotal} ({covText(a.nValid, a.nTotal)}{ui.lang === 'es' ? ' %' : '%'})</td></tr>
            <tr><td>{t('cf.row.season')}</td><td>{t(a.deseason ? 'al.season.removed' : 'al.season.left')}</td></tr>
            {#if def.hasQuality}
              <tr><td>{t('s3.quality')}</td><td>{t(`s3.q.${ui.quality}`)}</td></tr>
            {/if}
            <tr><td>{t('cf.row.rate')}</td><td>{rateText(a.varId, tr.ok ? a.perDecade : null)} · {t('ev.interval')} {ciText(a.varId, tr.ok ? a.ci : null)}</td></tr>
            <tr><td>{t('jury.t.name')}</td><td>{pText(tr.ols.p)}</td></tr>
            <tr><td>{t('jury.mk.name')}</td><td>{pText(tr.mk.p)}</td></tr>
            <tr><td>{t('jury.boot.name')}</td><td>{ciText(a.varId, a.bootCi)}</td></tr>
            <tr><td>{t('cf.row.memory')}</td><td>r₁ = {fmt(tr.r1, 2, ui.lang)} · n = {tr.n} · n* = {fmt(tr.nEff, 0, ui.lang)}</td></tr>
            <tr><td>{t('oc.lineup.verdict')}</td><td><strong>{t(`verdict.${a.verdict.level}`)}</strong></td></tr>
          </tbody>
        </table>
      </div>
      <button class="btn" onclick={download}>{t('cf.download')} <span aria-hidden="true">↓</span></button>
    {:else}
      <p class="small">{t('cf.locked')}</p>
    {/if}
  </div>

  <details class="block" open>
    <summary>{t('cf.sources')}</summary>
    <h4>{t('cf.nasa')}</h4>
    <ul>
      {#each nasaSources as s (s.key)}
        <li><a href={s.url} target="_blank" rel="noopener">{t(`src.${s.key}.name`)}</a> — {t(`src.${s.key}.desc`)}</li>
      {/each}
    </ul>
    <h4>{t('cf.other')}</h4>
    <ul>
      {#each otherSources as s (s.key)}
        <li><a href={s.url} target="_blank" rel="noopener">{t(`src.${s.key}.name`)}</a> — {t(`src.${s.key}.desc`)}</li>
      {/each}
    </ul>
    <p class="small muted">{t('cf.generated', { date: data.generated.slice(0, 10) })}</p>
  </details>

  <details class="block">
    <summary>{t('cf.methods')}</summary>
    <ol>
      {#each methodKeys as k (k)}
        <li>{t(k)}</li>
      {/each}
    </ol>
    <h4>{t('cf.refs')}</h4>
    <ul class="refs">
      {#each references as r (r)}
        <li lang="en">{r}</li>
      {/each}
    </ul>
  </details>

  <details class="block">
    <summary>{t('cf.limits')}</summary>
    <ul>
      {#each limitKeys as k (k)}
        <li>{t(k)}</li>
      {/each}
    </ul>
  </details>

  <details class="block" open>
    <summary>{t('cf.ai')}</summary>
    <p>{t('ai.p1')}</p>
    <p>{t('ai.p2')}</p>
    <p>{t('ai.p3')}</p>
  </details>
</section>

<style>
  .file {
    padding-top: 64px;
    display: grid;
    gap: 16px;
  }
  header {
    display: grid;
    gap: 8px;
    border-top: 2px solid var(--ink);
    padding-top: 26px;
    margin-bottom: 6px;
  }
  header h2 {
    font-size: clamp(26px, 3.8vw, 38px);
  }
  .panel {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  .panel .scroll-x {
    width: 100%;
  }
  .panel td:first-child {
    color: var(--ink-2);
    width: 34%;
    white-space: nowrap;
  }
  .panel td:last-child {
    text-align: left;
  }
  details.block {
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    padding: 14px 20px;
  }
  details.block summary {
    cursor: pointer;
    font-weight: 700;
    font-size: 17px;
  }
  details.block h4 {
    font-size: 13px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-2);
    margin: 16px 0 6px;
  }
  details.block ul,
  details.block ol {
    margin: 8px 0 0;
    padding-left: 22px;
    display: grid;
    gap: 7px;
    font-size: 15px;
  }
  details.block p {
    margin-top: 10px;
    max-width: 78ch;
  }
  .refs {
    font-size: 13.5px !important;
    color: var(--ink-2);
  }
  @media (max-width: 620px) {
    .panel td:first-child {
      white-space: normal;
      width: 40%;
    }
    details.block {
      padding: 12px 14px;
    }
  }
</style>
