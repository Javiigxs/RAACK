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
  .step {
    padding: 44px 0 8px;
  }
  header {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: start;
    margin-bottom: 20px;
  }
  .num {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1.5px solid var(--ink);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 17px;
    font-variant-numeric: tabular-nums;
    background: var(--surface);
  }
  .head {
    display: grid;
    gap: 6px;
  }
  h2 {
    font-size: clamp(24px, 3.2vw, 32px);
  }
  .body {
    display: grid;
    gap: 20px;
  }
  @media (max-width: 560px) {
    header {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .num {
      width: 36px;
      height: 36px;
      font-size: 15px;
    }
  }
</style>
