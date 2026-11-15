<script lang="ts">
  import { fmt } from '../catalog';
  import { t } from '../i18n';
  import { ui } from '../state.svelte';
</script>

<section class="hero" id="top">
  <div class="wrap">
    <p class="kicker">{t('hero.kicker')}</p>
    <h2 class="case-title">{t('hero.title')}</h2>
    <p class="lead">{t('hero.lead')}</p>
    <div class="cta">
      <a class="btn primary" href="#case">{t('hero.cta')} <span aria-hidden="true">↓</span></a>
      <a class="btn" href="#lab">{t('hero.cta2')}</a>
    </div>
    <dl class="stats">
      <div>
        <dt>{fmt(8401, 0, ui.lang)}</dt>
        <dd>{t('hero.stat1')}</dd>
      </div>
      <div>
        <dt>25</dt>
        <dd>{t('hero.stat2')}</dd>
      </div>
      <div>
        <dt>5</dt>
        <dd>{t('hero.stat3')}</dd>
      </div>
      <div>
        <dt>3</dt>
        <dd>{t('hero.stat4')}</dd>
      </div>
    </dl>
  </div>
</section>

<style>
  .hero {
    padding: clamp(36px, 7vw, 76px) 0 clamp(28px, 4vw, 44px);
  }
  .wrap {
    display: grid;
    gap: 18px;
  }
  .case-title {
    font-size: clamp(34px, 6vw, 62px);
    max-width: 17ch;
    letter-spacing: -0.03em;
    line-height: 1.02;
  }
  .lead {
    font-size: clamp(17px, 2vw, 20px);
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    margin: 18px 0 0;
    border-top: 1px solid var(--grid);
  }
  .stats div {
    padding: 16px 18px 4px 0;
  }
  .stats div + div {
    padding-left: 18px;
    border-left: 1px solid var(--grid);
  }
  dt {
    font-size: clamp(26px, 3.4vw, 36px);
    font-weight: 750;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  dd {
    margin: 4px 0 0;
    font-size: 13.5px;
    color: var(--ink-2);
    line-height: 1.35;
    max-width: 22ch;
  }
  @media (max-width: 720px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .stats div:nth-child(3) {
      padding-left: 0;
      border-left: 0;
    }
    .stats div:nth-child(n + 3) {
      border-top: 1px solid var(--grid);
    }
  }
</style>
