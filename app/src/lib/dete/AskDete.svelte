<script lang="ts">
  // A place in the page to ask DE-T without opening it first: a title, one line for the question and
  // a few questions to start with. The answer opens in DE-T's panel. The world section uses it under
  // the country finder (Fran's idea: ask where the country is chosen), with the place of the globe.
  // The band is always there (Fran, 15 November 2026: «always visible, but off»): while DE-T's server
  // is not there, as on a static copy of the site, a line says that it is off and nothing can be sent.
  // Code written with AI assistance (Claude) for team RAACK.
  import { t } from '../i18n';
  import { dete, openDete, recheck, type Place } from './dete.svelte';

  let {
    id,
    title,
    placeholder,
    suggestions,
    place = null
  }: {
    /** Prefix of the ids of this band (it may appear more than once on the page). */
    id: string;
    title: string;
    placeholder: string;
    /** Questions to start with, already in the language of the page. */
    suggestions: string[];
    /** The place the questions are about. */
    place?: Place | null;
  } = $props();

  let draft = $state('');
  const on = $derived(dete.status === 'on');
  /** The page does not know yet, or is asking again, whether DE-T is on. */
  const waiting = $derived(dete.status === 'unknown' || dete.checking);

  function ask(question: string) {
    openDete({ question, place: place ?? undefined });
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const q = draft.trim();
    if (!q) return;
    // DE-T answers one question at a time: while it is busy the panel opens and the draft stays here.
    if (dete.busy) {
      openDete();
      return;
    }
    draft = '';
    ask(q);
  }
</script>

<section class="askband" class:off={!on} aria-labelledby="{id}-title">
    <div class="who">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="20" height="20">
          <circle cx="13" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="3" />
          <path d="M19 19l8 8" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
        </svg>
      </span>
      <div class="words">
        <h3 id="{id}-title">{title}</h3>
        <p class="small">{t('dete.sub')}</p>
      </div>
    </div>

    <form onsubmit={submit}>
      <label class="sr-only" for="{id}-q">{title}</label>
      {#if !on}
        <!-- Off, or not known yet: said above the line, which stays in its place but takes no question. -->
        <p class="state" role="status">
          <span class="ring" aria-hidden="true"></span>
          <span>{t(waiting ? 'dete.checking' : 'dete.offnow.title')}</span>
          {#if !waiting}<button class="textlink" type="button" onclick={() => recheck(true)}>{t('dete.offnow.retry')}</button>{/if}
        </p>
      {/if}
      <div class="line">
        <input id="{id}-q" type="text" bind:value={draft} maxlength="500" autocomplete="off" enterkeyhint="send" {placeholder} disabled={!on} />
        <button class="btn" type="submit" disabled={!on || !draft.trim()} aria-label={t('dete.send')}><span class="word">{t('dete.send')}</span> <span aria-hidden="true">→</span></button>
      </div>
      <ul class="tries" aria-label={t('dete.try')}>
        {#each suggestions as q (q)}
          <li>
            <button type="button" onclick={() => ask(q)} disabled={!on || dete.busy}>
              <span>{q}</span>
              <span class="go" aria-hidden="true">→</span>
            </button>
          </li>
        {/each}
      </ul>
      {#if !on && !waiting}
        <p class="small">{t('dete.offnow.text')}</p>
      {/if}
      {#if import.meta.env.DEV && dete.why}
        <!-- Only while developing: says why DE-T is off and how to turn it on. -->
        <p class="note">{t(`dete.off.${dete.why}`)}</p>
      {/if}
    </form>
</section>

<style>
  /* No box: a line above, who answers on the left and the question on the right, on the same two
     columns as the globe and its result. */
  .askband {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px 64px;
    align-items: start;
    margin-top: var(--gap-block);
    padding-top: 24px;
    border-top: 1px solid var(--border-strong);
  }
  .who {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }
  /* The same mark as the head of DE-T's panel. */
  .mark {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--ink);
    color: var(--page);
  }
  .words {
    display: grid;
    gap: 8px;
  }
  .words h3 {
    padding-top: 3px;
  }
  .words .small {
    max-width: 44ch;
  }

  form {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .line {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
  }
  .line input {
    width: 100%;
    font: inherit;
    font-size: 16px;
    padding: 11px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    background: var(--page);
    color: var(--ink);
  }
  .line input:hover {
    border-color: var(--ink);
  }
  .line input::placeholder {
    color: var(--muted);
  }
  .line .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .line .btn:disabled:hover {
    border-color: var(--border-strong);
  }

  /* Questions to start with: rows with a thin line between them, like the blocks that open below. */
  .tries {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .tries li + li {
    border-top: 1px solid var(--border);
  }
  .tries button {
    width: 100%;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 2px;
    border: 0;
    background: none;
    cursor: pointer;
    text-align: left;
    font-size: var(--fs-small);
    line-height: 1.4;
    color: var(--ink-2);
    transition: color 0.15s;
  }
  .tries button:hover {
    color: var(--ink);
  }
  .tries button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .go {
    flex: none;
    color: var(--muted);
    transition: transform 0.15s;
  }
  .tries button:hover .go {
    color: var(--ink);
    transform: translateX(3px);
  }

  /* Off: one line says it, with the way to ask again; the rest keeps its place and steps back. */
  .state {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 4px;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
  }
  .state .textlink {
    font-weight: 500;
    margin-left: 4px;
  }
  .ring {
    flex: none;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1.6px solid var(--ink-2);
  }
  .off .mark {
    background: transparent;
    color: var(--ink-2);
    box-shadow: inset 0 0 0 1.5px var(--border-strong);
  }
  .line input:disabled {
    background: transparent;
    border-color: var(--border);
  }
  .line input:disabled:hover {
    border-color: var(--border);
  }
  form > .small {
    margin-top: 8px;
    max-width: 52ch;
  }
  form > .note {
    margin-top: 8px;
  }

  @media (min-width: 900px) {
    .askband {
      grid-template-columns: minmax(0, 0.92fr) minmax(0, 1fr);
    }
  }
  /* On a phone the line is for the question: the button keeps only its arrow. */
  @media (max-width: 560px) {
    .line .word {
      display: none;
    }
    .line .btn {
      padding-inline: 15px;
    }
  }
</style>
