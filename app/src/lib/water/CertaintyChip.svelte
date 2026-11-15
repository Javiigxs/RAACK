<script lang="ts">
  // Certainty of a result, always with a mark and a word: colour never carries it.
  // The mark fills up with the evidence, like the discs of a consultant's table:
  // full, both tests agree · half, only one · empty ring, neither · dashed ring, no data to judge.
  import { t } from '../i18n';
  import type { Certainty } from './engine';

  let {
    label,
    dir = 0,
    compact = false,
    text = ''
  }: { label: Certainty; dir?: 1 | -1 | 0; compact?: boolean; text?: string } = $props();

  const showDir = $derived(dir !== 0 && (label === 'confirmed' || label === 'hint'));
</script>

<span class="cchip {label}" class:compact>
  <svg class="ico" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    {#if label === 'confirmed'}
      <circle cx="8" cy="8" r="6.4" fill="currentColor" />
    {:else if label === 'hint'}
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M8 2.4a5.6 5.6 0 0 0 0 11.2z" fill="currentColor" />
    {:else if label === 'none'}
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6" />
    {:else}
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.5 2.38" />
    {/if}
  </svg>
  <span class="txt">{text || t(`w.cert.${label}`)}{#if showDir}{' · '}{t(dir > 0 ? 'dir.rising' : 'dir.falling')}{/if}</span>
</span>

<style>
  .cchip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
  }
  .cchip.compact {
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
  /* Nothing found, or nothing to judge with: the label steps back. */
  .none,
  .nodata {
    color: var(--ink-2);
    font-weight: 500;
  }
</style>
