// Estado de la interfaz: lo que el usuario ha elegido en cada paso.

import { VARS, type Lang, type Quality, type SiteId, type VarId } from './catalog';
import { REGIONS, type Concern } from './water/catalog';
import type { RegionId } from './water/types';

/** The two investigations of the site: the water case and the Monterrey lab. */
export type View = 'water' | 'city';

export const ui = $state({
  lang: 'en' as Lang,
  view: 'water' as View,
  /** Water case: region, period and what worries the user. */
  region: 'nl' as RegionId,
  wy0: REGIONS.nl.y0,
  wy1: REGIONS.nl.y1,
  concern: 'reservoirs' as Concern,
  variable: 'lstNight' as VarId,
  site: 'mtycentro' as SiteId,
  y0: 2001,
  y1: 2025,
  /** Quitar el ciclo estacional antes de buscar la tendencia. */
  deseason: true,
  quality: 'standard' as Quality,
  /** Lo que el usuario cree ver: valor del extremo derecho de su línea respecto al centro. */
  guessEnd: 0,
  guessTouched: false,
  revealed: false,
  /** Años que se comparan en «dentro del año». */
  yearA: 2016,
  yearB: 2020
});

/** Ejemplos resueltos que cargan una selección completa. */
export const CASES: { id: 'nights' | 'rain' | 'green'; varId: VarId; site: SiteId }[] = [
  { id: 'nights', varId: 'lstNight', site: 'mtycentro' },
  { id: 'rain', varId: 'rain', site: 'cell' },
  { id: 'green', varId: 'ndvi', site: 'pesqueriakia' }
];

/** La serie cambió: se borra la línea del usuario. `keepReveal` deja el veredicto a la vista. */
function resetGuess(keepReveal = false) {
  ui.guessEnd = 0;
  ui.guessTouched = false;
  if (!keepReveal) ui.revealed = false;
}

export function selectVariable(id: VarId, site?: SiteId) {
  const def = VARS[id];
  ui.variable = id;
  ui.site = site && def.sites.includes(site) ? site : def.sites.includes(ui.site) ? ui.site : def.sites[0];
  ui.y0 = def.y0;
  ui.y1 = def.y1;
  if (!def.hasQuality) ui.quality = 'standard';
  resetGuess();
}

export function selectSite(site: SiteId, keepReveal = false) {
  if (!VARS[ui.variable].sites.includes(site) || site === ui.site) return;
  ui.site = site;
  resetGuess(keepReveal);
}

export function setPeriod(y0: number, y1: number, keepReveal = false) {
  const def = VARS[ui.variable];
  const a = Math.max(def.y0, Math.min(y0, y1));
  const b = Math.min(def.y1, Math.max(y0, y1));
  if (a === ui.y0 && b === ui.y1) return;
  ui.y0 = a;
  ui.y1 = b;
  resetGuess(keepReveal);
}

export function setDeseason(v: boolean) {
  if (v === ui.deseason) return;
  ui.deseason = v;
  resetGuess();
}

export function setQuality(q: Quality) {
  if (q === ui.quality) return;
  ui.quality = q;
  resetGuess();
}

export function loadCase(id: 'nights' | 'rain' | 'green') {
  const c = CASES.find((x) => x.id === id)!;
  ui.deseason = true;
  ui.quality = 'standard';
  selectVariable(c.varId, c.site);
  if (id === 'rain') {
    ui.yearA = 2016;
    ui.yearB = 2020;
  }
}

export function reveal() {
  ui.revealed = true;
}

export function setView(view: View) {
  ui.view = view;
}

export function setRegion(region: RegionId) {
  if (region === ui.region) return;
  ui.region = region;
  ui.wy0 = REGIONS[region].y0;
  ui.wy1 = REGIONS[region].y1;
}

export function setWaterPeriod(y0: number, y1: number) {
  const def = REGIONS[ui.region];
  ui.wy0 = Math.max(def.y0, Math.min(y0, y1));
  ui.wy1 = Math.min(def.y1, Math.max(y0, y1));
}

export function setConcern(concern: Concern) {
  ui.concern = concern;
}
