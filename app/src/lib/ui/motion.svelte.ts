// Motion of the site: the opening sequence of the Earth and the turn of the globe.
// By default the site follows the system: when it asks for less motion, the Earth holds still and
// the globe jumps to a country instead of turning. The reader can decide otherwise for this site
// (the button in the header, or ?motion=full / ?motion=less in the address); the choice is kept.
// Code written with AI assistance (Claude) for team RAACK.

export type MotionChoice = 'full' | 'less';

const KEY = 'raack-motion';

export const motion = $state({
  /** The system asks for less motion. */
  system: false,
  /** What the reader chose for this site, if anything. */
  choice: null as MotionChoice | null
});

/** True when the site should hold still. */
export function isStill(): boolean {
  return motion.choice ? motion.choice === 'less' : motion.system;
}

/** The style sheet reads this mark to switch transitions and animations on or off. */
function mark(): void {
  document.documentElement.dataset.motion = isStill() ? 'less' : 'full';
}

export function setMotion(choice: MotionChoice): void {
  motion.choice = choice;
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // no local storage: the choice lasts until the page is closed
  }
  mark();
}

// Read once, before any part of the page is drawn (this module is loaded by the first screen).
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.system = query.matches;
  let saved: string | null = null;
  try {
    saved = new URLSearchParams(location.search).get('motion') ?? localStorage.getItem(KEY);
  } catch {
    // no address or storage to read: follow the system
  }
  if (saved === 'full' || saved === 'less') motion.choice = saved;
  query.addEventListener('change', () => {
    motion.system = query.matches;
    mark();
  });
  mark();
}
