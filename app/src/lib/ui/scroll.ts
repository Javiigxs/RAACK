// Moving around the page. The opening Earth takes the first screens, so "go to the top" of a case
// means its tabs, not the top of the document.
// Code written with AI assistance (Claude) for team RAACK.

/** Scrolls to the tabs of the two cases, just under the header. */
export function toCases(): void {
  document.getElementById('cases')?.scrollIntoView({ block: 'start' });
}
