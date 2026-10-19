// Comandi touch: JOYSTICK VIRTUALE flottante sulla metà sinistra dello schermo (appare dove tocchi)
// + due tasti grandi a destra (SALTA / SUPER). Scrive sullo stesso stato window._touch letto
// dalla GameScene (left/right/down/jump/special), quindi il gioco non cambia. Vibrazione dove c'è.
export function isTouchDevice() {
  return matchMedia('(hover:none),(pointer:coarse)').matches;
}

export function haptic(ms = 8) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

export function installTouch() {
  const t = window._touch || (window._touch = { left: false, right: false, jump: false, special: false, down: false });
  const zone = document.getElementById('stick-zone');
  const base = document.getElementById('stick-base');
  const knob = document.getElementById('stick-knob');
  if (!zone || !base || !knob) return;
  let id = null, ox = 0, oy = 0;
  const R = 46, DEAD = 12;
  const setKnob = (dx, dy) => { knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; };
  const reset = () => { id = null; base.classList.remove('on'); t.left = t.right = t.down = false; setKnob(0, 0); };
  zone.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    e.preventDefault();
    id = e.pointerId; try { zone.setPointerCapture(id); } catch (_) {}
    ox = e.clientX; oy = e.clientY;
    base.style.left = ox + 'px'; base.style.top = oy + 'px'; base.classList.add('on'); setKnob(0, 0);
  }, { passive: false });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const r = Math.hypot(dx, dy); if (r > R) { dx *= R / r; dy *= R / r; }
    setKnob(dx, dy);
    const wasL = t.left, wasR = t.right;
    t.left = dx < -DEAD; t.right = dx > DEAD;
    t.down = dy > 26 && Math.abs(dx) < 26;
    if ((t.left && !wasL) || (t.right && !wasR)) haptic(5);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => zone.addEventListener(ev, (e) => { if (e.pointerId === id) reset(); }));
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
}
