<script lang="ts">
  // El segundo testigo: una fuente independiente que mide lo mismo (o algo muy cercano).
  // Si las dos cuentan la misma historia, el resultado es más creíble.
  import { analyzeSeries, rainWitness, type SeriesAnalysis } from '../analysis';
  import { VARS, fmt, fmtSigned, kindOf, productOf, type SiteId, type VarId } from '../catalog';
  import WitnessScatter from '../charts/WitnessScatter.svelte';
  import { ciText, rateText } from '../format';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import type { CaseData } from '../types';
  import VerdictChip from '../ui/VerdictChip.svelte';

  let { data, a }: { data: CaseData; a: SeriesAnalysis } = $props();

  const def = $derived(VARS[a.varId]);
  const decided = (x: SeriesAnalysis) => x.verdict.level === 'strong' || x.verdict.level === 'some';

  // Lluvia: celda del satélite frente al pluviómetro
  const rw = $derived(a.varId === 'rain' ? rainWitness(data, a.y0, a.y1) : null);
  const rainOther = $derived(
    a.varId === 'rain' ? analyzeSeries(data, 'rain', a.site === 'cell' ? 'station' : 'cell', 'standard', a.y0, a.y1, ui.deseason, 1000) : null
  );

  // Temperatura: superficie (MODIS) frente al aire (estación), en el periodo que comparten
  const pair = $derived(def.witness);
  const common = $derived.by(() => {
    if (!pair) return null;
    const w = VARS[pair.varId];
    const y0 = Math.max(a.y0, w.y0, def.y0);
    const y1 = Math.min(a.y1, w.y1, def.y1);
    return y1 - y0 + 1 >= 5 ? { y0, y1 } : null;
  });
  const mine = $derived(pair && common ? analyzeSeries(data, a.varId, a.site, ui.quality, common.y0, common.y1, ui.deseason, 1000) : null);
  const theirs = $derived(pair && common ? analyzeSeries(data, pair.varId, pair.site, 'standard', common.y0, common.y1, ui.deseason, 1000) : null);

  function agreement(x: SeriesAnalysis, y: SeriesAnalysis): string {
    const dx = decided(x);
    const dy = decided(y);
    if (dx && dy) return x.verdict.direction === y.verdict.direction ? 'wi.agree' : 'wi.oppose';
    if (!dx && !dy) return x.verdict.level === 'insufficient' || y.verdict.level === 'insufficient' ? 'wi.cannot' : 'wi.agreeNone';
    return 'wi.split';
  }

  function km(s1: { lat: number; lon: number }, s2: { lat: number; lon: number }): number {
    const R = 6371;
    const rad = Math.PI / 180;
    const dLat = (s2.lat - s1.lat) * rad;
    const dLon = (s2.lon - s1.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(s1.lat * rad) * Math.cos(s2.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const coords = (s: SiteId) => (s === 'station' ? data.station : s === 'cell' || s === 'merra' ? data.cell : data.sites[s]);
  const distance = $derived(pair ? km(coords(a.site), coords(pair.site)) : a.varId === 'rain' ? km(data.cell, data.station) : null);

  const label = (v: VarId, s: SiteId) => `${t(`var.${v}.name`)} · ${t(`site.${s}.short`)}`;
</script>

{#snippet row(x: SeriesAnalysis)}
  <tr>
    <td>
      {label(x.varId, x.site)}<br /><span class="muted">{t(`kind.${kindOf(x.varId, x.site)}`)} · {productOf(x.varId, x.site)}</span>
    </td>
    <td data-label={t('oc.lineup.rate')}>{rateText(x.varId, x.trend.ok ? x.perDecade : null)}</td>
    <td data-label={t('oc.lineup.interval')}>{ciText(x.varId, x.trend.ok ? x.ci : null)}</td>
    <td><VerdictChip verdict={x.verdict} compact /></td>
  </tr>
{/snippet}

{#if rw && rainOther}
  <div class="wit">
    <div>
      <WitnessScatter w={rw} />
    </div>
    <div class="text">
      <p class="headline">
        {#if rw.r !== null && rw.bias !== null}
          {t('wi.rain.headline', {
            n: rw.n,
            r: fmt(rw.r, 2, ui.lang),
            bias: fmt(Math.abs(rw.bias), 0, ui.lang),
            side: t(rw.bias < 0 ? 'wi.rain.lower' : 'wi.rain.higher')
          })}
        {:else}
          {t('wi.cannot')}
        {/if}
      </p>
      <div class="scroll-x">
        <table class="data wtable">
          <thead>
            <tr><th>{t('wi.col.witness')}</th><th>{t('oc.lineup.rate')}</th><th>{t('oc.lineup.interval')}</th><th>{t('oc.lineup.verdict')}</th></tr>
          </thead>
          <tbody>
            {@render row(a)}
            {@render row(rainOther)}
          </tbody>
        </table>
      </div>
      <p class="result">{t(agreement(a, rainOther))}</p>
      <p class="small muted">{t('wi.rain.caveat', { km: fmt(distance, 0, ui.lang) })}</p>
    </div>
  </div>
{:else if pair && mine && theirs && common}
  <div class="text">
    <p class="small">{t('wi.temp.lead', { y0: common.y0, y1: common.y1 })}</p>
    <div class="scroll-x">
      <table class="data wtable">
        <thead>
          <tr><th>{t('wi.col.witness')}</th><th>{t('oc.lineup.rate')}</th><th>{t('oc.lineup.interval')}</th><th>{t('oc.lineup.verdict')}</th></tr>
        </thead>
        <tbody>
          {@render row(mine)}
          {@render row(theirs)}
        </tbody>
      </table>
    </div>
    <p class="headline">{t(agreement(mine, theirs))}</p>
    <p class="small muted">
      {t('wi.temp.caveat', { km: fmt(distance, 0, ui.lang) })}
      {#if mine.trend.ok && theirs.trend.ok}
        {t('wi.temp.diff', { d: fmtSigned(mine.perDecade - theirs.perDecade, 2, ui.lang) })}
      {/if}
    </p>
  </div>
{:else}
  <p class="note">{t(`wi.none.${a.varId}`)}</p>
{/if}

<style>
  .wit {
    display: grid;
    grid-template-columns: minmax(0, 440px) minmax(0, 1fr);
    gap: 26px;
    align-items: start;
  }
  .text {
    display: grid;
    gap: 12px;
  }
  .headline {
    font-size: clamp(18px, 2.1vw, 21px);
    font-weight: 500;
    line-height: 1.4;
    max-width: 62ch;
  }
  .result {
    font-size: 16px;
    font-weight: 500;
  }
  td:first-child {
    font-weight: 650;
  }
  td:first-child .muted {
    font-weight: 400;
    font-size: 12.5px;
  }
  @media (max-width: 820px) {
    .wit {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 620px) {
    .wtable thead {
      display: none;
    }
    .wtable tr {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 14px;
      padding: 12px 0;
      border-bottom: 1px solid var(--grid);
    }
    .wtable td {
      display: block;
      border: 0;
      padding: 0;
      text-align: left;
    }
    .wtable td:first-child,
    .wtable td:last-child {
      grid-column: 1 / -1;
    }
    .wtable td[data-label]::before {
      content: attr(data-label);
      display: block;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
    }
  }
</style>
