import type { Api } from '@lichess-org/chessground/api';

// Track all mounted boards so one board cannot clear another board's drag cursor.
const grabbingBoards = new Set<HTMLElement>();
export function installPieceCursor(api: Api, host: HTMLElement) {
  let held = false, inside = false, point: [number, number] | undefined;
  const previous = host.getAttribute('data-piece-cursor');
  function refresh() {
    const state = api.state;
    const interactive = !state.viewOnly && state.draggable.enabled && !state.dom.destroyed;
    const grabbing = !!(interactive && held && state.draggable.current);
    if (grabbing) grabbingBoards.add(host); else grabbingBoards.delete(host);
    document.documentElement.classList.toggle('neo-piece-grab', grabbingBoards.size > 0);
    const key = inside && point ? api.getKeyAtDomPos(point) : undefined;
    const hover = interactive && key && state.pieces.has(key);
    if (grabbing || hover) host.dataset.pieceCursor = grabbing ? 'grabbing' : 'grab';
    else host.removeAttribute('data-piece-cursor');
  }
  const move = (event: MouseEvent) => {
    inside = true; point = [event.clientX, event.clientY];
    // Recover after a mouse release outside the webview.
    if (event.type === 'mousemove' && event.buttons === 0) held = false;
    refresh();
  };
  const down = (event: MouseEvent) => {
    if (event.button !== 0) return;
    held = true; inside = true; point = [event.clientX, event.clientY]; refresh();
  };
  const leave = () => { inside = false; refresh(); };
  const release = () => { held = false; refresh(); };
  const blur = () => { inside = false; held = false; refresh(); };
  // Bubble after Chessground has accepted/rejected the pickup.
  host.addEventListener('mousedown', down);
  host.addEventListener('mousemove', move);
  host.addEventListener('mouseenter', move);
  host.addEventListener('mouseleave', leave);
  document.addEventListener('mouseup', release, true);
  window.addEventListener('blur', blur);
  return Object.assign(() => {
    host.removeEventListener('mousedown', down);
    host.removeEventListener('mousemove', move);
    host.removeEventListener('mouseenter', move);
    host.removeEventListener('mouseleave', leave);
    document.removeEventListener('mouseup', release, true);
    window.removeEventListener('blur', blur);
    grabbingBoards.delete(host);
    document.documentElement.classList.toggle('neo-piece-grab', grabbingBoards.size > 0);
    if (previous === null) host.removeAttribute('data-piece-cursor');
    else host.setAttribute('data-piece-cursor', previous);
  }, { refresh });
}
