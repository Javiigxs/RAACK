<script lang="ts">
  // «Dónde cambia»: la misma prueba en los cinco puntos de la ciudad.
  import { compareSites, oppositeTwins, type SeriesAnalysis } from '../analysis';
  import { VARS, type SiteId } from '../catalog';
  import SiteBars from '../charts/SiteBars.svelte';
  import SiteMap from '../charts/SiteMap.svelte';
  import { rateAbsText, rateText } from '../format';
  import { t } from '../i18n';
  import { selectSite, ui } from '../state.svelte';
  import type { CaseData } from '../types';

  let { data, a }: { data: CaseData; a: SeriesAnalysis } = $props();

  const def = $derived(VARS[a.varId]);
  const multi = $derived(def.sites.length > 2);
  const results = $derived(multi ? compareSites(data, a.varId, ui.quality, a.y0, a.y1, ui.deseason) : []);
  const decided = (x: SeriesAnalysis) => x.verdict.level === 'strong' || x.verdict.level === 'some';

  const stats = $derived.by(() => {
    const up = results.filter((r) => decided(r.analysis) && r.analysis.verdict.direction > 0);
    const down = results.filter((r) => decided(r.analysis) && r.analysis.verdict.direction < 0);
    const ins = results.filter((r) => r.analysis.verdict.level === 'insufficient');
    return { up, down, ins, none: results.length - up.length - down.length - ins.length };
  });
  const twins = $derived(oppositeTwins(results));
  const marks = $derived(
    Object.fromEntries(results.map((r) => [r.site, decided(r.analysis) ? r.analysis.verdict.direction : 0])) as Partial<Record<SiteId, number>>
  );

  const ranked = $derived([...results].filter((r) => r.analysis.trend.ok).sort((p, q) => q.analysis.perDecade - p.analysis.perDecade));
  const name = (s: SiteId) => t(`site.${s}.short`);

  const headline = $derived.by(() => {
    const n = results.length;
    const { up, down } = stats;
    if (twins) return t('wh.twins', { up: name(twins.up.site), down: name(twins.down.site) });
    if (up.length === n || down.length === n) {
      return t('wh.all', {
        n,
        dir: t(up.length === n ? 'dir.rising' : 'dir.falling'),
        fast: name(ranked[up.length === n ? 0 : ranked.length - 1].site),
        fastRate: rateText(a.varId, ranked[up.length === n ? 0 : ranked.length - 1].analysis.perDecade),
        slow: name(ranked[up.length === n ? ranked.length - 1 : 0].site),
        slowRate: rateText(a.varId, ranked[up.length === n ? ranked.length - 1 : 0].analysis.perDecade)
      });
    }
    if (up.length + down.length === 1) {
      const r = up[0] ?? down[0];
      return t('wh.one', { site: name(r.site), dir: t(up.length ? 'dir.rising' : 'dir.falling'), rate: rateAbsText(a.varId, r.analysis.perDecade) });
    }
    if (up.length + down.length === 0) return t('wh.nobody');
    return t('wh.some', { k: up.length + down.length, n, dir: t(up.length ? 'dir.rising' : 'dir.falling') });
  });
</script>

{#if multi}
  <div class="where">
    <div class="mapcol">
      <SiteMap {data} selected={a.site} selectable={def.sites} onselect={(s) => selectSite(s, true)} {marks} showStation={false} />
      <p class="small legend-line">
        <span class="pin up" aria-hidden="true">▲</span>{t('wh.legendUp')}
        <span class="pin down" aria-hidden="true">▼</span>{t('wh.legendDown')}
        <span class="pin none" aria-hidden="true"></span>{t('wh.legendNone')}
      </p>
    </div>
    <div class="barcol">
      <p class="headline">{headline}</p>
      <SiteBars {results} selected={a.site} unit={t(`trendUnit.${a.varId}`)} decimals={def.trendDecimals} onselect={(s) => selectSite(s, true)} />
      <p class="small">
        {t('wh.counts', { up: stats.up.length, down: stats.down.length, none: stats.none, ins: stats.ins.length })}
        {t('wh.pick')}
      </p>
      {#if stats.ins.length}
        <p class="small">{t('wh.insNote', { list: stats.ins.map((r) => name(r.site)).join(', ') })}</p>
      {/if}
      <p class="small">{t('wh.caveat')}</p>
    </div>
  </div>
{:else}
  <p class="note">{t(`wh.single.${a.varId}`)}</p>
{/if}

<style>
  .where {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    gap: var(--gap-block) 56px;
    align-items: start;
  }
  .barcol {
    display: grid;
    gap: 12px;
  }
  .headline {
    font-size: var(--fs-lead);
    line-height: 1.42;
    letter-spacing: -0.008em;
  }
  .legend-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin-top: 4px;
  }
  .pin {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 9px;
    color: #fff;
    margin-left: 8px;
  }
  .pin:first-child {
    margin-left: 0;
  }
  .pin.up {
    background: #e34948;
  }
  .pin.down {
    background: #2a78d6;
  }
  .pin.none {
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.75);
  }
  @media (max-width: 820px) {
    .where {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
