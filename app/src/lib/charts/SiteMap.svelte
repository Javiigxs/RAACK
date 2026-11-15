<script lang="ts">
  // Mapa del caso sobre una imagen satelital real (NASA GIBS, HLS S30, 14 de marzo de 2025).
  // La imagen está en coordenadas geográficas: la posición es lineal en latitud y longitud.
  import { CELLS, MAP, MODIS_SITES, type SiteId } from '../catalog';
  import { t } from '../i18n';
  import type { CaseData } from '../types';

  let {
    data,
    selected = null,
    selectable = [],
    onselect,
    marks = {},
    cells = [],
    showStation = true,
    showPins = true
  }: {
    data: CaseData;
    selected?: SiteId | null;
    selectable?: SiteId[];
    onselect?: (s: SiteId) => void;
    /** Resultado por lugar: dirección (+1 sube, −1 baja, 0 nada) para colorear el marcador. */
    marks?: Partial<Record<SiteId, number>>;
    cells?: ('cell' | 'merra')[];
    showStation?: boolean;
    /** Dibujar los cinco puntos MODIS. Se ocultan cuando la pista no existe en ellos (lluvia, humedad, aire). */
    showPins?: boolean;
  } = $props();

  const px = (lon: number) => ((lon - MAP.lonMin) / (MAP.lonMax - MAP.lonMin)) * MAP.w;
  const py = (lat: number) => ((MAP.latMax - lat) / (MAP.latMax - MAP.latMin)) * MAP.h;

  const rects = $derived(
    cells.map((id) => {
      const c = CELLS[id];
      const x0 = Math.max(0, px(c.lonMin));
      const x1 = Math.min(MAP.w, px(c.lonMax));
      const y0 = Math.max(0, py(c.latMax));
      const y1 = Math.min(MAP.h, py(c.latMin));
      return { id, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    })
  );

  interface Pin {
    id: SiteId;
    x: number;
    y: number;
    kind: 'pixel' | 'station';
  }
  const pins = $derived.by(() => {
    const out: Pin[] = (showPins ? MODIS_SITES : [])
      .filter((s) => data.sites[s])
      .map((s) => ({
        id: s,
        x: px(data.sites[s].lon),
        y: py(data.sites[s].lat),
        kind: 'pixel' as const
      }));
    if (showStation) out.push({ id: 'station', x: px(data.station.lon), y: py(data.station.lat), kind: 'station' });
    return out;
  });

  // 20 km sobre el paralelo de Monterrey
  const kmPerDegLon = 111.32 * Math.cos((25.68 * Math.PI) / 180);
  const scalePx = (20 / kmPerDegLon / (MAP.lonMax - MAP.lonMin)) * MAP.w;

  function activate(id: SiteId) {
    if (selectable.includes(id)) onselect?.(id);
  }
  function key(e: KeyboardEvent, id: SiteId) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(id);
    }
  }
  const dim = (id: SiteId) => selectable.length > 0 && !selectable.includes(id) && id !== selected;

  // Lado de cada etiqueta, elegido a mano para que no se pisen: el centro, Chipinque, Carretera Nacional
  // y el observatorio quedan a pocos kilómetros unos de otros.
  const LABEL_LEFT: Partial<Record<SiteId, boolean>> = { chipinque: true, station: true, pesqueriakia: true };
</script>

<figure class="map">
  <svg viewBox="0 0 {MAP.w} {MAP.h}" role="group" aria-label={t('map.aria')}>
    <image href={MAP.image} x="0" y="0" width={MAP.w} height={MAP.h} preserveAspectRatio="none" />
    <rect x="0" y="0" width={MAP.w} height={MAP.h} fill="#000" opacity="0.12" />

    {#each rects as r (r.id)}
      {@const isSel = selected === r.id}
      {@const canSel = selectable.includes(r.id)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        class="cell"
        class:sel={isSel}
        class:can={canSel}
        role={canSel ? 'button' : undefined}
        tabindex={canSel ? 0 : undefined}
        aria-label={canSel ? t(`site.${r.id}.name`) : undefined}
        aria-pressed={canSel ? isSel : undefined}
        onclick={() => activate(r.id)}
        onkeydown={(e) => key(e, r.id)}
      >
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="6" />
        <text x={r.x + (r.id === 'merra' ? 14 : 0)} y={r.y + r.h + (r.id === 'merra' ? -18 : 36)} class="lbl">{t(`map.${r.id}`)}</text>
      </g>
    {/each}

    {#each pins as p (p.id)}
      {@const isSel = selected === p.id}
      {@const canSel = selectable.includes(p.id)}
      {@const mark = marks[p.id]}
      {@const left = LABEL_LEFT[p.id] === true}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        class="pin"
        class:sel={isSel}
        class:can={canSel}
        class:dim={dim(p.id)}
        role={canSel ? 'button' : undefined}
        tabindex={canSel ? 0 : undefined}
        aria-label={t(`site.${p.id}.name`)}
        aria-pressed={canSel ? isSel : undefined}
        onclick={() => activate(p.id)}
        onkeydown={(e) => key(e, p.id)}
      >
        <circle cx={p.x} cy={p.y} r="44" fill="transparent" />
        {#if isSel}
          <circle cx={p.x} cy={p.y} r="31" fill="none" stroke="#fff" stroke-width="5" />
        {/if}
        {#if p.kind === 'station'}
          <path d="M{p.x},{p.y - 22} L{p.x + 20},{p.y + 14} L{p.x - 20},{p.y + 14} Z" class="shape" />
        {:else}
          <circle cx={p.x} cy={p.y} r="19" class="shape" class:up={mark === 1} class:down={mark === -1} />
          {#if mark === 1}
            <path d="M{p.x - 8},{p.y + 5} L{p.x},{p.y - 8} L{p.x + 8},{p.y + 5} Z" fill="#fff" />
          {:else if mark === -1}
            <path d="M{p.x - 8},{p.y - 5} L{p.x},{p.y + 8} L{p.x + 8},{p.y - 5} Z" fill="#fff" />
          {/if}
        {/if}
        <text x={p.x + (left ? -30 : 30)} y={p.y} dy="0.34em" text-anchor={left ? 'end' : 'start'} class="lbl">{t(`site.${p.id}.short`)}</text>
      </g>
    {/each}

    <g transform="translate({MAP.w - scalePx - 34}, {MAP.h - 60})">
      <line x1="0" x2={scalePx} y1="0" y2="0" stroke="#fff" stroke-width="5" stroke-linecap="round" />
      <text x={scalePx / 2} y="-14" text-anchor="middle" class="lbl small">20 km</text>
    </g>
  </svg>
  <figcaption>{t('map.credit')}</figcaption>
</figure>

<style>
  .map {
    margin: 0;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 12px;
    background: #2b2b28;
  }
  figcaption {
    font-size: 12px;
    color: var(--muted);
    margin-top: 6px;
  }
  .lbl {
    font-size: 30px;
    font-weight: 600;
    fill: #fff;
    paint-order: stroke;
    stroke: rgba(0, 0, 0, 0.78);
    stroke-width: 7px;
    stroke-linejoin: round;
    font-family: var(--font);
  }
  .lbl.small {
    font-size: 26px;
  }
  .cell rect {
    fill: rgba(255, 255, 255, 0.07);
    stroke: #fff;
    stroke-width: 3.5;
    stroke-dasharray: 14 10;
  }
  .cell.sel rect {
    fill: rgba(42, 120, 214, 0.28);
    stroke-dasharray: none;
    stroke-width: 5;
  }
  .cell.can,
  .pin.can {
    cursor: pointer;
  }
  .pin .shape {
    fill: #fff;
    stroke: rgba(0, 0, 0, 0.8);
    stroke-width: 4;
  }
  .pin.sel .shape {
    fill: #2a78d6;
  }
  .pin .shape.up {
    fill: #e34948;
  }
  .pin .shape.down {
    fill: #2a78d6;
  }
  .pin.dim {
    opacity: 0.55;
  }
  .pin.can:hover .shape,
  .cell.can:hover rect {
    stroke-width: 6;
  }
  .pin:focus-visible,
  .cell:focus-visible {
    outline: none;
  }
  .pin:focus-visible .shape,
  .cell:focus-visible rect {
    stroke: #ffd24a;
    stroke-width: 7;
  }
</style>
