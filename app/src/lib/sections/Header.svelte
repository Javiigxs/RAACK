<script lang="ts">
  import { onMount } from 'svelte';
  import type { Lang } from '../catalog';
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
    background: color-mix(in srgb, var(--page) 88%, transparent);
    backdrop-filter: blur(10px);
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
    font-weight: 750;
    font-size: 17px;
    letter-spacing: -0.01em;
  }
  .team {
    font-size: 12px;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-2);
    padding-left: 9px;
    border-left: 1px solid var(--axis);
  }
  nav {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }
  nav a {
    padding: 7px 11px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-2);
    text-decoration: none;
  }
  nav a:hover {
    background: var(--surface-2);
    color: var(--ink);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    cursor: pointer;
    color: var(--ink);
  }
  .icon:hover {
    background: var(--surface-2);
  }
  /* On a narrow screen the motion button would push the name onto two lines: the world section
     carries the same switch next to the globe. */
  @media (max-width: 480px) {
    .motion {
      display: none;
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
