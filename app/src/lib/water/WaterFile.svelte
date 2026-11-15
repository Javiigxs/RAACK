<script lang="ts">
  // The file of the water case: what it does not say, methods, sources, use of AI and credits.
  // Code written with AI assistance (Claude) for team RAACK.
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import type { CaseAnalysis } from './case';
  import { SERIES } from './catalog';
  import { ciW, pW, rateW } from './format';
  import type { WaterData } from './types';

  let { data, c }: { data: WaterData; c: CaseAnalysis } = $props();

  const REPO = 'https://github.com/Javiigxs/RAACK';
  const nasa = [
    { key: 'imerg', url: 'https://erddap.marine.usf.edu/erddap/griddap/IMERG_monthly_global_precip.html' },
    { key: 'gldas', url: 'https://disc.gsfc.nasa.gov/datasets/GLDAS_NOAH025_3H_2.1/summary' },
    { key: 'grace', url: 'https://podaac.jpl.nasa.gov/dataset/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4' },
    { key: 'hydro', url: 'https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series' }
  ];
  const other = [
    { key: 'chirps', url: 'https://www.chc.ucsb.edu/data/chirps' },
    { key: 'conagua', url: 'https://sih.conagua.gob.mx/' },
    { key: 'smn', url: 'https://smn.conagua.gob.mx/' },
    { key: 'dof', url: 'https://sidof.segob.gob.mx/notas/docFuente/5708074' },
    { key: 'countries', url: 'https://github.com/mledoze/countries' },
    { key: 'challenge', url: 'https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/' }
  ];
  const repo = [
    { key: 'repo', url: REPO },
    { key: 'build', url: `${REPO}/blob/main/app/scripts/build_water.py` },
    { key: 'buildWorld', url: `${REPO}/blob/main/app/scripts/build_world.py` },
    { key: 'engine', url: `${REPO}/blob/main/app/src/lib/water/engine.ts` },
    { key: 'note', url: `${REPO}/blob/main/docs/DIAGNOSTICO_AGUA.md` }
  ];
  const methods = ['w.mt.1', 'w.mt.2', 'w.mt.3', 'w.mt.4', 'w.mt.5', 'w.mt.6', 'w.mt.7', 'w.mt.8', 'w.mt.9', 'w.mt.10', 'w.mt.11', 'w.mt.12'];
  const limits = ['w.lm.1', 'w.lm.2', 'w.lm.3', 'w.lm.4', 'w.lm.5', 'w.lm.6', 'w.lm.7', 'w.lm.8', 'w.lm.9'];
  const references = [
    'Hamed, K. H., & Rao, A. R. (1998). A modified Mann-Kendall trend test for autocorrelated data. Journal of Hydrology, 204(1–4), 182–196.',
    "Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. Journal of the American Statistical Association, 63(324), 1379–1389.",
    'Newey, W. K., & West, K. D. (1987). A simple, positive semi-definite, heteroskedasticity and autocorrelation consistent covariance matrix. Econometrica, 55(3), 703–708.',
    'Mann, H. B. (1945). Nonparametric tests against trend. Econometrica, 13(3), 245–259.',
    'Watkins, M. M., Wiese, D. N., Yuan, D.-N., Boening, C., & Landerer, F. W. (2015). Improved methods for observing Earth’s time variable mass distribution with GRACE using spherical cap mascons. Journal of Geophysical Research: Solid Earth, 120, 2648–2671.',
    'Wiese, D. N., Landerer, F. W., & Watkins, M. M. (2016). Quantifying and reducing leakage errors in the JPL RL05M GRACE mascon solution. Water Resources Research, 52, 7490–7502.',
    'Rodell, M., et al. (2004). The Global Land Data Assimilation System. Bulletin of the American Meteorological Society, 85(3), 381–394.',
    'Funk, C., et al. (2015). The climate hazards infrared precipitation with stations: a new environmental record for monitoring extremes. Scientific Data, 2, 150066.',
    'Roderick, M. L., & Farquhar, G. D. (2002). The cause of decreased pan evaporation over the past 50 years. Science, 298(5597), 1410–1411.'
  ];
  const nTests = $derived(Object.values(data.regions).reduce((q, r) => q + Object.values(r.reference).reduce((w, x) => w + Object.keys(x).length, 0), 0));
  const software = $derived(
    Object.entries(data.software)
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ')
  );

  function download() {
    const lines = Object.values(c.lines).map((l) => ({
      series: l.id,
      product: SERIES[l.id].product,
      sourceKind: l.def.kind,
      period: [l.trend.y0, l.trend.y1],
      years: l.trend.n,
      senPerDecade: l.perDecade,
      olsInterval95PerDecade: l.ci,
      hamedRaoP: l.trend.p,
      label: l.trend.label
    }));
    const payload = {
      tool: 'RAACK · Trend Detective — water case',
      challenge: 'NASA Space Apps Challenge 2026 — Be An Earth System Trend Detective!',
      created: new Date().toISOString(),
      selection: { region: c.region, period: [c.y0, c.y1], concern: ui.concern },
      verdict: c.verdict,
      storageAfterRain: c.rainFit ? { years: c.rainFit.n, r2: c.rainFit.r2, residualSenPerDecade: c.rainFit.trend.sen * 10, label: c.rainFit.trend.label } : null,
      series: lines,
      software: data.software,
      inputs: data.inputs,
      note: 'Computed in the browser from the yearly series of water.json (inputs listed with their SHA-256). Units per decade as shown on the page. Code written with AI assistance for team RAACK.'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `raack-water-${c.region}-${c.y0}-${c.y1}.json`;
    document.body.appendChild(el);
    el.click();
    el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
</script>

<section class="file">
  <header class="sec-head" id="w-limits">
    <p class="kicker">{t('w.lsec.kicker', { n: '10' })}</p>
    <h2>{t('w.lsec.title')}</h2>
    <p class="lead">{t('w.lsec.lead')}</p>
  </header>
  <ul class="limits">
    {#each limits as k (k)}
      <li><strong>{t(`${k}.h`)}</strong> {t(k)}</li>
    {/each}
  </ul>

  <header class="sec-head" id="w-methods">
    <p class="kicker">{t('w.msec.kicker', { n: '11' })}</p>
    <h2>{t('w.msec.title')}</h2>
    <p class="lead">{t('w.msec.lead')}</p>
  </header>

  <details class="block" open>
    <summary>{t('w.msec.methods')}</summary>
    <ol>
      {#each methods as k (k)}
        <li>{t(k, { n: nTests })}</li>
      {/each}
    </ol>
    {#if c.storage && c.storage.trend.ok}
      <p class="small">
        {t('w.msec.example', {
          rate: rateW(c.storage.def, c.storage.perDecade),
          ci: ciW(c.storage.def, c.storage.ci),
          p: pW(c.storage.trend.p),
          n: c.storage.trend.n
        })}
      </p>
    {/if}
    <h4>{t('cf.refs')}</h4>
    <ul class="refs">
      {#each references as r (r)}
        <li lang="en">{r}</li>
      {/each}
    </ul>
  </details>

  <details class="block" open>
    <summary>{t('w.msec.sources')}</summary>
    <h4>{t('cf.nasa')}</h4>
    <ul>
      {#each nasa as s (s.key)}
        <li><a href={s.url} target="_blank" rel="noopener">{t(`w.src.${s.key}.name`)}</a> — {t(`w.src.${s.key}.desc`)}</li>
      {/each}
    </ul>
    <h4>{t('cf.other')}</h4>
    <ul>
      {#each other as s (s.key)}
        <li><a href={s.url} target="_blank" rel="noopener">{t(`w.src.${s.key}.name`)}</a> — {t(`w.src.${s.key}.desc`)}</li>
      {/each}
    </ul>
    <h4>{t('w.msec.code')}</h4>
    <ul>
      {#each repo as s (s.key)}
        <li><a href={s.url} target="_blank" rel="noopener">{t(`w.src.${s.key}.name`)}</a> — {t(`w.src.${s.key}.desc`)}</li>
      {/each}
    </ul>
    <p class="small muted">{t('w.msec.generated', { date: data.generated.slice(0, 10), n: Object.keys(data.inputs).length })}</p>
    <p class="small muted">{software}</p>
    <button class="btn" onclick={download}>{t('w.msec.download')} <span aria-hidden="true">↓</span></button>
  </details>

  <details class="block" open id="w-ai">
    <summary>{t('cf.ai')}</summary>
    <p>{t('w.ai.p1')}</p>
    <p>{t('w.ai.p2')}</p>
    <p>{t('w.ai.p3')}</p>
    <p>{t('w.ai.p4')}</p>
  </details>

  <details class="block" open>
    <summary>{t('w.credits.title')}</summary>
    <p>{t('w.credits.team')}</p>
    <p class="small muted">{t('w.credits.thanks')}</p>
  </details>
</section>

<style>
  .file {
    display: grid;
    gap: 16px;
  }
  .sec-head {
    display: grid;
    gap: 8px;
    border-top: 2px solid var(--ink);
    padding-top: 24px;
    margin-top: 38px;
  }
  .sec-head h2 {
    font-size: clamp(26px, 3.8vw, 40px);
    letter-spacing: -0.022em;
  }
  .limits {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
  }
  .limits li {
    border: 1px solid var(--border);
    border-left: 3px solid var(--ink);
    border-radius: 4px 12px 12px 4px;
    background: var(--surface);
    padding: 13px 16px;
    font-size: 15px;
    color: var(--ink-2);
  }
  .limits strong {
    display: block;
    color: var(--ink);
    font-size: 16px;
    margin-bottom: 2px;
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
    max-width: 80ch;
  }
  details.block .btn {
    margin-top: 12px;
  }
  .refs {
    font-size: 13.5px !important;
    color: var(--ink-2);
  }
  @media (max-width: 620px) {
    details.block {
      padding: 12px 14px;
    }
  }
</style>
