<script lang="ts">
  // The water case: a region's water treated as a bank account. Every suspect of the budget is
  // questioned with the same two tests, and fixed rules turn the answers into a verdict.
  // The idea and the rules are the team's; code written with AI assistance (Claude).
  import { fmt } from '../catalog';
  import { dete, openDete } from '../dete/dete.svelte';
  import { t } from '../i18n';
  import { setConcern, setRegion, setView, setWaterPeriod, ui } from '../state.svelte';
  import { toCases } from '../ui/scroll';
  import BalanceChart, { type BalanceRow } from './BalanceChart.svelte';
  import { analyzeCase, monthlyProfile, type LineResult } from './case';
  import { CONCERN_ORDER, CONCERNS, DROUGHT_YEAR_PCT, REGION_ORDER, REGIONS, SUSPECTS } from './catalog';
  import CertaintyChip from './CertaintyChip.svelte';
  import CrisisChart from './CrisisChart.svelte';
  import { WATER_RULES, valueAt, type Certainty } from './engine';
  import { ciW, lineName, num, pctW, rateW, signed, valueW } from './format';
  import GlobalCompare from './GlobalCompare.svelte';
  import Options from './Options.svelte';
  import SuspectCard from './SuspectCard.svelte';
  import type { WaterData } from './types';
  import WaterFile from './WaterFile.svelte';
  import WorldReach from '../world/WorldReach.svelte';

  let { data }: { data: WaterData } = $props();

  const def = $derived(REGIONS[ui.region]);
  const region = $derived(data.regions[ui.region]);
  const c = $derived(analyzeCase(data, ui.region, ui.wy0, ui.wy1));
  const v = $derived(c.verdict);
  const ordered = $derived(CONCERN_ORDER[ui.concern].map((id) => c.suspects.find((q) => q.id === id)!));
  const nSeries = $derived(Object.values(data.regions).reduce((q, r) => q + Object.keys(r.series).length, 0));
  const nAquifers = $derived(data.regions.nl.aquifers.length);
  const loaded = $derived(SUSPECTS.filter((sd) => sd.lines.some((l) => region.series[l.id])).map((sd) => t(`w.sus.${sd.id}.name`).toLowerCase()));

  // ---- period
  const MIN_SPAN = WATER_RULES.minSpan;
  function onFrom(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const val = Math.min(Number(el.value), ui.wy1 - MIN_SPAN + 1);
    el.value = String(val);
    setWaterPeriod(val, ui.wy1);
  }
  function onTo(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const val = Math.max(Number(el.value), ui.wy0 + MIN_SPAN - 1);
    el.value = String(val);
    setWaterPeriod(ui.wy0, val);
  }
  const presets = $derived(
    [
      { key: 'full', a: def.y0, b: def.y1 },
      { key: 'grace', a: 2003, b: def.y1 },
      { key: 'mid', a: 2005, b: 2024 },
      { key: 'last15', a: def.y1 - 14, b: def.y1 }
    ].filter((p, i, all) => p.a >= def.y0 && p.b <= def.y1 && all.findIndex((q) => q.a === p.a && q.b === p.b) === i)
  );

  // ---- verdict sentences
  const missingText = $derived(v.missing.map((k) => t(`w.missing.${k}`)).join(', '));
  const headline = $derived.by(() => {
    const p = { year: v.crisisYear ?? '' };
    if (v.kind === 'human') {
      if (v.missing.includes('rain') || v.missing.includes('evap')) return t('w.v.head.human.incomplete');
      return v.oneOff ? t('w.v.head.human.oneoff', p) : t('w.v.head.human');
    }
    if (v.kind === 'none') return v.oneOff ? t('w.v.head.none.oneoff', p) : t(v.certainty === 'nodata' ? 'w.v.head.nodata' : 'w.v.head.none');
    return t(`w.v.head.${v.kind}`);
  });
  const explain = $derived.by(() => {
    if (v.kind === 'human') {
      if (v.human === 'backed') return t('w.v.sub.human.backed', { neg: c.aquifers?.negative ?? 0, total: c.aquifers?.total ?? 0 });
      if (v.missing.includes('rain') || v.missing.includes('evap')) return t('w.v.sub.human.incomplete', { missing: missingText });
      return t('w.v.sub.human.possible');
    }
    if (v.kind === 'none') return t('w.v.sub.none', { min: WATER_RULES.minSpan });
    return t(`w.v.sub.${v.kind}`, { rain: c.rain ? rateW(c.rain.def, c.rain.perDecade) : '—', demand: c.demand ? rateW(c.demand.def, c.demand.perDecade) : '—' });
  });
  const badgeText = $derived(
    v.kind === 'human'
      ? t(v.human === 'backed' ? 'w.v.badge.backed' : 'w.v.badge.possible')
      : v.kind === 'none'
        ? t(v.certainty === 'nodata' ? 'w.cert.nodata' : 'w.v.badge.none')
        : t(`w.cert.${v.certainty}`)
  );

  const worst = $derived([...c.reservoirs].filter((r) => r.crisisPct !== null).sort((a, b) => (a.crisisPct as number) - (b.crisisPct as number))[0] ?? null);
  const anomalyAt = (yr: number | null) => (yr !== null && c.rainAnomaly ? valueAt(c.rainAnomaly, yr) : null);
  const witnessAt = (yr: number | null) => (yr !== null && c.witnessAnomaly ? valueAt(c.witnessAnomaly, yr) : null);

  const concernAnswer = $derived.by(() => {
    if (ui.concern === 'reservoirs') {
      if (!c.reservoirs.length) return t('w.v.concern.reservoirs.nodata');
      if (worst && v.crisisYear !== null)
        return t('w.v.concern.reservoirs.crisis', {
          year: v.crisisYear,
          name: t(`w.place.${worst.place}`),
          share: pctW(100 + (worst.crisisPct as number), 0, false),
          rain: pctW(Math.abs(anomalyAt(v.crisisYear) ?? NaN), 0, false),
          n: worst.line.trend.n
        });
      return t('w.v.concern.reservoirs.calm');
    }
    if (ui.concern === 'wells') {
      if (!c.storage || c.storage.trend.label === 'nodata') return t('w.v.concern.wells.nodata');
      if (c.storage.trend.label !== 'confirmed' || c.storage.trend.dir >= 0) return t('w.v.concern.wells.calm');
      const parts = [t('w.v.concern.wells.falling', { rate: rateW(c.storage.def, c.storage.perDecade) })];
      if (v.notSupply) parts.push(t('w.v.concern.wells.notRain'));
      if (c.aquifers) parts.push(t('w.v.concern.wells.official', { neg: c.aquifers.negative, total: c.aquifers.total }));
      return parts.join(' ');
    }
    if (!c.rain || c.rain.trend.label === 'nodata') return t('w.v.concern.drought.nodata');
    if (c.rain.trend.label === 'confirmed' && c.rain.trend.dir < 0) return t('w.v.concern.drought.falling', { rate: rateW(c.rain.def, c.rain.perDecade) });
    if (v.droughtYears.length) return t('w.v.concern.drought.years', { years: v.droughtYears.join(', ') });
    return t('w.v.concern.drought.calm');
  });

  const ruleEvidence = $derived.by<Record<string, string>>(() => ({
    rain: c.rain && c.rain.trend.ok ? `${rateW(c.rain.def, c.rain.perDecade)} · ${t('w.fact.ci')} ${ciW(c.rain.def, c.rain.ci)}` : t('w.rule.notLoaded'),
    demand: c.demand && c.demand.trend.ok ? `${rateW(c.demand.def, c.demand.perDecade)} · ${t('w.fact.ci')} ${ciW(c.demand.def, c.demand.ci)}` : t('w.rule.notLoaded'),
    storage: c.storage && c.storage.trend.ok ? `${rateW(c.storage.def, c.storage.perDecade)} · ${t('w.fact.ci')} ${ciW(c.storage.def, c.storage.ci)}` : t('w.rule.notLoaded'),
    residual: c.rainFit ? `${rateW(c.storage!.def, c.rainFit.trend.sen * 10)} · R² ${fmt(c.rainFit.r2, 2, ui.lang)}` : t('w.rule.notLoaded'),
    official: c.aquifers ? t('w.rule.officialEv', { neg: c.aquifers.negative, total: c.aquifers.total }) : t('w.rule.notLoaded'),
    year: !c.rain ? t('w.rule.notLoaded') : v.droughtYears.length ? v.droughtYears.join(', ') : t('w.rule.noYear')
  }));

  // ---- exhibits of the verdict card
  type Exhibit = { key: string; value: string; label: Certainty; dir: 1 | -1 | 0; note: string; text?: string };
  const exhibits = $derived.by<Exhibit[]>(() => {
    const line = (key: string, l: LineResult | null, note: string): Exhibit =>
      l && l.trend.ok
        ? { key, value: rateW(l.def, l.perDecade), label: l.trend.label, dir: l.trend.dir, note }
        : { key, value: t('w.ex.notLoaded'), label: 'nodata', dir: 0, note: t('w.ex.notLoadedNote') };
    const rainSuspect = c.suspects.find((q) => q.id === 'rain')!;
    return [
      line('rain', c.rain, c.rain ? t('w.ex.rainNote', { agree: rainSuspect.agree, others: rainSuspect.others }) : ''),
      line('demand', c.demand, c.demand ? t(c.demand.trend.label === 'confirmed' && c.demand.trend.dir < 0 ? 'w.ex.demandDown' : 'w.ex.demandOther') : ''),
      line('storage', c.storage, c.rainFit ? t('w.ex.storageNote', { rate: rateW(c.storage!.def, c.rainFit.trend.sen * 10) }) : t('w.ex.storagePlain')),
      c.aquifers
        ? {
            key: 'official',
            value: t('w.ex.officialValue', { neg: c.aquifers.negative, total: c.aquifers.total }),
            label: 'confirmed',
            dir: 0,
            note: t('w.ex.officialNote', { deficit: num(Math.abs(c.aquifers.deficit), 1) }),
            text: t('w.cert.official')
          }
        : { key: 'official', value: t('w.ex.notLoaded'), label: 'nodata', dir: 0, note: t('w.ex.officialMissing') }
    ];
  });

  // ---- balance: terms that share a unit, on one axis
  const place = (l: LineResult) => `${t(`w.place.${l.def.place}`)} · ${l.def.product}`;
  const row = (l: LineResult | undefined, label: string, k = 1): BalanceRow | null =>
    l
      ? {
          id: l.id,
          label,
          sub: place(l),
          value: l.trend.ok ? l.perDecade * k : NaN,
          lo: l.ci[0] * k,
          hi: l.ci[1] * k,
          certainty: l.trend.label,
          dir: l.trend.dir,
          decimals: Math.abs(l.perDecade * k) < 10 ? 1 : 0
        }
      : null;
  const flows = $derived(
    [
      row(c.lines.rain_imerg, t('w.bal.rain')),
      row(c.lines.rain_chirps, t('w.bal.rain')),
      row(c.lines.et_gldas_mty, t('w.bal.et')),
      row(c.lines.et_gldas_gal, t('w.bal.et')),
      row(c.lines.pet_gldas_mty, t('w.bal.pet')),
      row(c.lines.pet_gldas_gal, t('w.bal.pet')),
      row(c.lines.runoff_gldas_mty, t('w.bal.runoff')),
      row(c.lines.runoff_gldas_gal, t('w.bal.runoff'))
    ].filter((r): r is BalanceRow => r !== null)
  );
  const stores = $derived(
    [row(c.lines.tws_grace, t('w.bal.tws'), 10), row(c.lines.soil_gldas_mty, t('w.bal.soil')), row(c.lines.soil_gldas_gal, t('w.bal.soil'))].filter(
      (r): r is BalanceRow => r !== null
    )
  );
  // The note under the stores holds only while total storage falls more than either soil cell.
  const storeNote = $derived.by(() => {
    const tws = stores.find((r) => r.id === 'tws_grace');
    const soil = stores.filter((r) => r.id !== 'tws_grace' && Number.isFinite(r.value));
    return tws && tws.certainty === 'confirmed' && tws.dir < 0 && soil.length > 0 && soil.every((r) => Math.abs(r.value) < Math.abs(tws.value)) ? t('w.bal.storeNote') : '';
  });
  const twoPlaces = $derived(
    (['temp', 'pet', 'et', 'soil', 'runoff', 'rain'] as const)
      .map((k) => ({ k, mty: c.lines[`${k}_gldas_mty`], gal: c.lines[`${k}_gldas_gal`] }))
      .filter((r) => r.mty && r.gal)
  );
  const opposite = $derived(twoPlaces.filter((r) => r.mty.trend.label !== r.gal.trend.label || (r.mty.trend.label === 'confirmed' && r.mty.trend.dir !== r.gal.trend.dir)));

  // ---- the crisis year
  let pickedYear = $state<number | null>(null);
  const crisis = $derived(pickedYear !== null && v.droughtYears.includes(pickedYear) ? pickedYear : v.crisisYear);
  const profile = $derived(crisis !== null ? monthlyProfile(region.monthly.rain_imerg, crisis) : null);
  const resAt = $derived(
    crisis === null
      ? []
      : c.reservoirs
          .map((r) => ({ r, value: valueAt(r.line.full, crisis) }))
          .filter((x): x is { r: (typeof c.reservoirs)[number]; value: number } => x.value !== null)
          .map((x) => ({ ...x, share: (x.value / x.r.mean) * 100 }))
  );

  const sortedAquifers = $derived([...region.aquifers].sort((a, b) => a.availability - b.availability));
  const maxAbs = $derived(Math.max(1, ...region.aquifers.map((a) => Math.abs(a.availability))));
</script>

{#snippet head(id: string, n: string, key: string)}
  <header class="sec-head" {id}>
    <p class="kicker">{t(`${key}.kicker`, { n })}</p>
    <h2>{t(`${key}.title`)}</h2>
    <p class="lead">{t(`${key}.lead`)}</p>
  </header>
{/snippet}

<section class="hero" id="top">
  <div class="wrap hero-in">
    <p class="kicker">{t('hero.kicker')}</p>
    <h2 class="case-title">{t('w.hero.title')}</h2>
    <p class="lead">{t('w.hero.lead')}</p>
    <p class="equation" aria-label={t('w.hero.eqAria')}>
      <span class="eq-store">{t('w.hero.eq.store')}</span>
      <span class="op">=</span>
      <span class="eq-in">{t('w.hero.eq.rain')}</span>
      <span class="op">−</span>
      <span class="eq-out">{t('w.hero.eq.evap')}</span>
      <span class="op">−</span>
      <span class="eq-out">{t('w.hero.eq.runoff')}</span>
      <span class="op">−</span>
      <span class="eq-out q">{t('w.hero.eq.human')}</span>
    </p>
    <div class="cta">
      <a class="btn primary" href="#w-select">{t('w.hero.cta')} <span aria-hidden="true">↓</span></a>
      <a class="btn" href="#w-verdict">{t('w.hero.cta2')}</a>
    </div>
    <dl class="stats">
      <div><dt>{nSeries}</dt><dd>{t('w.hero.stat1')}</dd></div>
      <div><dt>7</dt><dd>{t('w.hero.stat2')}</dd></div>
      <div><dt>2</dt><dd>{t('w.hero.stat3')}</dd></div>
      <div><dt>{nAquifers}</dt><dd>{t('w.hero.stat4')}</dd></div>
    </dl>
  </div>
</section>

<div class="wrap water">
  <!-- 1 · Selector: one row above everything it scopes -->
  {@render head('w-select', '1', 'w.sel')}
  <div class="selector panel">
    <div class="group">
      <h3>{t('w.sel.region')}</h3>
      <div class="chips" role="group" aria-label={t('w.sel.region')}>
        {#each REGION_ORDER as id (id)}
          <button class="chipbtn" aria-pressed={ui.region === id} onclick={() => setRegion(id)}>{t(`w.region.${id}.name`)}</button>
        {/each}
      </div>
      <p class="small">{t(`w.region.${ui.region}.desc`)}</p>
      <p class="small muted">{t('w.sel.loaded', { n: Object.keys(region.series).length, list: loaded.join(', ') })}</p>
      <p class="small muted">{t('w.sel.more')} <a href="#w-world">{t('wr.sel.link')} <span aria-hidden="true">↓</span></a></p>
    </div>
    <div class="group">
      <h3>{t('w.sel.period')}</h3>
      <div class="sliders">
        <label for="w-from">{t('s3.from')} <output>{ui.wy0}</output></label>
        <input id="w-from" type="range" min={def.y0} max={def.y1} step="1" value={ui.wy0} oninput={onFrom} />
        <label for="w-to">{t('s3.to')} <output>{ui.wy1}</output></label>
        <input id="w-to" type="range" min={def.y0} max={def.y1} step="1" value={ui.wy1} oninput={onTo} />
      </div>
      <div class="chips">
        {#each presets as p (p.key)}
          <button class="btn small-btn" aria-pressed={ui.wy0 === p.a && ui.wy1 === p.b} onclick={() => setWaterPeriod(p.a, p.b)}>{t(`w.sel.preset.${p.key}`, { y0: p.a, y1: p.b })}</button>
        {/each}
      </div>
      <p class="small muted">{t('w.sel.periodHelp', { min: WATER_RULES.minSpan })}</p>
    </div>
    <div class="group">
      <h3>{t('w.sel.concern')}</h3>
      <div class="chips" role="group" aria-label={t('w.sel.concern')}>
        {#each CONCERNS as id (id)}
          <button class="chipbtn" aria-pressed={ui.concern === id} onclick={() => setConcern(id)}>{t(`w.concern.${id}`)}</button>
        {/each}
      </div>
      <p class="small muted">{t('w.sel.concernHelp')}</p>
    </div>
  </div>

  <!-- 2 · Case file: the verdict -->
  {@render head('w-verdict', '2', 'w.vsec')}
  <div class="verdict card" aria-live="polite">
    <p class="kicker">{t('w.v.kicker', { region: t(`w.region.${ui.region}.name`), y0: c.y0, y1: c.y1 })}</p>
    <p class="vhead">{headline}</p>
    <div class="badges">
      <CertaintyChip label={v.certainty} text={badgeText} />
      {#if v.missing.length}
        <CertaintyChip label="nodata" text={t('w.v.badge.missing', { missing: missingText })} />
      {/if}
    </div>
    <p class="vsub">{explain}</p>
    {#if v.notSupply || v.notDemand}
      <ul class="ruled">
        {#if v.notSupply && c.rain}
          <li><span class="x" aria-hidden="true">✕</span>{t('w.v.notSupply', { rate: rateW(c.rain.def, c.rain.perDecade), ci: ciW(c.rain.def, c.rain.ci) })}</li>
        {/if}
        {#if v.notDemand && c.demand}
          <li>
            <span class="x" aria-hidden="true">✕</span>{t(c.demand.trend.label === 'confirmed' && c.demand.trend.dir < 0 ? 'w.v.notDemand.falling' : 'w.v.notDemand', {
              rate: rateW(c.demand.def, c.demand.perDecade)
            })}
          </li>
        {/if}
      </ul>
    {/if}

    <div class="exhibits">
      {#each exhibits as e (e.key)}
        <div class="exhibit">
          <span class="small">{t(`w.ex.${e.key}`)}</span>
          <strong>{e.value}</strong>
          <CertaintyChip label={e.label} dir={e.dir} text={e.text ?? ''} compact />
          <span class="small muted">{e.note}</span>
        </div>
      {/each}
    </div>

    <p class="answer"><strong>{t(`w.concern.${ui.concern}`)}.</strong> {concernAnswer}</p>

    <details class="rules">
      <summary>{t('w.rule.summary')}</summary>
      <div class="scroll-x">
        <table class="data rtable">
          <thead>
            <tr><th>{t('w.rule.question')}</th><th>{t('w.rule.answer')}</th><th>{t('w.rule.evidence')}</th></tr>
          </thead>
          <tbody>
            {#each v.rules as r (r.id)}
              <tr>
                <td>{t(`w.rule.${r.id}`)}</td>
                <td><span class="state {r.state}">{t(`w.rule.state.${r.state}`)}</span></td>
                <td>{ruleEvidence[r.id]}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="small">{t('w.rule.legend')}</p>
    </details>

    <!-- DE-T, the case assistant: only when its server answers. -->
    {#if dete.status === 'on'}
      <div class="dete-cta">
        <p>{t('dete.verdict.text')}</p>
        <button class="btn small-btn" onclick={() => openDete()}>{t('dete.open')} <span aria-hidden="true">→</span></button>
      </div>
    {/if}
  </div>

  <!-- 3 · Suspects -->
  {@render head('w-suspects', '3', 'w.ssec')}
  <p class="small order-note">{t('w.ssec.order', { concern: t(`w.concern.${ui.concern}`).toLowerCase() })}</p>
  <div class="suspects">
    {#each ordered as s (s.id)}
      <SuspectCard {s} {c} {region} />
    {/each}
  </div>

  <!-- 4 · Balance -->
  {@render head('w-balance', '4', 'w.bsec')}
  {#if flows.length || stores.length}
    <div class="balances">
      {#if flows.length}
        <BalanceChart rows={flows} unit={t('w.bal.flowUnit')} title={t('w.bal.flows')} />
      {/if}
      {#if stores.length}
        <BalanceChart rows={stores} unit={t('w.bal.storeUnit')} title={t('w.bal.stores')} note={storeNote} />
      {/if}
    </div>
  {/if}
  {#if twoPlaces.length}
    <div class="panel places">
      <h3>{t('w.where.title')}</h3>
      <p class="small">{t('w.where.lead')}</p>
      <div class="scroll-x">
        <table class="data ptable">
          <thead>
            <tr><th>{t('w.where.variable')}</th><th>{t('w.place.mty')}</th><th>{t('w.place.gal')}</th></tr>
          </thead>
          <tbody>
            {#each twoPlaces as r (r.k)}
              <tr class:diff={opposite.includes(r)}>
                <td>{t(`w.where.${r.k}`)}</td>
                {#each [r.mty, r.gal] as l (l.id)}
                  <td data-label={t(`w.place.${l.def.place}`)}>
                    <span class="rate">{rateW(l.def, l.perDecade)}</span>
                    <CertaintyChip label={l.trend.label} dir={l.trend.dir} compact />
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="note">{t(opposite.length ? 'w.where.differ' : 'w.where.same', { n: opposite.length, total: twoPlaces.length })}</p>
    </div>
  {:else}
    <p class="note">{t('w.bsec.missing')}</p>
  {/if}

  <!-- 5 · The crisis year -->
  {@render head('w-crisis', '5', 'w.csec')}
  {#if !c.rain}
    <p class="note">{t('w.crisis.noRain')}</p>
  {:else if crisis === null}
    <p class="note">{t('w.crisis.none', { pct: Math.abs(DROUGHT_YEAR_PCT) })}</p>
  {:else}
    <div class="crisis card">
      <div class="crisis-top">
        <div class="years" role="group" aria-label={t('w.crisis.pick')}>
          <span class="small">{t('w.crisis.pick')}</span>
          {#each v.droughtYears as yr (yr)}
            <button class="chipbtn" aria-pressed={crisis === yr} onclick={() => (pickedYear = yr)}>{yr}</button>
          {/each}
        </div>
        <p class="small muted">{t('w.crisis.rule', { pct: Math.abs(DROUGHT_YEAR_PCT) })}</p>
      </div>
      <div class="tiles">
        <div class="tile">
          <span class="small">{t('w.crisis.rainMain', { source: lineName(c.rain) })}</span>
          <strong>{pctW(anomalyAt(crisis), 1)}</strong>
          <span class="small muted">{t('w.crisis.vsMean', { value: valueW(c.rain.def, valueAt(c.rain.full, crisis)), mean: valueW(c.rain.def, c.rain.full.values.reduce((q, x) => q + x, 0) / c.rain.full.values.length) })}</span>
        </div>
        {#if c.rainWitness && witnessAt(crisis) !== null}
          <div class="tile">
            <span class="small">{t('w.crisis.rainMain', { source: lineName(c.rainWitness) })}</span>
            <strong>{pctW(witnessAt(crisis), 1)}</strong>
            <span class="small muted">{t('w.crisis.witness')}</span>
          </div>
        {/if}
        {#each resAt as x (x.r.line.id)}
          <div class="tile">
            <span class="small">{t('w.crisis.reservoir', { name: t(`w.place.${x.r.place}`) })}</span>
            <strong>{pctW(x.share - 100, 0)}</strong>
            <span class="small muted">{t('w.crisis.vsMean', { value: valueW(x.r.line.def, x.value, false, 1), mean: valueW(x.r.line.def, x.r.mean, false, 1) })}</span>
          </div>
        {/each}
      </div>
      <div class="crisis-charts">
        {#if profile}
          <div>
            <h3>{t('w.crisis.monthsTitle', { year: crisis })}</h3>
            <CrisisChart year={crisis} values={profile.year} usual={profile.usual} source={lineName(c.rain)} />
          </div>
        {/if}
        {#if resAt.length}
          <div>
            <h3>{t('w.crisis.resTitle', { year: crisis })}</h3>
            <div class="resbars" role="img" aria-label={t('w.crisis.resAria', { year: crisis })}>
              {#each resAt as x (x.r.line.id)}
                <div class="resrow">
                  <div class="rname">{t(`w.place.${x.r.place}`)}</div>
                  <div class="rtrack">
                    <div class="rbar" style="width: {Math.min(100, x.share / 1.3)}%"></div>
                    <span class="rmark" style="left: {100 / 1.3}%"></span>
                  </div>
                  <div class="rval"><strong>{pctW(x.share, 0, false)}</strong> {t('w.crisis.ofUsual')}</div>
                </div>
              {/each}
              <p class="small muted">{t('w.crisis.resLegend')}</p>
            </div>
            <p class="small">{t('w.crisis.resNote')}</p>
          </div>
        {/if}
      </div>
      <p class="caption">{t(v.oneOff ? 'w.crisis.caption' : 'w.crisis.captionTrend', { years: v.droughtYears.join(', ') })}</p>
    </div>
  {/if}

  <aside class="bridge panel">
    <div>
      <h3>{t('w.bridge.title')}</h3>
      <p>{t('w.bridge.text')}</p>
    </div>
    <button class="btn" onclick={() => { setView('city'); toCases(); }}>{t('w.bridge.cta')} <span aria-hidden="true">→</span></button>
  </aside>

  <!-- 6 · Independent evidence -->
  {@render head('w-evidence', '6', 'w.esec')}
  {#if c.aquifers}
    <div class="evidence">
      <div class="tiles">
        <div class="tile">
          <span class="small">{t('w.ev.deficitCount')}</span>
          <strong>{c.aquifers.negative} / {c.aquifers.total}</strong>
          <span class="small muted">{t('w.ev.deficitCountNote')}</span>
        </div>
        <div class="tile">
          <span class="small">{t('w.ev.deficitSum')}</span>
          <strong>{signed(c.aquifers.deficit, 1)}</strong>
          <span class="small muted">{t('w.ev.hm3')}</span>
        </div>
        <div class="tile">
          <span class="small">{t('w.ev.mty')}</span>
          <strong>{c.aquifers.monterrey.filter((a) => a.availability < 0).length} / {c.aquifers.monterrey.length}</strong>
          <span class="small muted">{t('w.ev.mtyNote')}</span>
        </div>
      </div>
      <div class="panel">
        <h3>{t('w.ev.tableTitle')}</h3>
        <p class="small">{t('w.ev.tableLead')}</p>
        <div class="scroll-x">
          <table class="data atable">
            <thead>
              <tr>
                <th>{t('w.ev.aquifer')}</th>
                <th>{t('w.ev.recharge')}</th>
                <th>{t('w.ev.concessioned')}</th>
                <th>{t('w.ev.availability')}</th>
                <th class="barcol">{t('w.ev.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {#each sortedAquifers as a (a.id)}
                <tr class:mty={a.monterrey}>
                  <td>
                    <strong>{a.name}</strong>
                    {#if a.monterrey}<span class="tag">{t('w.ev.suppliesMty')}</span>{/if}
                  </td>
                  <td data-label={t('w.ev.recharge')}>{num(a.recharge, 1)}</td>
                  <td data-label={t('w.ev.concessioned')}>{num(a.concessioned, 1)}</td>
                  <td data-label={t('w.ev.availability')}><strong>{signed(a.availability, 1)}</strong> <span class="state {a.availability < 0 ? 'yes' : 'no'}">{t(a.availability < 0 ? 'w.ev.deficit' : 'w.ev.available')}</span></td>
                  <td class="barcol" aria-hidden="true">
                    <span class="abar">
                      <span class="afill" class:neg={a.availability < 0} style="width: {(Math.abs(a.availability) / maxAbs) * 50}%; {a.availability < 0 ? 'right' : 'left'}: 50%"></span>
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="small muted">{t('w.ev.tableNote')}</p>
      </div>
      {#if c.lossHm3 !== null && c.storage}
        <p class="note">
          {t('w.ev.magnitude', {
            rate: num(Math.abs(c.storage.trend.sen), 2),
            area: num(def.areaKm2, 0),
            loss: num(c.lossHm3, 0),
            deficit: num(Math.abs(c.aquifers.deficit), 0)
          })}
        </p>
      {/if}
      {#if c.reservoirs.length}
        <div class="panel">
          <h3>{t('w.ev.resTitle')}</h3>
          <div class="scroll-x">
            <table class="data rtable2">
              <thead>
                <tr><th>{t('w.ev.reservoir')}</th><th>{t('w.ev.resMean')}</th><th>{t('w.tbl.rate')}</th><th>{t('w.tbl.ci')}</th><th>{t('w.tbl.label')}</th></tr>
              </thead>
              <tbody>
                {#each c.reservoirs as r (r.line.id)}
                  <tr>
                    <td><strong>{t(`w.place.${r.place}`)}</strong></td>
                    <td data-label={t('w.ev.resMean')}>{valueW(r.line.def, r.mean, false, 1)}</td>
                    <td data-label={t('w.tbl.rate')}>{rateW(r.line.def, r.line.perDecade)}</td>
                    <td data-label={t('w.tbl.ci')}>{ciW(r.line.def, r.line.ci)}</td>
                    <td><CertaintyChip label={r.line.trend.label} dir={r.line.trend.dir} compact /></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <p class="small muted">{t('w.ev.resNote')}</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="panel">
      <h3>{t('w.ev.none')}</h3>
      <p>{t('w.ev.noneText')}</p>
    </div>
  {/if}

  <!-- 7 · Options -->
  {@render head('w-options', '7', 'w.osec')}
  <Options {c} />

  <!-- 8 · Global comparison -->
  {@render head('w-global', '8', 'w.gsec')}
  <GlobalCompare {data} />

  <!-- 9 · Scale: the same case in any country -->
  <WorldReach {data} n="9" />

  <WaterFile {data} {c} />
</div>

<style>
  .hero {
    padding: clamp(36px, 7vw, 76px) 0 clamp(24px, 4vw, 40px);
  }
  .hero-in {
    display: grid;
    gap: 18px;
  }
  .case-title {
    font-size: clamp(34px, 6vw, 62px);
    max-width: 18ch;
    letter-spacing: -0.03em;
    line-height: 1.02;
  }
  .hero .lead {
    font-size: clamp(17px, 2vw, 20px);
  }
  .equation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    font-weight: 650;
    font-size: clamp(14px, 1.6vw, 16.5px);
  }
  .equation span:not(.op) {
    padding: 6px 12px;
    border-radius: 9px;
    border: 1.5px solid var(--border-strong);
    background: var(--surface);
  }
  .equation .eq-store {
    border-color: var(--ink);
  }
  .equation .q {
    border-style: dashed;
  }
  .op {
    color: var(--ink-2);
    font-size: 1.2em;
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 14px 0 0;
    border-top: 1px solid var(--grid);
  }
  .stats div {
    padding: 16px 18px 4px 0;
  }
  .stats div + div {
    padding-left: 18px;
    border-left: 1px solid var(--grid);
  }
  .stats dt {
    font-size: clamp(26px, 3.4vw, 36px);
    font-weight: 750;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .stats dd {
    margin: 4px 0 0;
    font-size: 13.5px;
    color: var(--ink-2);
    line-height: 1.35;
    max-width: 24ch;
  }
  .water {
    display: grid;
    gap: 18px;
    padding-bottom: 8px;
  }
  .water > :global(*) {
    min-width: 0;
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
  .selector {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px 28px;
  }
  .group {
    display: grid;
    gap: 10px;
    align-content: start;
  }
  .group + .group {
    border-left: 1px solid var(--grid);
    padding-left: 28px;
  }
  .group h3 {
    font-size: 13px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-2);
    margin: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .chipbtn {
    padding: 7px 13px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    text-align: left;
  }
  .chipbtn[aria-pressed='true'] {
    background: var(--ink);
    color: var(--page);
    border-color: var(--ink);
  }
  .btn[aria-pressed='true'] {
    border-color: var(--ink);
    box-shadow: 0 0 0 1px var(--ink);
  }
  .sliders {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 14px;
    align-items: center;
  }
  .sliders label {
    font-weight: 600;
    font-size: 14px;
    color: var(--ink-2);
    white-space: nowrap;
  }
  .sliders output {
    display: inline-block;
    min-width: 3em;
    font-size: 18px;
    font-weight: 750;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    margin-left: 4px;
  }
  .verdict {
    padding: clamp(18px, 3vw, 32px);
    display: grid;
    gap: 14px;
    justify-items: start;
  }
  .vhead {
    font-size: clamp(26px, 4.2vw, 44px);
    font-weight: 760;
    letter-spacing: -0.025em;
    line-height: 1.08;
    max-width: 24ch;
    text-wrap: balance;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .badges :global(.cchip) {
    white-space: normal;
  }
  .vsub {
    font-size: clamp(17px, 2vw, 20px);
    line-height: 1.42;
    max-width: 62ch;
  }
  .ruled {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
    color: var(--ink-2);
    font-size: 15.5px;
  }
  .ruled li {
    display: flex;
    gap: 9px;
    align-items: baseline;
  }
  .x {
    font-weight: 800;
    color: var(--ink);
  }
  .exhibits {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .exhibit,
  .tile {
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface-2);
    padding: 13px 15px;
    display: grid;
    gap: 6px;
    justify-items: start;
    align-content: start;
    min-width: 0;
  }
  .exhibit strong {
    font-size: 19px;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }
  .tile strong {
    font-size: clamp(26px, 3.4vw, 34px);
    font-weight: 760;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
  .answer {
    border-left: 3px solid var(--ink);
    padding: 4px 0 4px 14px;
    max-width: 74ch;
    font-size: 16px;
  }
  details.rules {
    width: 100%;
    border-top: 1px solid var(--grid);
    padding-top: 12px;
  }
  .dete-cta {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 16px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--accent-wash);
    font-size: 14.5px;
    color: var(--ink-2);
  }
  .dete-cta p {
    max-width: 64ch;
  }
  details.rules summary {
    cursor: pointer;
    font-weight: 650;
    color: var(--accent-ink);
    width: fit-content;
  }
  .rtable {
    margin: 10px 0;
  }
  .rtable td,
  .rtable th {
    text-align: left;
  }
  .state {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--border-strong);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .state.yes {
    background: var(--ink);
    color: var(--page);
    border-color: var(--ink);
  }
  .state.unknown {
    border-style: dashed;
  }
  .order-note {
    margin-top: -6px;
  }
  .suspects {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    align-items: start;
  }
  .balances {
    display: grid;
    gap: 16px;
  }
  .places {
    display: grid;
    gap: 10px;
  }
  .ptable td,
  .ptable th {
    text-align: left;
  }
  .ptable td {
    vertical-align: middle;
  }
  .ptable .rate {
    display: inline-block;
    min-width: 13ch;
    font-variant-numeric: tabular-nums;
    margin-right: 6px;
  }
  .ptable tr.diff td:first-child {
    font-weight: 700;
  }
  .crisis {
    padding: clamp(16px, 2.6vw, 26px);
    display: grid;
    gap: 16px;
  }
  .crisis-top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px 18px;
  }
  .years {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
  }
  .crisis-charts {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    gap: 24px 32px;
    align-items: start;
  }
  .crisis-charts h3 {
    font-size: 16px;
    margin-bottom: 10px;
  }
  .resbars {
    display: grid;
    gap: 14px;
  }
  .resrow {
    display: grid;
    grid-template-columns: minmax(84px, auto) 1fr minmax(100px, auto);
    align-items: center;
    gap: 10px;
  }
  .rname {
    font-weight: 650;
    font-size: 14.5px;
  }
  .rtrack {
    position: relative;
    height: 20px;
    background: var(--surface-2);
    border-radius: 0 4px 4px 0;
  }
  .rbar {
    height: 20px;
    background: var(--series-1);
    border-radius: 0 4px 4px 0;
  }
  .rmark {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 3px;
    border-radius: 2px;
    background: var(--ink);
    transform: translateX(-1.5px);
  }
  .rval {
    font-size: 13.5px;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .rval strong {
    font-size: 18px;
    color: var(--ink);
  }
  .caption {
    font-size: 17px;
    max-width: 72ch;
  }
  .evidence {
    display: grid;
    gap: 16px;
  }
  .bridge {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px 28px;
    border-style: dashed;
    border-color: var(--axis);
  }
  .bridge > div {
    flex: 1 1 420px;
  }
  .bridge p {
    color: var(--ink-2);
    font-size: 15px;
    max-width: 78ch;
  }
  .atable td,
  .rtable2 td {
    vertical-align: middle;
  }
  .atable td:first-child strong {
    font-weight: 600;
  }
  .atable tr.mty td:first-child strong {
    font-weight: 750;
  }
  .atable .tag {
    margin-left: 8px;
    font-size: 11px;
    padding: 1px 7px;
  }
  .barcol {
    width: 150px;
  }
  .abar {
    position: relative;
    display: block;
    height: 12px;
    border-left: 0;
    background: linear-gradient(to right, transparent calc(50% - 0.75px), var(--axis) calc(50% - 0.75px), var(--axis) calc(50% + 0.75px), transparent calc(50% + 0.75px));
  }
  .afill {
    position: absolute;
    top: 1px;
    height: 10px;
    background: var(--down);
    border-radius: 0 3px 3px 0;
    opacity: 0.45;
  }
  .afill.neg {
    background: var(--up);
    border-radius: 3px 0 0 3px;
    opacity: 1;
  }
  @media (max-width: 980px) {
    .suspects {
      grid-template-columns: 1fr;
    }
    .exhibits {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 860px) {
    .selector {
      grid-template-columns: 1fr;
    }
    .group + .group {
      border-left: 0;
      padding-left: 0;
      border-top: 1px solid var(--grid);
      padding-top: 18px;
    }
    .crisis-charts {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 720px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .stats div:nth-child(3) {
      padding-left: 0;
      border-left: 0;
    }
    .stats div:nth-child(n + 3) {
      border-top: 1px solid var(--grid);
    }
  }
  @media (max-width: 640px) {
    .exhibits {
      grid-template-columns: 1fr;
    }
    .atable thead,
    .rtable2 thead,
    .ptable thead,
    .rtable thead {
      display: none;
    }
    .atable tr,
    .rtable2 tr,
    .ptable tr,
    .rtable tr {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--grid);
    }
    .rtable tr {
      grid-template-columns: 1fr;
    }
    .atable td,
    .rtable2 td,
    .ptable td,
    .rtable td {
      border: 0;
      padding: 1px 0;
      text-align: left;
    }
    .atable td:first-child,
    .rtable2 td:first-child,
    .rtable2 td:last-child,
    .ptable td:first-child {
      grid-column: 1 / -1;
    }
    .atable td:nth-child(4) {
      grid-column: 1 / -1;
    }
    .barcol {
      display: none;
    }
    td[data-label]::before {
      content: attr(data-label) ': ';
      color: var(--muted);
      font-size: 12px;
    }
    .ptable td[data-label]::before {
      display: block;
    }
    .resrow {
      grid-template-columns: 1fr auto;
    }
    .rtrack {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
