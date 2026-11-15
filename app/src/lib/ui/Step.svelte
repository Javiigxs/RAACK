<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    n,
    id,
    kicker,
    title,
    lead = '',
    children
  }: { n: string; id: string; kicker: string; title: string; lead?: string; children: Snippet } = $props();
</script>

<section {id} class="step">
  <header>
    <div class="num" aria-hidden="true">{n}</div>
    <div class="head">
      <p class="kicker">{kicker}</p>
      <h2>{title}</h2>
      {#if lead}<p class="lead">{lead}</p>{/if}
    </div>
  </header>
  <div class="body">
    {@render children()}
  </div>
</section>

<style>
  /* A step of the investigation: a thin line, its number in grey and the title beside it. */
  .step {
    margin-top: clamp(56px, 7vw, 96px);
    padding-top: 18px;
    border-top: 1px solid var(--border);
  }
  header {
    display: grid;
    grid-template-columns: 3.2rem minmax(0, 1fr);
    gap: 0;
    align-items: start;
    margin-bottom: var(--gap-block);
  }
  .num {
    font-size: clamp(24px, 2.6vw, 32px);
    font-weight: 500;
    letter-spacing: -0.03em;
    line-height: 1.08;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    padding-top: calc(var(--fs-small) * 1.4 + 10px);
  }
  .head {
    display: grid;
    gap: 10px;
  }
  h2 {
    font-size: clamp(24px, 2.6vw, 32px);
    letter-spacing: -0.03em;
  }
  .body {
    display: grid;
    gap: var(--gap-block);
  }
  @media (max-width: 560px) {
    header {
      grid-template-columns: 2.4rem minmax(0, 1fr);
    }
  }
</style>
