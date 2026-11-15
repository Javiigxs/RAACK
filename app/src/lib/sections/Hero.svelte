<script lang="ts">
  import { fmt } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';

  // The title is two sentences: the question in ink, the answer in grey.
  const title = $derived.by(() => {
    const full = t('hero.title');
    const cut = full.indexOf('? ');
    return cut < 0 ? { ask: full, say: '' } : { ask: full.slice(0, cut + 1), say: full.slice(cut + 2) };
  });
</script>

<section class="hero" id="top">
  <div class="wrap hero-in">
    <p class="kicker">{t('hero.kicker')}</p>
    <h2 class="case-title">{title.ask}{#if title.say}{' '}<span class="say">{title.say}</span>{/if}</h2>
    <div class="hero-side">
      <p class="lead">{t('hero.lead')}</p>
      <div class="cta">
        <a class="btn primary" href="#case">{t('hero.cta')} <span aria-hidden="true">↓</span></a>
        <a class="textlink" href="#lab">{t('hero.cta2')}</a>
      </div>
    </div>
    <dl class="statrow stats">
      <div>
        <dt class="v">{fmt(8401, 0, ui.lang)}</dt>
        <dd class="d">{t('hero.stat1')}</dd>
      </div>
      <div>
        <dt class="v">25</dt>
        <dd class="d">{t('hero.stat2')}</dd>
      </div>
      <div>
        <dt class="v">5</dt>
        <dd class="d">{t('hero.stat3')}</dd>
      </div>
      <div>
        <dt class="v">3</dt>
        <dd class="d">{t('hero.stat4')}</dd>
      </div>
    </dl>
  </div>
</section>

<style>
  .hero {
    padding: clamp(48px, 8vw, 112px) 0 0;
  }
  .hero-in {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px 56px;
    align-items: end;
  }
  .case-title {
    font-size: var(--fs-display);
    letter-spacing: -0.042em;
    line-height: 0.98;
    max-width: 13ch;
  }
  .say {
    color: var(--muted);
  }
  .hero-side {
    display: grid;
    gap: 24px;
    justify-items: start;
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px 22px;
  }
  .stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: clamp(28px, 5vw, 64px);
  }
  .stats .d {
    max-width: 26ch;
  }
  @media (min-width: 900px) {
    .hero-in {
      grid-template-columns: minmax(0, 11fr) minmax(0, 9fr);
    }
    .hero-in > .kicker,
    .stats {
      grid-column: 1 / -1;
    }
    .hero-side {
      padding-bottom: 0.6em;
    }
  }
  @media (max-width: 720px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
