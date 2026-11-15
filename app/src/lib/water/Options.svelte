<script lang="ts">
  // Options for action and what to avoid, from a fixed catalogue tied to the verdict.
  // Every option shows the datum that justifies it and how certain that datum is.
  // Catalogue written by the team; code written with AI assistance (Claude).
  import { t } from '../i18n';
  import { joinList } from '../format';
  import type { CaseAnalysis } from './case';
  import CertaintyChip from './CertaintyChip.svelte';
  import { valueAt, type Certainty } from './engine';
  import { ciW, num, pctW, rateW, signed } from './format';

  let { c }: { c: CaseAnalysis } = $props();
  const v = $derived(c.verdict);

  type Why = { text: string; label: Certainty; chip?: string };
  type Item = { key: string; params?: Record<string, string | number>; why: Why };
  type Group = { id: string; items: Item[]; avoid: string[] };

  const worst = $derived([...c.reservoirs].filter((r) => r.crisisPct !== null).sort((a, b) => (a.crisisPct as number) - (b.crisisPct as number))[0] ?? null);
  const soilGal = $derived(c.lines.soil_gldas_gal ?? null);

  const whys = $derived.by(() => {
    const unmeasured: Why = { text: t('w.why.unmeasured'), label: 'nodata' };
    const aquifers: Why = c.aquifers
      ? { text: t('w.why.aquifers', { neg: c.aquifers.negative, total: c.aquifers.total }), label: 'confirmed', chip: t('w.cert.official') }
      : { text: t('w.why.noOfficial'), label: 'nodata' };
    const storage: Why = c.storage
      ? { text: t('w.why.storage', { rate: rateW(c.storage.def, c.storage.perDecade) }), label: c.storage.trend.label }
      : unmeasured;
    const residual: Why = c.rainFit ? { text: t('w.why.residual', { rate: rateW(c.storage!.def, c.rainFit.trend.sen * 10) }), label: c.rainFit.trend.label } : storage;
    const rainSteady: Why = c.rain
      ? { text: t('w.why.rainSteady', { rate: rateW(c.rain.def, c.rain.perDecade), ci: ciW(c.rain.def, c.rain.ci) }), label: c.rain.trend.label, chip: c.rain.trend.label === 'none' ? t('w.cert.noTrend') : undefined }
      : { text: t('w.why.noRain'), label: 'nodata' };
    const years: Why = {
      text: t('w.why.years', { n: v.droughtYears.length, y0: c.y0, years: v.droughtYears.join(', ') }),
      label: c.rainWitness ? 'confirmed' : 'hint',
      chip: t(c.rainWitness ? 'w.cert.twoSources' : 'w.cert.oneSource')
    };
    const reservoir: Why =
      worst && v.crisisYear !== null
        ? {
            text: t('w.why.reservoir', { year: v.crisisYear, name: t(`w.place.${worst.place}`), share: pctW(100 + (worst.crisisPct as number), 0, false) }),
            label: 'confirmed',
            chip: t('w.cert.measured')
          }
        : years;
    const noTrendRes: Why = c.reservoirs.length && c.reservoirs.every((r) => r.line.trend.label !== 'confirmed') ? { text: t('w.why.noTrendRes'), label: 'none', chip: t('w.cert.noTrend') } : years;
    const rainDown: Why = c.rain ? { text: t('w.why.rainDown', { rate: rateW(c.rain.def, c.rain.perDecade) }), label: c.rain.trend.label } : rainSteady;
    const demandUp: Why = c.demand ? { text: t('w.why.demandUp', { rate: rateW(c.demand.def, c.demand.perDecade) }), label: c.demand.trend.label } : unmeasured;
    return { unmeasured, aquifers, storage, residual, rainSteady, years, reservoir, noTrendRes, rainDown, demandUp };
  });

  const catalogue = $derived.by<Record<string, Group>>(() => {
    const w = whys;
    return {
      human: {
        id: 'human',
        items: [
          { key: 'w.opt.human.1', why: w.unmeasured },
          { key: 'w.opt.human.2', why: w.aquifers },
          { key: 'w.opt.human.3', why: w.residual },
          { key: 'w.opt.human.4', why: w.rainSteady },
          { key: 'w.opt.human.5', why: w.storage }
        ],
        avoid: ['w.avoid.human.1', 'w.avoid.human.2']
      },
      oneoff: {
        id: 'oneoff',
        items: [
          { key: 'w.opt.oneoff.1', why: w.years },
          { key: 'w.opt.oneoff.2', why: w.reservoir },
          { key: 'w.opt.oneoff.3', why: w.noTrendRes }
        ],
        avoid: ['w.avoid.oneoff.1', 'w.avoid.oneoff.2']
      },
      supply: {
        id: 'supply',
        items: ['w.opt.supply.1', 'w.opt.supply.2', 'w.opt.supply.3', 'w.opt.supply.4'].map((key) => ({ key, why: w.rainDown })),
        avoid: ['w.avoid.supply.1', 'w.avoid.supply.2']
      },
      demand: {
        id: 'demand',
        items: ['w.opt.demand.1', 'w.opt.demand.2', 'w.opt.demand.3'].map((key) => ({ key, why: w.demandUp })),
        avoid: ['w.avoid.demand.1', 'w.avoid.demand.2']
      }
    };
  });

  const active = $derived.by(() => {
    const ids: string[] = [];
    if (v.kind === 'supply' || v.kind === 'compound') ids.push('supply');
    if (v.kind === 'demand' || v.kind === 'compound') ids.push('demand');
    if (v.kind === 'human') ids.push('human');
    if (v.oneOff) ids.push('oneoff');
    return ids;
  });
  const idle = $derived(['supply', 'demand', 'human', 'oneoff'].filter((id) => !active.includes(id)));
  const idleReason = (id: string) => {
    if (id === 'supply') return t(c.rain ? 'w.opt.idle.supply' : 'w.opt.idle.noRain');
    if (id === 'demand') return t(c.demand ? 'w.opt.idle.demand' : 'w.opt.idle.noEvap');
    if (id === 'human') return t('w.opt.idle.human');
    return t(c.rain ? 'w.opt.idle.oneoff' : 'w.opt.idle.noRain');
  };

  // Options written for Nuevo León, each tied to a figure of this case.
  const local = $derived.by<Item[]>(() => {
    if (c.region !== 'nl' || !c.aquifers || !active.length) return [];
    const a = c.aquifers;
    const w = whys;
    const out: Item[] = [
      { key: 'w.opt.nl.1', why: w.unmeasured },
      { key: 'w.opt.nl.2', params: { neg: a.negative }, why: { text: t('w.why.deficitSum', { deficit: num(Math.abs(a.deficit), 1) }), label: 'confirmed', chip: t('w.cert.official') } },
      {
        key: 'w.opt.nl.3',
        why: {
          text: t(a.monterreyAllNegative ? 'w.why.mtyAll' : 'w.why.mtySome', { n: a.monterrey.length, list: a.monterrey.map((q) => `${q.name} ${signed(q.availability, 1)}`).join('; ') }),
          label: 'confirmed',
          chip: t('w.cert.official')
        }
      }
    ];
    if (v.crisisYear !== null && c.rainAnomaly) {
      out.push({
        key: 'w.opt.nl.4',
        params: { years: joinList(v.droughtYears.slice(-2).map(String)) },
        why: {
          text: t('w.why.anomaly', {
            year: v.crisisYear,
            a: pctW(Math.abs(valueAt(c.rainAnomaly, v.crisisYear) ?? NaN), 0, false),
            b: c.witnessAnomaly ? pctW(Math.abs(valueAt(c.witnessAnomaly, v.crisisYear) ?? NaN), 0, false) : '—'
          }),
          label: 'confirmed',
          chip: t('w.cert.twoSources')
        }
      });
      out.push({ key: 'w.opt.nl.5', why: w.reservoir });
    }
    if (soilGal && soilGal.trend.ok) out.push({ key: 'w.opt.nl.6', why: { text: t('w.why.soil', { rate: rateW(soilGal.def, soilGal.perDecade), pct: pctW(soilGal.pct, 1) }), label: soilGal.trend.label } });
    return out;
  });
</script>

{#snippet item(i: Item)}
  <li>
    <p class="what">{t(i.key, i.params)}</p>
    <div class="because">
      <p class="why"><span class="k">{t('w.opt.why')}</span>{i.why.text}</p>
      <CertaintyChip label={i.why.label} text={i.why.chip ?? ''} compact />
    </div>
  </li>
{/snippet}

<p class="fixed">{t('w.opt.note')}</p>

{#if !active.length}
  <div class="empty">
    <h3>{t('w.opt.none')}</h3>
    <p>{t('w.opt.noneText')}</p>
  </div>
{/if}

<div class="groups">
  {#each active as id (id)}
    {@const g = catalogue[id]}
    <div class="group">
      <header>
        <p class="kicker">{t('w.opt.because')}</p>
        <h3>{t(`w.opt.group.${g.id}`)}</h3>
      </header>
      <div class="body">
        <ul class="items">
          {#each g.items as i (i.key)}
            {@render item(i)}
          {/each}
        </ul>
        <div class="avoid">
          <h4>{t('w.opt.avoid')}</h4>
          <ul>
            {#each g.avoid as k (k)}
              <li><span class="x" aria-hidden="true">✕</span><span>{t(k)}</span></li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/each}

  {#if local.length}
    <div class="group">
      <header>
        <p class="kicker">{t('w.opt.because')}</p>
        <h3>{t('w.opt.group.nl')}</h3>
      </header>
      <div class="body">
        <ul class="items">
          {#each local as i (i.key)}
            {@render item(i)}
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</div>

{#if idle.length}
  <details class="idle">
    <summary class="more">{t('w.opt.idle', { n: idle.length })}</summary>
    <ul>
      {#each idle as id (id)}
        <li><strong>{t(`w.opt.group.${id}`)}.</strong> {idleReason(id)} <span class="rest">{catalogue[id].items.map((i) => t(i.key, i.params)).join(' ')}</span></li>
      {/each}
    </ul>
  </details>
{/if}

<style>
  .fixed {
    color: var(--ink-2);
    max-width: 78ch;
  }
  .empty {
    display: grid;
    gap: 8px;
    border-top: 1px solid var(--border);
    padding-top: 22px;
  }
  .groups {
    display: grid;
    gap: var(--gap-block);
  }
  /* One reason of the verdict per block: the reason on the left, what follows from it on the right. */
  .group {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 9fr);
    gap: 20px 64px;
    align-items: start;
    border-top: 1px solid var(--border-strong);
    padding-top: 20px;
    min-width: 0;
  }
  .group header {
    display: grid;
    gap: 8px;
  }
  .group h3 {
    font-size: clamp(22px, 2.3vw, 28px);
    letter-spacing: -0.025em;
    line-height: 1.12;
  }
  .items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
  }
  .items li {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 8px 32px;
    align-items: start;
    padding: 16px 0;
    border-bottom: 1px solid var(--border);
  }
  .items li:first-child {
    padding-top: 2px;
  }
  .what {
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.005em;
  }
  .because {
    display: grid;
    gap: 8px;
    justify-items: start;
  }
  .why {
    font-size: var(--fs-small);
    color: var(--ink-2);
    line-height: 1.5;
  }
  .k {
    color: var(--ink);
    font-weight: 500;
    margin-right: 6px;
  }
  .k::after {
    content: ':';
  }
  .avoid {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 8px 32px;
    padding-top: 16px;
  }
  .avoid h4 {
    font-size: var(--fs-small);
    font-weight: 500;
    color: var(--ink-2);
  }
  .avoid ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
    font-size: var(--fs-small);
  }
  .avoid li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
    align-items: baseline;
  }
  .x {
    font-size: 12px;
    color: var(--muted);
  }
  details.idle {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  details.idle ul {
    margin: 12px 0 0;
    padding-left: 20px;
    display: grid;
    gap: 8px;
    max-width: 96ch;
  }
  details.idle strong {
    color: var(--ink);
  }
  @media (max-width: 860px) {
    .group,
    .items li,
    .avoid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
