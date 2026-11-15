<script lang="ts">
  // DE-T, the case assistant: a panel at the side of the page (the whole screen on a phone). It opens
  // from the header, from the verdict, from «Not clear? Ask DE-T» under the explanation of a number, or
  // from the question asked under the country finder, and the page stays where the reader left it.
  // DE-T is always on the page (Fran, 15 November 2026): while its server is off the panel opens the
  // same, says that DE-T is off and lets the reader check again. The assistant itself is the team's
  // design (server, tools, figure checker); this panel was written with AI assistance (Claude) for team RAACK.
  import { tick } from 'svelte';
  import { t } from '../i18n';
  import { blocks } from './answer';
  import { clearChat, closeDete, dete, openDete, recheck, send, setSector, SECTORS, type Sector } from './dete.svelte';

  let draft = $state('');
  let input = $state<HTMLTextAreaElement | null>(null);
  let panel = $state<HTMLElement | null>(null);
  let log = $state<HTMLDivElement | null>(null);

  const SUGGESTIONS = ['dete.s1', 'dete.s2', 'dete.s3'];
  const on = $derived(dete.status === 'on');
  /** The page does not know yet, or is asking again, whether DE-T is on. */
  const waiting = $derived(dete.status === 'unknown' || dete.checking);

  // When the panel opens, the focus goes into it: to the question box when the reader is about to
  // write (not on a touch screen, where the keyboard would cover the panel), to the panel otherwise.
  $effect(() => {
    if (!dete.focus || !dete.open) return;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    tick().then(() => (dete.focusOn === 'input' && !touch ? input : panel)?.focus({ preventScroll: true }));
  });

  // The newest message stays in view.
  $effect(() => {
    void dete.messages.length;
    void dete.busy;
    tick().then(() => log?.scrollTo({ top: log.scrollHeight }));
  });

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const q = draft.trim();
    if (!q || dete.busy) return;
    draft = '';
    void send(q);
  }

  function onKey(e: KeyboardEvent) {
    // Enter sends; Shift+Enter starts a new line.
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      (e.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
    }
  }

  // Escape closes the panel wherever the focus is (a pressed suggestion disappears and takes it along).
  function onKeyAnywhere(e: KeyboardEvent) {
    if (e.key === 'Escape' && dete.open && !e.defaultPrevented) closeDete();
  }

  function suggest(key: string) {
    void send(t(key));
    dete.focusOn = 'input';
    dete.focus++;
  }
</script>

<svelte:window onkeydown={onKeyAnywhere} />

<!-- Below the full width of the page the header has no room for DE-T: it waits in the corner.
     Filled while DE-T is on; an outline, with the word, while it is off. -->
<button
  class="fab"
  class:away={dete.open}
  class:off={dete.status === 'off'}
  onclick={() => openDete()}
  aria-label={dete.status === 'off' ? t('dete.offAria') : t('dete.openAria')}
  title={dete.status === 'off' ? t('dete.offnow.title') : t('dete.openAria')}
>
  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
    <path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />
    <path d="M8.5 10.5h7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
  </svg>
  <span class="fab-label">{t('dete.name')}{#if dete.status === 'off'}<span class="fab-state">{t('dete.tag.off')}</span>{/if}</span>
</button>
<div class="shell">
  <aside bind:this={panel} tabindex="-1" class="dete" class:open={dete.open} aria-labelledby="dete-title" aria-hidden={!dete.open} inert={!dete.open}>
    <header class="head">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="22" height="22">
          <circle cx="13" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="3" />
          <path d="M19 19l8 8" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
        </svg>
      </span>
      <div class="who">
        <h2 id="dete-title">{t('dete.name')} <span>{t('dete.role')}</span></h2>
        <p>{t('dete.sub')}</p>
      </div>
      <button class="icon-btn" onclick={closeDete} aria-label={t('dete.close')} title={t('dete.close')}>×</button>
    </header>

    <!-- Who asks, and a fresh start: only while there is somebody to ask or something to clear. -->
    {#if on || dete.messages.length}
      <div class="setup">
        <label>
          <span>{t('dete.sector')}</span>
          <select value={dete.sector} disabled={!on} onchange={(e) => setSector((e.currentTarget as HTMLSelectElement).value as Sector)}>
            {#each SECTORS as s (s)}
              <option value={s}>{t(`dete.sector.${s}`)}</option>
            {/each}
          </select>
        </label>
        {#if dete.messages.length}
          <button class="link" onclick={clearChat} disabled={dete.busy}>{t('dete.clear')}</button>
        {/if}
      </div>
    {/if}

    <div class="log" bind:this={log} aria-live="polite" aria-busy={dete.busy}>
      {#if !on}
        <!-- Off, or not known yet: what the reader sees instead of the invitation to ask. -->
        <div class="offnote">
          <p class="off-title"><span class="ring" aria-hidden="true"></span>{t(waiting ? 'dete.checking' : 'dete.offnow.title')}</p>
          {#if !waiting}
            <p>{t('dete.offnow.text')}</p>
            <button class="link" onclick={() => recheck(true)}>{t('dete.offnow.retry')}</button>
          {/if}
        </div>
      {:else if !dete.messages.length}
        <div class="hello">
          <p>{t('dete.hello')}</p>
          <p class="try">{t('dete.try')}</p>
          <ul>
            {#each SUGGESTIONS as key (key)}
              <li><button class="chip" onclick={() => suggest(key)} disabled={dete.busy}>{t(key)}</button></li>
            {/each}
          </ul>
        </div>
      {/if}
      {#each dete.messages as m (m.id)}
        {#if m.role === 'user'}
          <div class="msg user">
            <p class="sr">{t('dete.you')}:</p>
            {#if m.about}<p class="about"><span>{t('dete.about')}</span> {m.about}</p>{/if}
            <p>{m.text}</p>
          </div>
        {:else if m.note}
          <div class="msg bot note"><p class="sr">{t('dete.name')}:</p><p>{t(`dete.${m.note}`)}</p></div>
        {:else}
          <div class="msg bot">
            <p class="sr">{t('dete.name')}:</p>
            {#each blocks(m.text) as b, i (i)}
              {#if b.kind === 'p'}
                <p>{#each b.parts as part, j (j)}{#if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</p>
              {:else if b.kind === 'ul'}
                <ul>
                  {#each b.items as item, j (j)}<li>{#each item as part, k (k)}{#if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</li>{/each}
                </ul>
              {:else}
                <ol>
                  {#each b.items as item, j (j)}<li>{#each item as part, k (k)}{#if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</li>{/each}
                </ol>
              {/if}
            {/each}
            {#if m.verified}<p class="ok"><span aria-hidden="true">✓</span> {t('dete.verified')}</p>{/if}
          </div>
        {/if}
      {/each}
      {#if dete.busy}
        <div class="msg bot wait"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span> {t('dete.thinking')}</div>
      {/if}
    </div>

    <form class="ask" onsubmit={submit}>
      <label class="sr" for="dete-q">{t('dete.input')}</label>
      <textarea
        id="dete-q"
        bind:this={input}
        bind:value={draft}
        rows="2"
        maxlength="500"
        disabled={!on}
        placeholder={!on ? t('dete.offnow.title') : dete.place ? t('dete.place.placeholder', { name: dete.place.name }) : t('dete.placeholder')}
        onkeydown={onKey}
      ></textarea>
      <button class="btn primary" type="submit" disabled={!on || dete.busy || !draft.trim()}>{t('dete.send')}</button>
    </form>
    <footer class="foot">
      <p class="mem"><span class="i" aria-hidden="true">i</span>{t('dete.memory')}</p>
      <p>{t('dete.disclosure')}</p>
    </footer>
  </aside>
</div>

<style>
  .dete {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 45;
    width: min(420px, 100vw);
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto auto;
    grid-template-columns: minmax(0, 1fr);
    background: var(--surface);
    color: var(--ink);
    border-left: 1px solid var(--border-strong);
    box-shadow: -18px 0 48px rgba(0, 0, 0, 0.16);
    transform: translateX(104%);
    visibility: hidden;
    transition:
      transform 0.24s ease,
      visibility 0s linear 0.24s;
  }
  .dete.open {
    transform: none;
    visibility: visible;
    transition: transform 0.24s ease;
  }
  .dete:focus {
    outline: none;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
    padding: 16px 14px 12px 16px;
    border-bottom: 1px solid var(--border);
  }
  .mark {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--ink);
    color: var(--page);
  }
  .who h2 {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .who h2 span {
    font-size: var(--fs-micro);
    font-weight: 400;
    letter-spacing: 0;
    color: var(--ink-2);
    margin-left: 6px;
  }
  .who p {
    font-size: var(--fs-small);
    line-height: 1.4;
    color: var(--ink-2);
    margin-top: 3px;
  }
  .icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--ink-2);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .icon-btn:hover {
    background: color-mix(in srgb, var(--ink) 8%, transparent);
    color: var(--ink);
  }

  .setup {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    font-size: var(--fs-small);
  }
  .setup label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
  }
  .setup select {
    font: inherit;
    color: var(--ink);
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    padding: 5px 8px;
    max-width: 100%;
  }
  .link {
    border: 0;
    background: none;
    padding: 4px 0;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: var(--border-strong);
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }
  .link:disabled {
    opacity: 0.5;
    cursor: default;
  }
  /* The panel is the only child that shows: the wrapper adds nothing to the page. */
  .shell {
    display: contents;
  }
  /* Each part keeps its row of the panel, also when the row of «who are you» is not drawn. */
  .head {
    grid-row: 1;
  }
  .setup {
    grid-row: 2;
  }
  .log {
    grid-row: 3;
  }
  .ask {
    grid-row: 4;
  }
  .foot {
    grid-row: 5;
  }
  /* DE-T is off: said once, in plain words, where the invitation to ask would be. */
  .offnote {
    display: grid;
    gap: 8px;
    justify-items: start;
    font-size: var(--fs-small);
    line-height: 1.5;
    color: var(--ink-2);
  }
  .off-title {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: var(--fs-body);
    font-weight: 600;
    color: var(--ink);
  }
  /* An empty ring: the same mark the page uses for «nothing found». */
  .ring {
    flex: none;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1.6px solid var(--ink-2);
  }
  .ask textarea:disabled {
    background: transparent;
    border-color: var(--border);
  }
  .setup select:disabled {
    opacity: 0.5;
  }

  .log {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hello {
    display: grid;
    gap: 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .hello .try {
    font-weight: 600;
    color: var(--ink);
    margin-top: 6px;
  }
  .hello ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .chip {
    text-align: left;
    width: 100%;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--ink);
    border-radius: var(--radius);
    padding: 10px 13px;
    font-size: var(--fs-small);
    line-height: 1.4;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .chip:hover {
    border-color: var(--ink);
  }

  .msg {
    max-width: 92%;
    padding: 10px 13px;
    border-radius: var(--radius);
    font-size: var(--fs-small);
    line-height: 1.5;
    display: grid;
    gap: 7px;
    overflow-wrap: anywhere;
  }
  /* The reader writes in ink; DE-T answers on a quiet grey. */
  .msg.user {
    align-self: flex-end;
    background: var(--ink);
    color: var(--page);
    border-bottom-right-radius: 3px;
  }
  .msg.bot {
    align-self: flex-start;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    border-bottom-left-radius: 3px;
  }
  .msg ul,
  .msg ol {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 4px;
  }
  .about {
    font-size: var(--fs-micro);
    opacity: 0.72;
  }
  .about span {
    font-weight: 600;
  }
  .note {
    color: var(--ink-2);
  }
  .ok {
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--ink-2);
    border-top: 1px solid var(--border);
    padding-top: 6px;
  }
  .ok span {
    color: var(--ok);
    font-weight: 600;
  }
  .wait {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dots {
    display: inline-flex;
    gap: 3px;
  }
  .dots i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.35;
    animation: blink 1.1s infinite ease-in-out;
  }
  .dots i:nth-child(2) {
    animation-delay: 0.18s;
  }
  .dots i:nth-child(3) {
    animation-delay: 0.36s;
  }
  @keyframes blink {
    40% {
      opacity: 1;
    }
  }

  .ask {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: end;
    padding: 12px 16px 8px;
    border-top: 1px solid var(--border);
  }
  .ask textarea {
    font: inherit;
    font-size: 16px;
    line-height: 1.4;
    color: var(--ink);
    background: var(--page);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    padding: 9px 11px;
    resize: none;
    width: 100%;
  }
  .ask textarea:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .ask .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .foot {
    padding: 0 16px 14px;
    display: grid;
    gap: 5px;
    font-size: var(--fs-micro);
    line-height: 1.4;
    color: var(--muted);
  }
  .mem {
    display: flex;
    gap: 7px;
    align-items: baseline;
  }
  /* The same small «i» as the hint under the squares, instead of an emoji. */
  .i {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid currentColor;
    display: inline-grid;
    place-items: center;
    font-size: 10px;
    font-weight: 600;
    font-style: italic;
    font-family: Georgia, 'Times New Roman', serif;
    line-height: 1;
    transform: translateY(1px);
  }

  @media (max-width: 560px) {
    .dete {
      width: 100vw;
      border-left: 0;
    }
  }

  .fab {
    position: fixed;
    right: 16px;
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 30;
    height: 46px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 17px 0 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--page) 25%, transparent);
    background: var(--ink);
    color: var(--page);
    font-size: var(--fs-small);
    font-weight: 600;
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: opacity 0.3s ease;
  }
  .fab:hover {
    background: color-mix(in srgb, var(--ink) 84%, var(--page));
  }
  /* Off: an outline on the page instead of the filled button. */
  .fab.off {
    background: var(--page);
    color: var(--ink-2);
    border-color: var(--border-strong);
  }
  .fab.off:hover {
    background: var(--surface-2);
  }
  .fab-state {
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid var(--border-strong);
    font-size: var(--fs-micro);
    font-weight: 400;
  }
  /* Not over the opening Earth, and not while the panel is open. */
  :global(html[data-intro='on']) .fab,
  .fab.away {
    opacity: 0;
    pointer-events: none;
  }
  .fab.away {
    visibility: hidden;
  }
  @media (min-width: 1180px) {
    .fab {
      display: none;
    }
  }
  /* On a phone, only the round bubble, to cover as little of the text as possible. */
  @media (max-width: 560px) {
    .fab {
      width: 48px;
      height: 48px;
      padding: 0;
      justify-content: center;
    }
    .fab-label {
      display: none;
    }
    .fab svg {
      width: 21px;
      height: 21px;
    }
  }
</style>
