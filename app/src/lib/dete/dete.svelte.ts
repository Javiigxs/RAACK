// DE-T, the case assistant: whether it is reachable, whether its panel is open, and the conversation.
// The page asks the DE-T server (app/dete/server.mjs) once whether it is ready; if it is not there,
// as on a static copy of the site, none of DE-T's buttons appear and the page works as before.
// The public copy of the site first reads a switch that says whether the team has DE-T on right now
// and where it answers (switch.ts).
// Code written with AI assistance (Claude) for team RAACK.

import { compact, type PageContext } from './context';
import { isPublicCopy, readSwitch } from './switch';

export type Sector = 'civil' | 'gobierno' | 'periodista' | 'investigador' | 'industria';
export const SECTORS: Sector[] = ['civil', 'gobierno', 'periodista', 'investigador', 'industria'];

/** Messages DE-T keeps in mind besides the new question (the server keeps the same number). */
export const MEMORY = 2;

/** Where DE-T answers. The server of app/dete serves the page and this address next to it. */
const URL = (import.meta.env.VITE_DETE_URL as string | undefined) || 'api/chat';
/** Where DE-T answers for this visit: the address above, or the one the switch of the public copy names. */
let endpoint = URL;
const SECTOR_KEY = 'raack-dete-sector';

export interface Msg {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  /** The number the question is about, as the page shows it. */
  about?: string;
  /** DE-T's figures were all found in the data. */
  verified?: boolean;
  /** A message of the page, not of DE-T: written in the reader's language when it is drawn. */
  note?: 'busy' | 'down' | 'empty';
}

/** A place of the globe: «nl» or «cv» for the cases of the tool, the ISO code of a country otherwise. */
export interface Place {
  id: string;
  name: string;
}

export interface Ask {
  question: string;
  about?: string;
  page?: PageContext;
  /** The place the question is about. It stays with the conversation until a question about something else. */
  place?: Place;
}

export const dete = $state({
  status: 'unknown' as 'unknown' | 'on' | 'off',
  /** Why DE-T is off, when the page can tell: its server does not answer, or it has no Kimi key. */
  why: '' as '' | 'noserver' | 'nokey',
  open: false,
  /** The place this conversation is about: the server adds what the tool knows of it to each question. */
  place: null as Place | null,
  /** The place chosen on the globe right now, while the world section is on the page. */
  globe: null as Place | null,
  sector: 'civil' as Sector,
  busy: false,
  messages: [] as Msg[],
  /** Grows each time the panel should take the focus: the question box, or the panel itself when a
      question was asked for the reader (a phone would otherwise raise its keyboard over the answer). */
  focus: 0,
  focusOn: 'input' as 'input' | 'panel'
});

let nextId = 1;
let opener: HTMLElement | null = null;

/**
 * Asks the server once whether DE-T is ready. Anything but a clear yes keeps DE-T hidden. The DE-T
 * server marks the pages it serves (<meta name="dete">); a static copy of the site has no mark and
 * asks nothing, so it leaves no failed request behind. The public copy is the exception: it reads its
 * switch, and asks DE-T only when the switch names an address. In development, Vite passes the question on.
 */
export async function probe(): Promise<void> {
  try {
    const saved = localStorage.getItem(SECTOR_KEY);
    if (saved && (SECTORS as string[]).includes(saved)) dete.sector = saved as Sector;
  } catch {
    // no local storage: DE-T starts as for a citizen
  }
  const served = !!document.querySelector('meta[name="dete"]');
  if (!served && !import.meta.env.DEV && !import.meta.env.VITE_DETE_URL) {
    // A static copy. The public one reads the switch: with DE-T off, as almost always, nothing else is asked.
    const remote = isPublicCopy(location.origin) ? await readSwitch() : null;
    if (!remote) {
      dete.status = 'off';
      return;
    }
    endpoint = remote;
  }
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 4000);
  try {
    const r = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: stop.signal });
    const body = r.ok ? ((await r.json()) as { nombre?: string; listo?: boolean }) : null;
    dete.status = body?.nombre === 'DE-T' && body.listo === true ? 'on' : 'off';
    dete.why = dete.status === 'on' ? '' : body?.nombre === 'DE-T' ? 'nokey' : 'noserver';
    if (dete.why === 'nokey') console.info('DE-T: the server is running but has no Kimi API key (dete/.env).');
  } catch {
    dete.status = 'off';
    dete.why = 'noserver';
  } finally {
    clearTimeout(timer);
  }
}

export function setSector(s: Sector): void {
  dete.sector = s;
  try {
    localStorage.setItem(SECTOR_KEY, s);
  } catch {
    // no local storage: the choice lasts until the page is closed
  }
}

/** The place this conversation is about; null goes back to the case of the page. */
export function setPlace(place: Place | null): void {
  dete.place = place;
}

/** The world section says which place its globe shows (null when it leaves the page). */
export function setGlobe(place: Place | null): void {
  dete.globe = place;
}

/** Opens the panel; with a question, asks it at once. */
export function openDete(ask?: Ask): void {
  if (dete.status !== 'on') return;
  if (!dete.open && document.activeElement instanceof HTMLElement && !document.activeElement.closest('.dete')) opener = document.activeElement;
  dete.open = true;
  dete.focusOn = ask ? 'panel' : 'input';
  dete.focus++;
  if (ask) void send(ask.question, ask);
}

export function closeDete(): void {
  dete.open = false;
  // Back to the button or the number the reader came from.
  const back = opener;
  opener = null;
  if (back?.isConnected) back.focus({ preventScroll: true });
}

export function clearChat(): void {
  if (dete.busy) return;
  dete.messages = [];
  dete.place = null;
  dete.focusOn = 'input';
  dete.focus++;
}

/** What is sent: the last messages of the conversation that came from the reader or from DE-T. */
export function history(messages: Msg[], question: string): { role: 'user' | 'assistant'; content: string }[] {
  const said = messages.filter((m) => !m.note).map((m) => ({ role: m.role, content: m.text }));
  return [...said.slice(-MEMORY), { role: 'user' as const, content: question }];
}

export async function send(question: string, extra: Omit<Ask, 'question'> = {}): Promise<void> {
  const text = question.trim().slice(0, 500);
  if (!text || dete.busy) return;
  // A question asked from the globe is about its place, and so are the ones typed after it; a question
  // about a number of the page is about the case again, unless that number belongs to a place.
  if (extra.place) dete.place = extra.place;
  else if (extra.page) dete.place = null;
  const past = dete.messages;
  dete.messages = [...past, { id: nextId++, role: 'user', text, about: extra.about ?? dete.place?.name }];
  dete.busy = true;
  let reply: Msg;
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sector: dete.sector,
        region: 'nuevo-leon',
        messages: history(past, text),
        ...(dete.place ? { lugar: dete.place.id } : {}),
        ...(extra.page ? { pagina: compact(extra.page) } : {})
      })
    });
    const data = (await r.json().catch(() => ({}))) as { answer?: string; verificado?: boolean };
    if (r.status === 429) reply = { id: nextId++, role: 'assistant', text: '', note: 'busy' };
    else if (r.ok && data.answer?.trim()) reply = { id: nextId++, role: 'assistant', text: data.answer.trim(), verified: data.verificado === true };
    else reply = { id: nextId++, role: 'assistant', text: '', note: r.ok ? 'empty' : 'down' };
  } catch {
    reply = { id: nextId++, role: 'assistant', text: '', note: 'down' };
  }
  dete.messages = [...dete.messages, reply];
  dete.busy = false;
}
