/** "Walk the fortune": scroll through the whole field at a constant speed. */
export const WALK_DURATION_MS = 20_000;

/** Where the walk is after `elapsedMs`: a straight line from start to end, then the end. */
export function walkPosition(
  start: number,
  end: number,
  elapsedMs: number,
  durationMs = WALK_DURATION_MS,
): number {
  if (elapsedMs <= 0) return start;
  if (elapsedMs >= durationMs) return end;
  return start + ((end - start) * elapsedMs) / durationMs;
}

export interface WalkOptions {
  start: number;
  end: number;
  /** Called once the walk reaches the end by itself (not when it is stopped). */
  onArrive: () => void;
}

const STOP_EVENTS = ["keydown", "wheel", "touchstart", "pointerdown"] as const;

/**
 * Start a walk. Any key press, wheel, or touch stops it. With reduced motion it jumps
 * straight to the end. Returns a function that stops it.
 */
export function startWalk({ start, end, onArrive }: WalkOptions): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: end, behavior: "auto" });
    onArrive();
    return () => {};
  }

  let frame = 0;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (frame !== 0) window.cancelAnimationFrame(frame);
    for (const name of STOP_EVENTS) window.removeEventListener(name, stop, { capture: true });
  };

  // Listen from the next frame, so the key or click that started the walk doesn't stop it.
  let startTime = 0;
  const step = (now: number) => {
    if (stopped) return;
    if (startTime === 0) {
      startTime = now;
      for (const name of STOP_EVENTS)
        window.addEventListener(name, stop, { capture: true, passive: true });
    }
    const elapsed = now - startTime;
    window.scrollTo({ top: walkPosition(start, end, elapsed), behavior: "auto" });
    if (elapsed >= WALK_DURATION_MS) {
      stop();
      onArrive();
      return;
    }
    frame = window.requestAnimationFrame(step);
  };

  window.scrollTo({ top: start, behavior: "auto" });
  frame = window.requestAnimationFrame(step);
  return stop;
}
