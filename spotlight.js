// A soft light-blue glow that follows the mouse across the page. It eases
// toward the pointer instead of snapping, and does nothing on touch screens
// or with reduced motion.

if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const root = document.documentElement;
  const EASE = 0.16;
  let targetX = innerWidth / 2, targetY = innerHeight / 3;
  let x = targetX, y = targetY;
  let running = false;

  function frame() {
    x += (targetX - x) * EASE;
    y += (targetY - y) * EASE;
    root.style.setProperty("--mx", `${x.toFixed(1)}px`);
    root.style.setProperty("--my", `${y.toFixed(1)}px`);
    if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) requestAnimationFrame(frame);
    else running = false;
  }

  addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    root.classList.add("spotlight-on");
    if (!running) { running = true; requestAnimationFrame(frame); }
  }, { passive: true });
  document.addEventListener("pointerleave", () => root.classList.remove("spotlight-on"));
}
