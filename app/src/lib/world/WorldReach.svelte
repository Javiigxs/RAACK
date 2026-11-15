<script lang="ts">
  // «Take the case to any country»: the reader picks a country, the globe turns to it and the page
  // counts how many of the ten data layers of the Nuevo León case are ready there.
  // The idea is Fran's (team RAACK): Nuevo León is the complete case, 10 of 10, and every other
  // place shows how much is already there and how much is left to collect.
  // Code written with AI assistance (Claude).
  import { onMount } from 'svelte';
  import { fmt } from '../catalog';
  import AskDete from '../dete/AskDete.svelte';
  import { dete, setGlobe } from '../dete/dete.svelte';
  import { t } from '../i18n';
  import { setRegion, ui } from '../state.svelte';
  import { isStill, motion, setMotion } from '../ui/motion.svelte';
  import { REGION_ORDER, REGIONS } from '../water/catalog';
  import CertaintyChip from '../water/CertaintyChip.svelte';
  import { waterTrend } from '../water/engine';
  import { pW, signed } from '../water/format';
  import type { RegionId, WaterData } from '../water/types';
  import Globe, { type GlobeDot, type GlobeLine } from './Globe.svelte';
  import {
    CASE_COUNTRY,
    COVERAGE,
    casePlace,
    countryPlace,
    firstLook,
    lookClass,
    readiness,
    searchCountries,
    tally,
    type FirstLook,
    type LayerId,
    type LayerState,
    type Place,
    type Readiness
  } from './layers';
  import type { WorldCountry, WorldData } from './types';
  import { NEAR_DIST, distFor } from './view';
  import { caseEvidence } from './why';
  import WhyCount from './WhyCount.svelte';

  let { data, n }: { data: WaterData; n: string } = $props();

  /** Countries offered as a start, besides the two cases: one per continent and one beyond 60° N. */
  const PICKS = ['IT', 'IN', 'CL', 'ZA', 'AU', 'FI'];
  /** Series of the Nuevo León file that speak for each layer (their years go in the table). */
  const NL_SERIES: Partial<Record<LayerId, string>> = {
    rain: 'rain_imerg',
    rain2: 'rain_chirps',
    temp: 'temp_gldas_mty',
    evap: 'pet_gldas_mty',
    soil: 'soil_gldas_mty',
    runoff: 'runoff_gldas_mty',
    storage: 'tws_grace',
    station: 'rain_smn',
    reservoirs: 'vol_cuchillo'
  };

  let world = $state.raw<WorldData | null>(null);
  let error = $state('');
  let placeId = $state<string>('nl');
  let query = $state('');
  let active = $state(0);
  let focused = $state(false);

  const isCase = (id: string): id is RegionId => (REGION_ORDER as string[]).includes(id);

  onMount(() => {
    let wanted = '';
    try {
      wanted = new URLSearchParams(location.search).get('place') ?? '';
    } catch {
      // no address to read: start at the reference case
    }
    // The cases are written in lower case and the countries in capitals, as pick() leaves them in the
    // address: «cv» is the Central Valley and «CV» is Cabo Verde; «nl» is Nuevo León and «NL» the Netherlands.
    const asCase = isCase(wanted);
    if (asCase) placeId = wanted;
    fetch('data/world.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: WorldData) => {
        world = d;
        const id = wanted.toUpperCase();
        if (!asCase && d.countries.some((c) => c.id === id)) placeId = id;
      })
      .catch((e) => (error = e instanceof Error ? e.message : String(e)));
  });

  // ---- places: the two cases and every country of the list
  const cases = $derived(REGION_ORDER.map((id) => casePlace(id, data.regions[id], REGIONS[id].areaKm2)));
  const countries = $derived(world?.countries ?? []);
  const byId = $derived(new Map(countries.map((c) => [c.id, c])));
  const looks = $derived(new Map(countries.map((c) => [c.id, world ? firstLook(world, c) : null])));
  const counts = $derived(new Map(countries.map((c) => [c.id, readiness(countryPlace(c))])));
  const caseCounts = $derived(new Map(cases.map((p) => [p.id, readiness(p, data.regions[p.region!])])));

  const place = $derived.by<Place>(() => {
    if (isCase(placeId)) return cases.find((p) => p.id === placeId)!;
    const c = byId.get(placeId);
    return c ? countryPlace(c) : cases[0];
  });
  const r = $derived<Readiness>(place.kind === 'case' ? caseCounts.get(place.id)! : readiness(place));
  const nameOf = (p: Place | WorldCountry | string): string => {
    if (typeof p === 'string') return isCase(p) ? t(`w.region.${p}.name`) : (byId.get(p)?.[ui.lang] ?? p);
    if ('kind' in p) return p.kind === 'case' ? t(`w.region.${p.id}.name`) : p.country![ui.lang];
    return p[ui.lang];
  };
  const name = $derived(nameOf(place));
  const full = $derived(r.loaded === r.total);
  /** A case of the tool that lies inside the chosen country. */
  const inside = $derived(place.kind === 'country' ? cases.filter((p) => p.countryId === place.id) : []);
  /** «Why 10 / 10?»: for a case of the tool, what its evidence supports, measured on its data file. */
  const evidence = $derived(place.kind === 'case' ? caseEvidence(data, place.region!) : null);

  // ---- first look at stored water
  const rate = (perDecade: number) => `${signed(perDecade, 1)} ${t('w.tunit.cm')} ${t('unit.perDecade')}`;
  const range = (ci: [number, number]) => t('fmt.range', { lo: signed(ci[0], 1), hi: signed(ci[1], 1) });
  const look = $derived.by<FirstLook | null>(() => {
    if (place.kind === 'country') return looks.get(place.id) ?? null;
    const s = data.regions[place.region!].series.tws_grace;
    if (!s) return null;
    const trend = waterTrend(s);
    return { trend, perDecade: trend.sen * 10, ci: [trend.lo * 10, trend.hi * 10], wider: false };
  });

  // ---- the globe
  const dots = $derived.by<GlobeDot[]>(() => {
    const out: GlobeDot[] = countries.map((c) => {
      const l = looks.get(c.id) ?? null;
      const ready = counts.get(c.id)!.ready;
      return {
        id: c.id,
        lon: c.lon,
        lat: c.lat,
        cls: lookClass(l),
        kind: 'country',
        name: c[ui.lang],
        note: l ? t('wr.tip.look', { ready, rate: rate(l.perDecade) }) : t('wr.tip.sea', { ready })
      };
    });
    for (const p of cases) {
      out.push({ id: p.id, lon: p.lon, lat: p.lat, cls: 'none', kind: 'case', name: nameOf(p), note: t('wr.tip.case', { ready: caseCounts.get(p.id)!.loaded }) });
    }
    return out;
  });
  const focus = $derived({ lon: place.lon, lat: place.lat, dist: place.kind === 'case' ? NEAR_DIST : distFor(place.area) });
  /** The limits of the rain products are drawn when the chosen place lies beyond them. */
  const lines = $derived.by<GlobeLine[]>(() => {
    const side = place.lat >= 0 ? 1 : -1;
    const out: GlobeLine[] = [];
    if (r.layers.some((l) => l.def.source === 'chirps' && l.state === 'out')) out.push({ lat: side * COVERAGE.chirpsLat, label: `${COVERAGE.chirpsLat}°` });
    if (r.layers.some((l) => l.def.source === 'imerg' && l.state === 'partial')) out.push({ lat: side * COVERAGE.imergFullLat, label: `${COVERAGE.imergFullLat}°` });
    return out;
  });
  const lineNotes = $derived(lines.map((l) => t(Math.abs(l.lat) === COVERAGE.chirpsLat ? 'wr.line.chirps' : 'wr.line.imerg')));
  const total = $derived(tally(countries.map((c) => lookClass(looks.get(c.id) ?? null))));

  // ---- choosing a place
  function pick(id: string) {
    placeId = id;
    query = '';
    active = 0;
    try {
      const url = new URL(location.href);
      if (id === 'nl') url.searchParams.delete('place');
      else url.searchParams.set('place', id);
      history.replaceState(null, '', url);
    } catch {
      // no history: the choice works the same
    }
  }
  const results = $derived(searchCountries(countries, query, ui.lang));
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(results.length - 1, active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(0, active - 1);
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      pick(results[active].id);
    } else if (e.key === 'Escape') query = '';
  }
  function openCase(id: RegionId) {
    setRegion(id);
    document.getElementById('w-verdict')?.scrollIntoView({ behavior: 'smooth' });
  }

  // ---- words
  const sumParts = $derived(
    (['loaded', 'open', 'partial', 'out', 'local'] as LayerState[]).map((s) => ({ s, n: r[s] })).filter((x) => x.n > 0)
  );
  const latText = (lat: number) => `${fmt(Math.abs(lat), 1, ui.lang)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonText = (lon: number) => `${fmt(Math.abs(lon), 1, ui.lang)}° ${lon >= 0 ? 'E' : ui.lang === 'es' ? 'O' : 'W'}`;
  const nlYears = (id: LayerId) => {
    const s = NL_SERIES[id] ? data.regions.nl.series[NL_SERIES[id]!] : undefined;
    return s ? t('wr.years', { y0: s.years[0], y1: s.years[s.years.length - 1] }) : '';
  };
  const sorted = $derived([...countries].sort((a, b) => a[ui.lang].localeCompare(b[ui.lang], ui.lang)));

  // ---- DE-T, the case assistant: questions about the place the globe shows
  const asked = $derived({ id: place.id, name });
  /** Nuevo León has its whole case file behind it; any other place, the layers and the first look. */
  const questions = $derived(
    place.id === 'nl' ? ['dete.s1', 'dete.s2', 'dete.s3'].map((k) => t(k)) : ['dete.place.q1', 'dete.place.q2', 'dete.place.q3'].map((k) => t(k, { name }))
  );
  // A number of this section pressed and sent to DE-T is about this place.
  $effect(() => {
    setGlobe(asked);
    return () => setGlobe(null);
  });
  /** From the finder to the line where the question is written. */
  function toAsk() {
    const field = document.getElementById('wr-ask-q');
    field?.scrollIntoView({ block: 'center' });
    field?.focus({ preventScroll: true });
  }
  const lookWord = (l: FirstLook) => `${t(`w.cert.${l.trend.label}`)}${l.trend.label !== 'none' && l.trend.dir ? ` · ${t(l.trend.dir > 0 ? 'dir.rising' : 'dir.falling')}` : ''}`;
</script>

{#snippet glyph(state: LayerState)}
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    {#if state === 'loaded'}
      <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    {:else if state === 'open'}
      <path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    {:else if state === 'partial'}
      <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M8 2.8a5.2 5.2 0 0 0 0 10.4z" fill="currentColor" />
    {:else if state === 'out'}
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
    {:else}
      <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.6 2.4" />
    {/if}
  </svg>
{/snippet}

<header class="sec-head" id="w-world">
  <p class="kicker">{t('wr.kicker', { n })}</p>
  <h2>{t('wr.title')}</h2>
  <p class="lead">{t('wr.lead')}</p>
</header>

<div class="reach" data-dete-place>
  <div class="stage">
    <Globe
      {dots}
      {focus}
      selected={place.id}
      selectedName={name}
      {lines}
      onpick={pick}
      ariaLabel={t('wr.globe.aria', { name })}
      labels={{ recentre: t('wr.globe.recentre', { name }), drag: t('wr.globe.drag') }}
    />
    {#if isStill()}
      <p class="motion-note small">
        <span>{t('wr.motion.note')}</span>
        <button class="textlink" onclick={() => setMotion('full')}>{t('wr.motion.on')}</button>
      </p>
    {:else if motion.system}
      <!-- The system asks for less motion and the reader turned it on here: the way back. -->
      <p class="motion-note small"><button class="linkish" onclick={() => setMotion('less')}>{t('wr.motion.off')}</button></p>
    {/if}
    <div class="legend">
      <span class="legend-title">{t('wr.legend.title')}</span>
      <span class="item"><span class="key falling"></span>{t('wr.legend.falling')}</span>
      <span class="item"><span class="key rising"></span>{t('wr.legend.rising')}</span>
      <span class="item"><span class="key hint"></span>{t('wr.legend.hint')}</span>
      <span class="item"><span class="key flat"></span>{t('wr.legend.none')}</span>
      <span class="item"><span class="key sea"></span>{t('wr.legend.sea')}</span>
      <span class="item"><span class="key case"></span>{t('wr.legend.case')}</span>
      {#each lineNotes as note (note)}
        <span class="item"><span class="key dash"></span>{note}</span>
      {/each}
    </div>
  </div>

  <div class="side">
    <div class="finder">
      <label for="wr-search">{t('wr.search.label')}</label>
      <div class="combo">
        <input
          id="wr-search"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder={t('wr.search.placeholder')}
          role="combobox"
          aria-expanded={focused && results.length > 0}
          aria-controls="wr-results"
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `wr-opt-${results[active].id}` : undefined}
          bind:value={query}
          oninput={() => {
            active = 0;
            focused = true;
          }}
          onkeydown={onKey}
          onfocus={() => (focused = true)}
          onblur={() => (focused = false)}
          disabled={!world}
        />
        {#if query.trim() && focused}
          <ul class="results" id="wr-results" role="listbox" aria-label={t('wr.search.label')}>
            {#each results as c, i (c.id)}
              <!-- mousedown, not click: the list closes when the field loses the focus -->
              <li id="wr-opt-{c.id}" role="option" aria-selected={i === active} class:active={i === active} onmousedown={(e) => { e.preventDefault(); pick(c.id); }}>
                <span>{c[ui.lang]}</span>
                <span class="small">{counts.get(c.id)!.ready} / {r.total}</span>
              </li>
            {:else}
              <li class="empty">{t('wr.search.none', { q: query.trim() })}</li>
            {/each}
          </ul>
        {/if}
      </div>
      <div class="picks" role="group" aria-label={t('wr.picks')}>
        <span class="small">{t('wr.picks')}</span>
        {#each cases as p (p.id)}
          <button class="chipbtn case" aria-pressed={placeId === p.id} onclick={() => pick(p.id)}><span class="sq" aria-hidden="true"></span>{nameOf(p)}</button>
        {/each}
        {#each PICKS as id (id)}
          {#if byId.has(id)}
            <button class="chipbtn" aria-pressed={placeId === id} onclick={() => pick(id)}>{nameOf(id)}</button>
          {/if}
        {/each}
      </div>
      <!-- DE-T answers questions about the chosen place: the line to write them is under the result. -->
      <button class="textlink ask-jump" onclick={toAsk}>{t('dete.place.title', { name })} <span aria-hidden="true">↓</span></button>
    </div>

    <article class="result" aria-live="polite">
      <header class="result-head">
        <h3>{name}</h3>
        {#if place.kind === 'case'}
          <span class="tag">{t(full ? 'wr.tag.reference' : 'wr.tag.case')}</span>
        {:else if place.country}
          <span class="tag">{t(`wr.region.${place.country.region}`)}</span>
        {/if}
      </header>

      <!-- The question sits right above the count it asks about (Fran's request). -->
      <WhyCount {r} {name} {full} {evidence} tested={!!look && look.trend.ok} {asked} />

      <div class="count">
        <span class="num">{r.ready} / {r.total}</span>
        <span class="count-label">{t(full ? 'wr.count.full' : 'wr.count.label')}</span>
      </div>
      <div class="meter" role="img" aria-label={t('wr.meter.aria', { ready: r.ready, name })}>
        {#each r.layers as l (l.def.id)}
          <span class="cell {l.state}" title="{t(`wr.layer.${l.def.id}.name`)}: {t(`wr.state.${l.state}`)}">{@render glyph(l.state)}</span>
        {/each}
      </div>
      <ul class="sum">
        {#each sumParts as x (x.s)}
          <li><span class="swatch {x.s}" aria-hidden="true">{@render glyph(x.s)}</span>{t(`wr.sum.${x.s}`, { n: x.n })}</li>
        {/each}
      </ul>
      <p class="say">{full ? t('wr.verdict.full') : t('wr.verdict.place', { ready: r.ready, name, rest: r.total - r.ready })}</p>

      {#if place.kind === 'case'}
        <button class="btn primary" onclick={() => openCase(place.region!)}>{t('w.g.open', { name })} <span aria-hidden="true">↑</span></button>
      {/if}
      {#each inside as p (p.id)}
        <p class="inside">
          <span>{t('wr.inside', { country: name })}</span>
          <button class="btn small-btn" onclick={() => pick(p.id)}><span class="sq" aria-hidden="true"></span>{t('wr.inside.open', { name: nameOf(p), n: caseCounts.get(p.id)!.loaded })}</button>
        </p>
      {/each}

      <div class="look">
        <h4>{t('wr.look.title')}</h4>
        {#if look && look.trend.ok}
          <p class="look-rate">
            <strong>{rate(look.perDecade)}</strong>
            <CertaintyChip label={look.trend.label} dir={look.trend.dir} compact />
          </p>
          <p class="small">{t('wr.look.facts', { ci: range(look.ci), p: pW(look.trend.p), n: look.trend.n, y0: look.trend.y0, y1: look.trend.y1 })}</p>
          {#if place.kind === 'case'}
            <p class="small">{t('wr.look.case', { n: data.regions[place.region!].cells.tws_grace_mascons ?? 0, y0: look.trend.y0, y1: look.trend.y1 })}</p>
          {:else}
            <p class="small">
              {t('wr.look.caveat')}
              {#if place.country?.twsKind === 'coast'}{t('wr.look.coast')}{/if}
              {#if look.wider}{t('wr.look.wider', { name })}{/if}
            </p>
          {/if}
        {:else if world}
          <p class="small">{t('wr.look.sea', { name })}</p>
        {:else}
          <p class="small" aria-live="polite">{error ? t('wr.error') : t('wr.loading')}</p>
        {/if}
      </div>
    </article>
  </div>
</div>

<!-- Where the country is chosen, DE-T answers questions about it with the data of the tool. -->
<AskDete id="wr-ask" title={t('dete.place.title', { name })} placeholder={t('dete.place.placeholder', { name })} suggestions={questions} place={asked} />

{#if world}
  <p class="note tally">{t('wr.tally', { n: countries.length, falling: total.falling, rising: total.rising, rest: total.hintFalling + total.hintRising + total.none, sea: total.sea })}</p>
{/if}

<div class="blocks">
<!-- Layer by layer. Closed for the complete case, open as soon as the chosen place lacks one. -->
<details class="block layers" open={!full}>
  <summary>{t('wr.table.title')}</summary>
  <div class="scroll-x">
    <table class="data ltable">
      <thead>
        <tr><th>{t('wr.table.layer')}</th><th>{t('wr.table.nl')}</th><th>{t('wr.table.here', { name })}</th></tr>
      </thead>
      <tbody>
        {#each r.layers as l, i (l.def.id)}
          {#if i === 0 || r.layers[i - 1].def.group !== l.def.group}
            <tr class="group"><th colspan="3" scope="colgroup">{t(`wr.group.${l.def.group}`)}</th></tr>
          {/if}
          <tr>
            <td>
              <span class="lname"><span class="lnum">{i + 1}</span><strong>{t(`wr.layer.${l.def.id}.name`)}</strong></span>
              <span class="small lrole">{t(`wr.layer.${l.def.id}.role`)}</span>
            </td>
            <td data-label={t('wr.table.nl')}>
              {t(`wr.nl.${l.def.id}`)}
              {#if nlYears(l.def.id)}<span class="small years">{nlYears(l.def.id)}</span>{/if}
            </td>
            <td data-label={t('wr.table.here', { name })}>
              <div class="here">
                <span class="state"><span class="swatch {l.state}" aria-hidden="true">{@render glyph(l.state)}</span>{t(`wr.state.${l.state}`)}</span>
                <span class="why">{t(`wr.why.${l.why}`)}</span>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</details>

<details class="block recipe" open>
  <summary>{t('wr.recipe.title')}</summary>
  <ol>
    <li>{t('wr.recipe.1')}</li>
    <li>{t('wr.recipe.2')}</li>
    <li>{t('wr.recipe.3')}</li>
  </ol>
  <p class="note">{t('wr.note', { lat: latText(place.lat), lon: lonText(place.lon) })}</p>
</details>
</div>

{#if world}
  <details class="table-view all">
    <summary>{t('wr.all.summary', { n: countries.length })}</summary>
    <div class="scroll">
      <table class="data">
        <thead>
          <tr><th>{t('wr.all.country')}</th><th>{t('wr.all.region')}</th><th>{t('wr.all.ready')}</th><th>{t('wr.all.look')}</th></tr>
        </thead>
        <tbody>
          {#each sorted as c (c.id)}
            {@const l = looks.get(c.id)}
            <tr>
              <td><button class="linkish" onclick={() => { pick(c.id); document.getElementById('w-world')?.scrollIntoView({ behavior: 'smooth' }); }} aria-label={t('wr.all.go', { name: c[ui.lang] })}>{c[ui.lang]}</button></td>
              <td>{t(`wr.region.${c.region}`)}</td>
              <td>{counts.get(c.id)!.ready} / {r.total}</td>
              <td>{l ? `${rate(l.perDecade)} · ${lookWord(l)}` : t('wr.all.none')}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </details>
{/if}

<style>
  .reach {
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1fr);
    gap: 28px 64px;
    align-items: start;
  }
  /* The planet has no frame and may reach a little beyond its column: the cards stay above it. */
  .stage {
    position: relative;
    z-index: 0;
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .side {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 32px;
    min-width: 0;
  }
  .motion-note {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px 12px;
    text-align: center;
  }

  /* ---- the search and the quick picks */
  .finder {
    display: grid;
    gap: 9px;
  }
  .finder label {
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .combo {
    position: relative;
  }
  .combo input {
    width: 100%;
    font: inherit;
    font-size: 16px;
    padding: 11px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    background: var(--page);
    color: var(--ink);
  }
  .combo input:hover {
    border-color: var(--ink);
  }
  .results {
    position: absolute;
    z-index: 6;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    margin: 0;
    padding: 5px;
    list-style: none;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: var(--shadow);
    max-height: 300px;
    overflow: auto;
  }
  .results li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }
  .results li.active,
  .results li:hover {
    background: var(--surface-2);
  }
  .results li.empty {
    cursor: default;
    font-weight: 400;
    color: var(--ink-2);
  }
  .picks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .picks .small {
    flex-basis: 100%;
  }
  .sq {
    width: 7px;
    height: 7px;
    background: currentColor;
    flex: none;
  }
  .ask-jump {
    justify-self: start;
    margin-top: 8px;
  }

  /* ---- the result */
  .result {
    display: grid;
    gap: 14px;
    justify-items: start;
    min-width: 0;
    border-top: 1px solid var(--border-strong);
    padding-top: 20px;
  }
  .result > :global(*) {
    max-width: 100%;
  }
  .result-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px 16px;
    width: 100%;
  }
  .result-head h3 {
    font-size: clamp(24px, 2.6vw, 32px);
    letter-spacing: -0.03em;
  }
  .result-head .tag {
    font-size: var(--fs-small);
  }
  .count {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 6px;
  }
  .num {
    font-size: clamp(56px, 7.4vw, 96px);
    font-weight: 500;
    letter-spacing: -0.055em;
    line-height: 0.86;
    font-variant-numeric: tabular-nums;
  }
  .count-label {
    font-size: var(--fs-small);
    color: var(--ink-2);
    padding-bottom: 4px;
  }
  /* Ten squares, one per layer, in the order of the list below. One hue: the stronger, the readier. */
  .meter {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 4px;
    width: min(100%, 400px);
    margin-top: 4px;
  }
  .cell,
  .swatch {
    display: grid;
    place-items: center;
    border-radius: var(--r-mark);
    border: 1px solid transparent;
    color: var(--ink-2);
  }
  .cell {
    aspect-ratio: 1;
  }
  .cell :global(svg) {
    width: 46%;
    height: 46%;
  }
  .swatch {
    width: 18px;
    height: 18px;
    flex: none;
  }
  .swatch :global(svg) {
    width: 10px;
    height: 10px;
  }
  /* The glyph inside a square takes the page colour on the strong steps and the ink on the weak one,
     so it reads in both themes (the ramp runs the other way in the dark). */
  .loaded {
    background: var(--seq-3);
    color: var(--page);
  }
  .open {
    background: var(--seq-2);
    color: var(--page);
  }
  .partial {
    background: var(--seq-1);
    color: var(--ink);
  }
  .out {
    background: var(--seq-0);
    border-color: var(--border-strong);
  }
  .local {
    background: transparent;
    border: 1px dashed var(--muted);
  }
  .sum {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .sum li {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  .say {
    font-size: var(--fs-lead);
    line-height: 1.42;
    letter-spacing: -0.008em;
    max-width: 46ch;
  }
  .inside {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .look {
    width: 100%;
    border-top: 1px solid var(--border);
    padding-top: 16px;
    margin-top: 8px;
    display: grid;
    gap: 8px;
  }
  .look h4 {
    font-size: var(--fs-small);
    font-weight: 600;
    margin: 0;
  }
  .look-rate {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .look-rate strong {
    font-size: clamp(20px, 2.2vw, 24px);
    font-weight: 500;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  /* ---- legend of the globe */
  .legend {
    margin: 0;
    gap: 5px 16px;
    justify-content: center;
  }
  .legend-title {
    flex-basis: 100%;
    color: var(--ink-2);
    text-align: center;
  }
  .key {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex: none;
    background: #a3a199;
  }
  .key.falling {
    background: #e66767;
  }
  .key.rising {
    background: #3987e5;
  }
  .key.hint {
    background: transparent;
    border: 2.5px solid #a3a199;
  }
  .key.sea {
    width: 8px;
    height: 8px;
    background: transparent;
    border: 1.5px solid var(--muted);
  }
  .key.case {
    border-radius: 2.5px;
    background: #ffffff;
    border: 2px solid #070b14;
  }
  .key.dash {
    width: 18px;
    height: 0;
    border-radius: 0;
    background: transparent;
    border-top: 2px dashed var(--ink-2);
  }
  .tally {
    font-size: var(--fs-body);
    max-width: 84ch;
  }

  /* ---- the ten layers */
  /* The table uses the whole width of the page, not the reading width of the other blocks. */
  .layers > .scroll-x {
    max-width: none;
  }
  .ltable th,
  .ltable td {
    text-align: left;
    vertical-align: top;
    padding: 12px 16px 12px 0;
  }
  .ltable tr.group th {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
    padding-top: 26px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-strong);
  }
  .ltable tbody tr.group:first-child th {
    padding-top: 12px;
  }
  .ltable td:first-child {
    width: 26%;
    min-width: 190px;
  }
  .ltable td:nth-child(2) {
    width: 30%;
  }
  .lname {
    display: flex;
    align-items: baseline;
    gap: 9px;
  }
  .lnum {
    flex: none;
    min-width: 1.5em;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .lname strong {
    font-weight: 500;
  }
  .lrole {
    display: block;
    padding-left: calc(1.5em + 9px);
  }
  /* The word wears the ink; the square beside it carries the state. */
  .state {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    white-space: nowrap;
  }
  /* The state and its reason side by side; the reasons of all the rows start on one line. */
  .here {
    display: grid;
    grid-template-columns: minmax(146px, max-content) minmax(0, 1fr);
    gap: 4px 12px;
    align-items: start;
  }
  .here .state {
    justify-self: start;
  }
  .years {
    display: block;
    white-space: nowrap;
  }
  .why {
    color: var(--ink-2);
  }
  .recipe ol {
    font-size: var(--fs-body);
    color: var(--ink);
  }
  .recipe .note {
    margin-top: 18px;
  }
  details.all {
    margin-top: 0;
  }
  details.all .scroll {
    max-height: 420px;
  }
  .linkish {
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
    font-weight: 500;
    color: var(--ink);
    text-align: left;
    text-decoration: underline;
    text-decoration-color: var(--border-strong);
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }
  .linkish:hover {
    text-decoration-color: currentColor;
  }
  details.all table.data td,
  details.all table.data th {
    text-align: left;
  }

  /* One column: the search first, then the globe it turns, then what the count says. */
  @media (max-width: 900px) {
    .reach {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .side {
      display: contents;
    }
    .finder {
      order: 1;
    }
    .stage {
      order: 2;
      max-width: 520px;
      width: 100%;
      align-self: center;
    }
    .result {
      order: 3;
    }
  }
  @media (max-width: 640px) {
    .here {
      grid-template-columns: 1fr;
    }
    .ltable thead {
      display: none;
    }
    .ltable,
    .ltable tbody,
    .ltable tr,
    .ltable td,
    .ltable th {
      display: block;
      width: auto !important;
    }
    .ltable tr {
      border-bottom: 1px solid var(--grid);
      padding: 8px 0;
    }
    .ltable tr.group {
      border-bottom: 0;
      padding: 0;
    }
    .ltable td {
      border: 0;
      padding: 3px 0;
    }
    .ltable td[data-label]::before {
      content: attr(data-label);
      display: block;
      font-size: var(--fs-micro);
      font-weight: 500;
      color: var(--muted);
      margin-top: 4px;
    }
  }
</style>
