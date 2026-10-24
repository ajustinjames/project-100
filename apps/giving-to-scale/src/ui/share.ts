/**
 * The "Share this gift" button. The link it shares is built by core/share-link.ts
 * and carries only the gift, the fortune, and the currency.
 */
export interface ShareControls {
  section: HTMLElement;
  button: HTMLButtonElement;
  note: HTMLElement;
  status: HTMLElement;
  /** Bring the view up to date with the inputs, which may have changed within the debounce. */
  refresh: () => void;
}

export interface ShareView {
  /** Show the button for a fragment, disable it with the note for null, or hide it all. */
  update(state: { visible: false } | { visible: true; fragment: string | null }): void;
}

function announce(status: HTMLElement, text: string): void {
  // Clear first so the same message is announced again on a second press.
  status.textContent = "";
  window.requestAnimationFrame(() => {
    status.textContent = text;
  });
}

async function copyLink(status: HTMLElement, url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    announce(status, "Link copied");
  } catch {
    announce(status, `Copy this link: ${url}`);
  }
}

export function createShareView(controls: ShareControls): ShareView {
  const { section, button, note, status, refresh } = controls;
  let fragment: string | null = null;

  button.addEventListener("click", async () => {
    // A click can come within the input debounce, so share what the inputs say now.
    refresh();
    if (fragment === null || section.hidden) return;
    const url = `${window.location.origin}${window.location.pathname}${fragment}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (error) {
        // The reader closed the share sheet; nothing to report.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink(status, url);
  });

  return {
    update(state) {
      section.hidden = !state.visible;
      const nextFragment = state.visible ? state.fragment : null;
      if (nextFragment !== fragment) status.textContent = "";
      fragment = nextFragment;
      const disabled = state.visible && state.fragment === null;
      button.disabled = disabled;
      note.hidden = !disabled;
    },
  };
}
