<script lang="ts">
  // «Press a number and it tells you what it is.» One listener for the whole page: it finds the
  // number under the pointer in the text itself (nothing is marked by hand, nothing is rewritten),
  // asks detect.ts what kind of figure it is, and shows a short card next to it with the name the
  // page gives to that number. When DE-T, the case assistant, is reachable, the card ends with
  // «Not clear? Ask DE-T», which hands the number and what the card said to DE-T.
  // Code written with AI assistance (Claude) for team RAACK.
  import { onMount } from 'svelte';
  import { around } from '../dete/context';
  import { dete, openDete } from '../dete/dete.svelte';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import { numberAt, type NumHit } from './detect';

  interface Card {
    hit: NumHit;
    label: string;
    /** The words around the number and the section it is in: what DE-T is told when asked about it. */
    around: string;
    section: string;
    /** The number sits in the world section, next to the place its globe shows. */
    inPlace: boolean;
    left: number;
    top: number;
    above: boolean;
    /** Horizontal position of the little arrow inside the card. */
    arrow: number;
  }
  let card = $state<Card | null>(null);

  /** Things that already do something when pressed: the number inside them is not explained.
      DE-T's panel is one of them: its answers are not the page's figures. */
  const BUSY = 'a, button, select, option, input, textarea, summary, [role="button"], [contenteditable=""], [contenteditable="true"], .xcard, .dete';
  /** A label that ticks a box or opens a list when pressed is busy too; the label of a slider is not. */
  const busy = (el: Element) => !!el.closest(BUSY) || !!el.closest('label')?.querySelector('input[type="checkbox"], input[type="radio"], select');
  /** Kinds whose general explanation says little: for them the name the page gives comes first. */
  const PLAIN = new Set(['count', 'measure', 'ratio', 'percent', 'year', 'date', 'period']);
  const CARD_W = 310;

  const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
  const short = (s: string, n = 150) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

  function caretAt(x: number, y: number): { node: Text; offset: number } | null {
    const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
    if (typeof doc.caretPositionFromPoint === 'function') {
      const p = doc.caretPositionFromPoint(x, y);
      return p && p.offsetNode.nodeType === Node.TEXT_NODE ? { node: p.offsetNode as Text, offset: p.offset } : null;
    }
    if (typeof document.caretRangeFromPoint === 'function') {
      const r = document.caretRangeFromPoint(x, y);
      return r && r.startContainer.nodeType === Node.TEXT_NODE ? { node: r.startContainer as Text, offset: r.startOffset } : null;
    }
    return null;
  }

  /**
   * The text a number belongs to, with the position of its own text node inside it. A unit or a
   * sign often sits in a neighbouring element («<strong>806</strong> mm»), so the block is the
   * nearest element that is not inline, one step wider when it holds little more than the number.
   */
  function blockOf(node: Text): { text: string; base: number } {
    let el = node.parentElement!;
    const svgText = (e: Element) => e instanceof SVGElement && e.tagName.toLowerCase() === 'text';
    const inline = (e: Element) => {
      const d = getComputedStyle(e).display;
      return d.startsWith('inline') || d === 'contents';
    };
    while (el.parentElement && !svgText(el) && inline(el)) el = el.parentElement;
    if (!svgText(el)) {
      for (let i = 0; i < 2; i++) {
        const parent = el.parentElement;
        if (!parent || clean(el.textContent).length > 14) break;
        if (parent.matches('body, main, section, article, table, thead, tbody, tr, ul, ol, dl, svg, g') || (parent.textContent ?? '').length > 260) break;
        el = parent;
      }
    }
    let text = '';
    let base = 0;
    let lastParent: Node | null = null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      // Two pieces of text from different elements, or with a line break between them, are separate
      // words even when the tags leave no space.
      const apart = n.parentNode !== lastParent || n.previousSibling?.nodeType === Node.ELEMENT_NODE;
      if (text && apart && !/\s$/.test(text) && !/^\s/.test(n.data)) text += ' ';
      if (n === node) base = text.length;
      text += n.data;
      lastParent = n.parentNode;
    }
    return { text, base };
  }

  /** The name the page gives to a number: its column, its term in a list, the label of its tile… */
  function labelOf(node: Text): string {
    const from = node.parentElement!;
    const marked = from.closest('[data-what]');
    if (marked) return clean(marked.getAttribute('data-what'));

    const dd = from.closest('dd');
    if (dd?.previousElementSibling?.tagName === 'DT') return clean(dd.previousElementSibling.textContent);
    const dt = from.closest('dt');
    if (dt?.nextElementSibling?.tagName === 'DD') return clean(dt.nextElementSibling.textContent);

    const cell = from.closest('td, th');
    if (cell) {
      const row = cell.parentElement!;
      const index = Array.prototype.indexOf.call(row.children, cell) as number;
      const head = cell.closest('table')?.querySelector('thead tr')?.children[index];
      const column = cell.tagName === 'TD' ? clean(cell.getAttribute('data-label')) || clean(head?.textContent) : '';
      const first = row.children[0];
      const rowName = first && first !== cell ? clean((first.querySelector('strong, button') ?? first).textContent) : '';
      return [rowName, column].filter(Boolean).join(' · ');
    }

    const svg = from.closest('svg');
    if (svg) return clean(svg.getAttribute('aria-label'));

    // A tile: a short label, the figure, and sometimes a note.
    const tile = from.closest('.tile, .exhibit, .share, .tiles > div');
    if (tile) {
      const own = from.closest('strong, .num') ?? from;
      for (const child of tile.children) {
        if (child !== own && !child.contains(own) && clean(child.textContent)) return clean(child.textContent);
      }
    }
    // The big figure of a card, a slider, or any number in running text: the nearest heading says what it is about.
    const forId = from.closest('label')?.getAttribute('for');
    if (forId) return clean(from.closest('label')!.firstChild?.textContent);
    const box = from.closest('article, .card, .panel, .beat, aside, section, figure');
    return clean(box?.querySelector('h2, h3, h4')?.textContent);
  }

  /** The section a number is in: the last step title before it («Step 2 · Case file — The verdict»). */
  function sectionOf(node: Node): string {
    let found: Element | null = null;
    for (const h of document.querySelectorAll('h2')) {
      if (h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) found = h;
      else break;
    }
    if (!found) return '';
    const kicker = found.closest('header, .sec-head')?.querySelector('.kicker');
    return [clean(kicker?.textContent), clean(found.textContent)].filter(Boolean).join(' — ');
  }

  interface Found {
    hit: NumHit;
    label: string;
    around: string;
    node: Text;
    range: Range;
    rect: DOMRect;
  }

  function locate(x: number, y: number): Found | null {
    const caret = caretAt(x, y);
    if (!caret) return null;
    const data = caret.node.data;
    if (!/\d/.test(data.slice(Math.max(0, caret.offset - 16), caret.offset + 16))) return null;
    if (!caret.node.parentElement || busy(caret.node.parentElement)) return null;
    const block = blockOf(caret.node);
    const label = labelOf(caret.node);
    const hit = numberAt(block.text, block.base + caret.offset, label);
    if (!hit) return null;
    const start = hit.start - block.base;
    const end = hit.end - block.base;
    if (start < 0 || end > data.length) return null;
    const range = document.createRange();
    range.setStart(caret.node, start);
    range.setEnd(caret.node, end);
    // The caret snaps to the nearest letter even when the pointer is beside the text: check it is really on the number.
    const rects = Array.from(range.getClientRects());
    const on = rects.find((r) => x >= r.left - 3 && x <= r.right + 3 && y >= r.top - 3 && y <= r.bottom + 3);
    if (!on) return null;
    return {
      hit,
      label: short(label),
      around: around(block.text, Math.min(hit.start, hit.spanStart), Math.max(hit.end, hit.spanEnd)),
      node: caret.node,
      range,
      rect: range.getBoundingClientRect()
    };
  }

  function show(found: Found) {
    const { rect } = found;
    const width = Math.min(CARD_W, window.innerWidth - 16);
    const centre = rect.left + rect.width / 2;
    const left = Math.max(8, Math.min(centre - width / 2, window.innerWidth - width - 8));
    // Below the number when there is room for a card of usual height; above otherwise.
    const above = rect.bottom + 230 > window.innerHeight && rect.top > 240;
    card = {
      hit: found.hit,
      label: found.label,
      around: found.around,
      section: sectionOf(found.node),
      inPlace: !!found.node.parentElement?.closest('[data-dete-place]'),
      left: left + window.scrollX,
      top: (above ? rect.top - 10 : rect.bottom + 10) + window.scrollY,
      above,
      arrow: Math.max(16, Math.min(centre - left, width - 16))
    };
  }

  onMount(() => {
    const root = document.documentElement;
    const highlights = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined' ? CSS.highlights : null;
    let raf = 0;
    let px = 0;
    let py = 0;
    let over: EventTarget | null = null;
    let hovering = false;
    let shownAt = 0;

    function mark(range: Range | null) {
      if (!!range !== hovering) {
        hovering = !!range;
        root.classList.toggle('num-hover', hovering);
      }
      if (!highlights) return;
      if (range) highlights.set('num-hover', new Highlight(range));
      else highlights.delete('num-hover');
    }
    function probe() {
      raf = 0;
      const el = over instanceof Element ? over : null;
      mark(el && !busy(el) ? (locate(px, py)?.range ?? null) : null);
    }
    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      over = e.target;
      if (!raf) raf = requestAnimationFrame(probe);
    }
    function onClick(e: MouseEvent) {
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('.xcard')) return;
      if (e.defaultPrevented || e.button !== 0 || !el || busy(el)) {
        // Pressing the text of a label also «presses» its control: that echo must not close the card just opened.
        if (performance.now() - shownAt > 120) card = null;
        return;
      }
      // Someone selecting text is not asking about a number.
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
      const found = locate(e.clientX, e.clientY);
      if (found) {
        show(found);
        shownAt = performance.now();
      } else card = null;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && card) card = null;
    }
    const close = () => (card = null);
    const onLeave = () => mark(null);

    document.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('mouseleave', onLeave);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    return () => {
      cancelAnimationFrame(raf);
      mark(null);
      document.removeEventListener('pointermove', onMove);
      root.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
    };
  });

  /** What the reader has chosen on the page, in a line: DE-T needs it to talk about the same case. */
  function pageState(): string {
    return ui.view === 'water'
      ? t('dete.state.water', { region: t(`w.region.${ui.region}.name`), y0: ui.wy0, y1: ui.wy1, concern: t(`w.concern.${ui.concern}`) })
      : t('dete.state.city', { variable: t(`var.${ui.variable}.name`), site: t(`site.${ui.site}.short`), y0: ui.y0, y1: ui.y1 });
  }

  /** «Not clear? Ask DE-T»: the card closes and DE-T gets the number, the card's words and the page state. */
  function askDete() {
    if (!card) return;
    const c = card;
    card = null;
    openDete({
      question: t('dete.q.number', { num: c.hit.phrase }),
      about: c.label ? `${c.hit.phrase} · ${c.label}` : c.hit.phrase,
      // A figure of the globe is about the place the globe shows: DE-T gets it to check the number.
      place: c.inPlace && dete.globe ? dete.globe : undefined,
      page: {
        numero: c.hit.phrase,
        tipo: t(`x.kind.${c.hit.kind}.name`),
        explicacion: t(`x.kind.${c.hit.kind}.text`),
        unidad: c.hit.unit ? t(`x.unit.${c.hit.unit}`) : undefined,
        etiqueta: c.label,
        seccion: c.section,
        texto: c.around,
        estado: pageState(),
        idioma: ui.lang
      }
    });
  }

  // The card speaks the language of the page: a change of language closes it.
  let lastLang = ui.lang;
  $effect(() => {
    if (ui.lang !== lastLang) {
      lastLang = ui.lang;
      card = null;
    }
  });
</script>

{#if card}
  {@const first = !!card.label && PLAIN.has(card.hit.kind)}
  <div
    class="xcard"
    class:above={card.above}
    role="note"
    aria-live="polite"
    aria-label={t('x.aria')}
    style="left: {card.left}px; top: {card.top}px; --arrow: {card.arrow}px"
  >
    <button class="xclose" onclick={() => (card = null)} aria-label={t('x.close')}>×</button>
    <p class="xnum">{card.hit.phrase}</p>
    <p class="xkind">{t(`x.kind.${card.hit.kind}.name`)}</p>
    {#if first}
      <p class="xhere first"><span>{t('x.here')}</span>{card.label}</p>
    {/if}
    <p class="xtext" class:after={first}>{t(`x.kind.${card.hit.kind}.text`)}</p>
    {#if card.hit.unit}
      <p class="xunit">{t(`x.unit.${card.hit.unit}`)}</p>
    {/if}
    {#if card.label && !first}
      <p class="xhere"><span>{t('x.here')}</span>{card.label}</p>
    {/if}
    {#if dete.status === 'on'}
      <p class="xask">
        <span>{t('x.ask.q')}</span>
        <button class="xask-btn" onclick={askDete} aria-label={t('x.ask.aria', { num: card.hit.phrase })}>
          {t('x.ask.cta')} <span aria-hidden="true">→</span>
        </button>
      </p>
    {/if}
  </div>
{/if}

<style>
  .xcard {
    position: absolute;
    z-index: 40;
    width: min(310px, 100vw - 16px);
    padding: 13px 15px 14px;
    border-radius: var(--radius);
    background: var(--ink);
    color: var(--page);
    box-shadow: var(--shadow);
    display: grid;
    gap: 6px;
    font-size: var(--fs-small);
    line-height: 1.45;
    animation: pop 0.14s ease-out;
  }
  .xcard.above {
    transform: translateY(-100%);
  }
  .xcard::before {
    content: '';
    position: absolute;
    left: var(--arrow);
    top: -5px;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    background: var(--ink);
    transform: rotate(45deg);
    border-radius: 2px;
  }
  .xcard.above::before {
    top: auto;
    bottom: -5px;
  }
  @keyframes pop {
    from {
      opacity: 0;
    }
  }
  .xnum {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    padding-right: 26px;
    overflow-wrap: anywhere;
  }
  .xkind {
    font-size: var(--fs-micro);
    font-weight: 500;
    opacity: 0.72;
  }
  .xunit,
  .xhere {
    border-top: 1px solid color-mix(in srgb, var(--page) 22%, transparent);
    padding-top: 6px;
  }
  .xunit {
    opacity: 0.88;
  }
  .xhere.first {
    border-top: 0;
    padding-top: 0;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .xtext.after {
    border-top: 1px solid color-mix(in srgb, var(--page) 22%, transparent);
    padding-top: 6px;
    opacity: 0.88;
  }
  .xhere span {
    display: block;
    font-size: var(--fs-micro);
    font-weight: 500;
    opacity: 0.65;
  }
  /* «Not clear? Ask DE-T»: the last line of the card, set apart like the others. */
  .xask {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 10px;
    border-top: 1px solid color-mix(in srgb, var(--page) 22%, transparent);
    padding-top: 9px;
    margin-top: 2px;
  }
  .xask > span {
    opacity: 0.78;
  }
  .xask-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid color-mix(in srgb, var(--page) 40%, transparent);
    background: color-mix(in srgb, var(--page) 12%, transparent);
    color: inherit;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: var(--fs-small);
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;
  }
  .xask-btn:hover {
    background: var(--page);
    color: var(--ink);
  }
  .xask-btn:focus-visible {
    outline-color: var(--page);
  }
  .xclose {
    position: absolute;
    right: 6px;
    top: 5px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.7;
  }
  .xclose:hover {
    opacity: 1;
    background: color-mix(in srgb, var(--page) 16%, transparent);
  }
</style>
