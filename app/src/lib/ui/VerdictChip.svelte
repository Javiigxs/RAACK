<script lang="ts">
  // The verdict of a series, with a mark and a word: colour never carries it.
  // The disc fills with the tests that see the change: full, every one of them · large wedge, two ·
  // small wedge, only one · empty ring, none · dashed ring, not enough data to judge.
  import type { Verdict } from '../stats/trend';
  import { t } from '../i18n';

  let { verdict, compact = false }: { verdict: Verdict; compact?: boolean } = $props();
  const directed = $derived(verdict.level !== 'insufficient' && verdict.level !== 'none' && verdict.direction !== 0);
</script>

<span class="chip {verdict.level}" class:compact>
  <svg class="ico" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    {#if verdict.level === 'strong'}
      <circle cx="8" cy="8" r="6.4" fill="currentColor" />
    {:else if verdict.level === 'insufficient'}
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.5 2.38" />
    {:else}
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6" />
      {#if verdict.level === 'some'}
        <path d="M8 8V2.4A5.6 5.6 0 1 1 3.15 10.8z" fill="currentColor" />
      {:else if verdict.level === 'weak'}
        <path d="M8 8V2.4A5.6 5.6 0 0 1 12.85 10.8z" fill="currentColor" />
      {/if}
    {/if}
  </svg>
  <span>
    {t(`verdict.${verdict.level}`)}{#if directed}{' · '}{t(verdict.direction > 0 ? 'dir.up' : 'dir.down')}{/if}
  </span>
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.3;
    color: var(--ink);
    white-space: nowrap;
  }
  .chip.compact {
    font-weight: 500;
    gap: 6px;
  }
  .ico {
    flex: none;
  }
  .compact .ico {
    width: 11px;
    height: 11px;
  }
  .weak,
  .none,
  .insufficient {
    font-weight: 500;
  }
  .none,
  .insufficient {
    color: var(--ink-2);
  }
</style>
