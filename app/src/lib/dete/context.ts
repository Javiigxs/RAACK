// DE-T · What the page tells the assistant when the reader presses «Ask DE-T» under a number: the
// number as written, what kind of figure it is, the explanation the reader already saw, the words
// around it and what the reader has chosen on the page. The server accepts only these fields, as
// short text. Code written with AI assistance (Claude) for team RAACK.

export interface PageContext {
  numero: string;
  tipo?: string;
  explicacion?: string;
  unidad?: string;
  etiqueta?: string;
  seccion?: string;
  texto?: string;
  estado?: string;
  idioma?: string;
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * The text around a number: up to `max` characters centred on it, cut at a space and marked with «…»
 * where it was cut. `start` and `end` are the position of the number inside `text`.
 */
export function around(text: string, start: number, end: number, max = 340): string {
  if (text.length <= max) return clean(text);
  const room = Math.max(0, max - (end - start));
  let a = Math.max(0, start - Math.ceil(room / 2));
  let b = Math.min(text.length, end + Math.floor(room / 2));
  // Use the room that one side does not need on the other side.
  if (a === 0) b = Math.min(text.length, max);
  if (b === text.length) a = Math.max(0, text.length - max);
  if (a > 0) {
    const space = text.indexOf(' ', a);
    if (space !== -1 && space < start) a = space + 1;
  }
  if (b < text.length) {
    const space = text.lastIndexOf(' ', b);
    if (space > end) b = space;
  }
  return `${a > 0 ? '…' : ''}${clean(text.slice(a, b))}${b < text.length ? '…' : ''}`;
}

/** Only the fields with something in them, each one on a single line. */
export function compact(ctx: PageContext): PageContext {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (typeof v === 'string' && clean(v)) out[k] = clean(v);
  }
  return out as unknown as PageContext;
}
