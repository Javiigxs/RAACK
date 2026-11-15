<script lang="ts">
  // Certainty of a result, always with an icon and a word: colour never carries it alone.
  // Green: both tests agree · amber: only one · grey: neither · black: no data to judge.
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
  <span class="ico" aria-hidden="true">
    {#if label === 'confirmed'}
      <svg viewBox="0 0 16 16" width="11" height="11"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
    {:else if label === 'hint'}
      <svg viewBox="0 0 16 16" width="11" height="11"><path d="M2.5 9.5c2-4 4-4 5.5-1.5s3.5 2.5 5.5-1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
    {:else if label === 'none'}
      <svg viewBox="0 0 16 16" width="11" height="11"><path d="M3.5 8h9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
    {:else}
      <svg viewBox="0 0 16 16" width="11" height="11"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
    {/if}
  </span>
  <span class="txt">{text || t(`w.cert.${label}`)}{#if showDir}{' · '}{t(dir > 0 ? 'dir.rising' : 'dir.falling')}{/if}</span>
</span>

<style>
  .cchip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 4px 11px 4px 5px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--ink);
    font-size: 13.5px;
    font-weight: 650;
    line-height: 1.2;
    white-space: nowrap;
  }
  .cchip.compact {
    font-size: 12.5px;
    padding: 2px 9px 2px 3px;
    gap: 6px;
  }
  .ico {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex: none;
  }
  .compact .ico {
    width: 17px;
    height: 17px;
  }
  .confirmed .ico {
    background: var(--ok);
    color: #fff;
  }
  .hint .ico {
    background: var(--warn);
    color: #0b0b0b;
  }
  .none .ico {
    background: var(--deemph);
    color: var(--surface);
  }
  .none {
    color: var(--ink-2);
  }
  .nodata .ico {
    background: var(--ink);
    color: var(--page);
  }
</style>
