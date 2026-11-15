// DE-T on the public copy of the site. GitHub Pages can only serve files: DE-T's server, with the
// team's Kimi key, runs on a team member's computer and is reachable only while they keep it on
// (npm run dete:publico). A small file kept on GitHub, the switch, says whether it is on right now and
// at which address it answers. DE-T is always on the page; when the switch is off, the page shows it
// as off and asks nothing else. Asked for by Fran on 15 November 2026.
// Code written with AI assistance (Claude) for team RAACK.

import config from '../../../dete/publico.json';

/** The address where DE-T answers according to a switch file, or null when it is off or not valid. */
export function switchTarget(body: unknown): string | null {
  const url = (body as { url?: unknown } | null)?.url;
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    const plain = !u.search && !u.hash && !u.username && !u.password;
    return u.protocol === 'https:' && u.pathname === '/api/chat' && plain ? u.href : null;
  } catch {
    return null;
  }
}

/**
 * The switch as the GitHub API hands it over: the file inside an envelope, in base64. Returns the
 * address (or null for off) when the envelope holds a switch file, and undefined when it is anything
 * else (an error of the API, its limit of requests…), so that the caller reads the file another way.
 */
export function switchFromApi(body: unknown): string | null | undefined {
  const b = body as { content?: unknown; encoding?: unknown } | null;
  if (!b || typeof b.content !== 'string' || b.encoding !== 'base64') return undefined;
  try {
    const file: unknown = JSON.parse(atob(b.content.replace(/\s+/g, '')));
    return file && typeof file === 'object' ? switchTarget(file) : undefined;
  } catch {
    return undefined;
  }
}

/** Only the public copy of the site reads the switch; any other static copy asks nothing. */
export function isPublicCopy(origin: string): boolean {
  return origin === config.pagina;
}

/** The JSON a public address answers with, or undefined when it does not answer in time or says no. */
async function getJson(url: string, ms: number): Promise<unknown | undefined> {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-store', signal: stop.signal });
    return r.ok ? ((await r.json()) as unknown) : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Reads the switch. First through the GitHub API, which renews the file every minute; if the API does
 * not answer (it allows 60 requests an hour from one address), through the plain file, which GitHub
 * renews every five minutes (both measured on 15 November 2026). So turning DE-T on, or a change of
 * the address of its tunnel, shows here in about a minute. Turning it off needs no wait: its address
 * stops answering at once.
 */
export async function readSwitch(): Promise<string | null> {
  const viaApi = await getJson(config.api, 2500);
  const fresh = viaApi === undefined ? undefined : switchFromApi(viaApi);
  if (fresh !== undefined) return fresh;
  const file = await getJson(config.interruptor, 4000);
  return file === undefined ? null : switchTarget(file);
}
