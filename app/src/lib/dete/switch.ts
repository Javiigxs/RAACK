// DE-T on the public copy of the site. GitHub Pages can only serve files: DE-T's server, with the
// team's Kimi key, runs on a team member's computer and is reachable only while they keep it on
// (npm run dete:publico). A small file kept on GitHub, the switch, says whether it is on right now and
// at which address it answers; when it is off, the public page shows no DE-T button and asks nothing
// else. Asked for by Fran on 15 November 2026. Code written with AI assistance (Claude) for team RAACK.

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

/** Only the public copy of the site reads the switch; any other static copy asks nothing. */
export function isPublicCopy(origin: string): boolean {
  return origin === config.pagina;
}

/**
 * Reads the switch. GitHub serves that file from a cache it renews every five minutes (measured on
 * 15 November 2026), so turning DE-T on takes up to that long to show here. Turning it off needs no
 * wait: its address stops answering at once, and the page then keeps DE-T hidden.
 */
export async function readSwitch(): Promise<string | null> {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 4000);
  try {
    const r = await fetch(config.interruptor, { cache: 'no-store', signal: stop.signal });
    return r.ok ? switchTarget(await r.json()) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
