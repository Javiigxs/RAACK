<script lang="ts">
  import type { Verdict } from '../stats/trend';
  import { t } from '../i18n';

  let { verdict, compact = false }: { verdict: Verdict; compact?: boolean } = $props();
  const arrow = $derived(
    verdict.level === 'insufficient' || verdict.level === 'none' ? '' : verdict.direction > 0 ? '▲' : verdict.direction < 0 ? '▼' : ''
  );
</script>

<span class="chip {verdict.level}" class:compact>
  {#if arrow}
    <span class="arrow" class:up={verdict.direction > 0} class:down={verdict.direction < 0} aria-hidden="true">{arrow}</span>
  {/if}
  <span>
    {t(`verdict.${verdict.level}`)}{#if arrow}{' · '}{t(verdict.direction > 0 ? 'dir.up' : 'dir.down')}{/if}
  </span>
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 13px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 650;
    line-height: 1.2;
    border: 1.5px solid var(--ink);
    color: var(--ink);
    white-space: nowrap;
  }
  .chip.compact {
    padding: 3px 9px;
    font-size: 12.5px;
    border-width: 1px;
  }
  .chip.strong {
    background: var(--ink);
    color: var(--page);
  }
  .chip.some {
    background: transparent;
  }
  .chip.weak {
    border-color: var(--border-strong);
    font-weight: 600;
  }
  .chip.none {
    border-color: transparent;
    background: var(--surface-2);
    color: var(--ink-2);
    font-weight: 600;
  }
  .chip.insufficient {
    border: 1.5px dashed var(--axis);
    color: var(--ink-2);
    font-weight: 600;
  }
  .chip.compact.insufficient {
    border-width: 1px;
  }
  .arrow {
    font-size: 0.8em;
  }
  .arrow.up {
    color: var(--up);
  }
  .arrow.down {
    color: var(--down);
  }
</style>
