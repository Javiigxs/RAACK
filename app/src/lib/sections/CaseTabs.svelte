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
  .tabs {
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .inner {
    display: flex;
    gap: 4px;
    overflow-x: auto;
  }
  button {
    border: 0;
    background: transparent;
    padding: 11px 14px 9px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 650;
    color: var(--ink-2);
    white-space: nowrap;
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
    button {
      padding: 10px 8px 8px;
      font-size: 13px;
    }
    .long {
      display: none;
    }
    .short {
      display: inline;
    }
  }
</style>
