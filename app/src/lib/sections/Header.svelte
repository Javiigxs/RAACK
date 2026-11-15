<script lang="ts">
  import { onMount } from 'svelte';
  import type { Lang } from '../catalog';
  import { dete, openDete } from '../dete/dete.svelte';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
  import { isStill, motion, setMotion } from '../ui/motion.svelte';

  let dark = $state(false);

  onMount(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('raack-theme');
    } catch {
      // sin almacenamiento local
    }
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.dataset.theme = saved;
      dark = saved === 'dark';
    } else {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  });

  function toggleTheme() {
    dark = !dark;
    const v = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = v;
    try {
      localStorage.setItem('raack-theme', v);
    } catch {
      // sin almacenamiento local
    }
  }

  function setLang(l: Lang) {
    ui.lang = l;
    try {
      localStorage.setItem('raack-lang', l);
    } catch {
      // sin almacenamiento local
    }
  }
</script>

<header class="bar">
  <div class="wrap inner">
    <a class="brand" href="#intro" aria-label={t('intro.home')}>
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <circle cx="13" cy="13" r="8" fill="none" stroke="var(--accent)" stroke-width="3" />
        <path d="M9 15l3-3 2.5 2 3-4" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M19 19l8 8" stroke="var(--ink)" stroke-width="3.5" stroke-linecap="round" />
      </svg>
      <span class="name">{t('app.name')}</span>
      <span class="team">{t('app.team')}</span>
    </a>
    <nav aria-label={t('nav.aria')}>
      {#if ui.view === 'water'}
        <a href="#w-verdict">{t('w.nav.verdict')}</a>
        <a href="#w-suspects">{t('w.nav.suspects')}</a>
        <a href="#w-evidence">{t('w.nav.evidence')}</a>
        <a href="#w-options">{t('w.nav.options')}</a>
        <a href="#w-world">{t('w.nav.world')}</a>
        <a href="#w-methods">{t('w.nav.methods')}</a>
      {:else}
        <a href="#case">{t('nav.case')}</a>
        <a href="#lab">{t('nav.lab')}</a>
        <a href="#file">{t('nav.file')}</a>
      {/if}
    </nav>
    <div class="tools">
      <!-- DE-T, the case assistant: always here. While its server does not answer (a static copy of
           the site, or the team has it off), a word says so and the panel explains it. -->
      <button
        class="ask"
        class:off={dete.status === 'off'}
        onclick={() => openDete()}
        aria-label={dete.status === 'off' ? t('dete.offAria') : t('dete.openAria')}
        aria-expanded={dete.open}
        title={dete.status === 'off' ? t('dete.offnow.title') : t('dete.openAria')}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />
          <path d="M8.5 10.5h7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
        </svg>
        <span class="ask-label">{t('dete.open')}</span>
        {#if dete.status === 'off'}<span class="ask-state">{t('dete.tag.off')}</span>{/if}
      </button>
      <div class="seg" role="group" aria-label={t('header.lang')}>
        <button aria-pressed={ui.lang === 'en'} onclick={() => setLang('en')} lang="en">EN</button>
        <button aria-pressed={ui.lang === 'es'} onclick={() => setLang('es')} lang="es">ES</button>
      </div>
      <!-- Only where it matters: the system asks for less motion, or the reader already chose. -->
      {#if motion.system || motion.choice}
        <button
          class="icon motion"
          aria-pressed={!isStill()}
          onclick={() => setMotion(isStill() ? 'full' : 'less')}
          aria-label={t(isStill() ? 'header.motion.on' : 'header.motion.off')}
          title={t(isStill() ? 'header.motion.on' : 'header.motion.off')}
        >
          {#if isStill()}
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
          {:else}
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M7 5.5h3.4v13H7zM13.6 5.5H17v13h-3.4z" fill="currentColor" /></svg>
          {/if}
        </button>
      {/if}
      <button class="icon" onclick={toggleTheme} aria-label={t(dark ? 'header.toLight' : 'header.toDark')} title={t(dark ? 'header.toLight' : 'header.toDark')}>
        {#if dark}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
            ><circle cx="12" cy="12" r="4.5" fill="currentColor" /><path
              d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            /></svg
          >
        {:else}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" fill="currentColor" /></svg>
        {/if}
      </button>
    </div>
  </div>
</header>

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--page) 84%, transparent);
    backdrop-filter: saturate(1.4) blur(14px);
    -webkit-backdrop-filter: saturate(1.4) blur(14px);
    border-bottom: 1px solid var(--border);
    transition:
      background 0.35s ease,
      border-color 0.35s ease;
  }
  /* Over the opening Earth the bar is clear glass; it frosts once the text of the intro is gone. */
  :global(html[data-intro='on']) .bar {
    background: transparent;
    backdrop-filter: none;
    border-bottom-color: transparent;
  }
  .inner {
    display: flex;
    align-items: center;
    gap: 18px;
    height: 58px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    color: var(--ink);
  }
  .name {
    font-weight: 600;
    font-size: 16px;
    letter-spacing: -0.015em;
    white-space: nowrap;
  }
  .team {
    font-size: var(--fs-small);
    color: var(--ink-2);
    padding-left: 10px;
    border-left: 1px solid var(--border-strong);
  }
  nav {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }
  nav a {
    padding: 7px 11px;
    border-radius: var(--r-pill);
    font-size: var(--fs-small);
    color: var(--ink-2);
    text-decoration: none;
    transition: color 0.15s;
  }
  nav a:hover {
    color: var(--ink);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tools :global(.seg) {
    margin-right: 4px;
  }
  /* Ghost buttons: no outline until the pointer is on them. */
  .icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 0;
    background: transparent;
    cursor: pointer;
    color: var(--ink-2);
    transition:
      background-color 0.15s,
      color 0.15s;
  }
  .icon:hover {
    background: color-mix(in srgb, var(--ink) 8%, transparent);
    color: var(--ink);
  }
  .ask {
    height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 14px 0 12px;
    margin-right: 6px;
    border-radius: var(--r-pill);
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .ask:hover {
    border-color: var(--ink);
  }
  /* Off: the button steps back and a word says it; it still opens the panel, which explains why. */
  .ask.off {
    color: var(--ink-2);
    border-color: var(--border);
  }
  .ask-state {
    padding-left: 8px;
    border-left: 1px solid var(--border-strong);
    font-size: var(--fs-micro);
    color: var(--muted);
  }
  /* Below the full width of the page there is no room for it: it would push the name onto two lines.
     DE-T's round button in the corner of the screen (dete/Dete.svelte) takes its place. */
  @media (max-width: 1179px) {
    .ask {
      display: none;
    }
  }
  /* On a narrow screen the motion button would push the name onto two lines: the world section
     carries the same switch next to the globe. */
  @media (max-width: 480px) {
    .motion {
      display: none;
    }
  }
  /* The narrowest screens (and a narrow side panel): the name stays on one line. */
  @media (max-width: 380px) {
    .inner {
      gap: 10px;
    }
    .brand {
      gap: 7px;
    }
    .name {
      font-size: 15px;
    }
    .tools :global(.seg button) {
      padding: 6px 9px;
    }
  }
  @media (max-width: 760px) {
    nav {
      display: none;
    }
    .tools {
      margin-left: auto;
    }
    .team {
      display: none;
    }
  }
</style>
