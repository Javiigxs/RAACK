<script lang="ts">
  // The two investigations of the site: the water budget of a region and the inside of a year.
  // Code written with AI assistance (Claude) for team RAACK.
  import { t } from '../i18n';
  import { setView, ui, type View } from '../state.svelte';
  import { toCases } from '../ui/scroll';

  function go(view: View) {
    if (view === ui.view) return;
    setView(view);
    try {
      const url = new URL(location.href);
      if (view === 'city') url.searchParams.set('view', 'city');
      else url.searchParams.delete('view');
      url.hash = '';
      history.replaceState(null, '', url);
    } catch {
      // sin historial: el cambio de caso funciona igual
    }
    toCases();
  }
</script>

<div class="tabs" id="cases">
  <div class="wrap inner" role="group" aria-label={t('w.tabs.aria')}>
    <button aria-pressed={ui.view === 'water'} onclick={() => go('water')} aria-label={t('w.tabs.water')}>
      <span class="long">{t('w.tabs.water')}</span><span class="short">{t('w.tabs.water.short')}</span>
    </button>
    <button aria-pressed={ui.view === 'city'} onclick={() => go('city')} aria-label={t('w.tabs.city')}>
      <span class="long">{t('w.tabs.city')}</span><span class="short">{t('w.tabs.city.short')}</span>
    </button>
  </div>
</div>

<style>
  /* The two cases of the site: a line across the page and the open case marked on it. */
  .tabs {
    margin-top: clamp(40px, 6vw, 88px);
  }
  .inner {
    display: flex;
    gap: 28px;
    overflow-x: auto;
    border-bottom: 1px solid var(--border-strong);
  }
  button {
    border: 0;
    background: transparent;
    padding: 14px 0 13px;
    margin-bottom: -1px;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: var(--fs-small);
    font-weight: 500;
    color: var(--ink-2);
    white-space: nowrap;
    transition: color 0.15s;
  }
  button:hover {
    color: var(--ink);
  }
  button[aria-pressed='true'] {
    color: var(--ink);
    border-bottom-color: var(--ink);
  }
  .short {
    display: none;
  }
  @media (max-width: 600px) {
    .inner {
      gap: 20px;
    }
    .long {
      display: none;
    }
    .short {
      display: inline;
    }
  }
</style>
