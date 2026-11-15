// DE-T · How an answer is laid out. The model writes plain text with a little Markdown (paragraphs,
// lists, **bold**); this turns it into blocks that the panel draws as ordinary text, so nothing in an
// answer is ever read as HTML. Code written with AI assistance (Claude) for team RAACK.

export interface Inline {
  text: string;
  bold: boolean;
}
export type Block = { kind: 'p'; parts: Inline[] } | { kind: 'ul' | 'ol'; items: Inline[][] };

const BULLET = /^\s*[-•*]\s+/;
const NUMBERED = /^\s*\d{1,2}[.)]\s+/;

/** «**bold**» becomes bold text; the asterisks of an unfinished pair are kept as they were written. */
export function inline(text: string): Inline[] {
  const parts: Inline[] = [];
  const pieces = text.split('**');
  const pairs = pieces.length % 2 === 1;
  pieces.forEach((piece, i) => {
    const bold = pairs && i % 2 === 1;
    const value = !pairs && i > 0 ? `**${piece}` : piece;
    if (!value) return;
    const last = parts[parts.length - 1];
    if (last && last.bold === bold) last.text += value;
    else parts.push({ text: value, bold });
  });
  return parts;
}

/** Paragraphs split by blank lines, runs of «- item» or «1. item» lines as lists, «### Title» as a bold line. */
export function blocks(answer: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ kind: 'p', parts: inline(para.join(' ')) });
    para = [];
  };
  for (const raw of answer.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      out.push({ kind: 'p', parts: [{ text: heading[1].replaceAll('**', ''), bold: true }] });
      continue;
    }
    const kind = BULLET.test(line) ? 'ul' : NUMBERED.test(line) ? 'ol' : null;
    if (kind) {
      flush();
      const item = inline(line.replace(kind === 'ul' ? BULLET : NUMBERED, ''));
      const last = out[out.length - 1];
      if (last && last.kind === kind) last.items.push(item);
      else out.push({ kind, items: [item] });
      continue;
    }
    // A line that follows a list item without a blank line is still part of that item.
    const last = out[out.length - 1];
    if (!para.length && last && last.kind !== 'p' && /^\s/.test(raw)) {
      last.items[last.items.length - 1].push(...inline(` ${line}`));
      continue;
    }
    para.push(line);
  }
  flush();
  return out;
}
