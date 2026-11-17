// Smart prefetch - respects saveData and slow connections

interface NetworkInformation extends EventTarget {
  readonly saveData?: boolean;
  readonly effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}

interface NavigatorWithConnection extends Navigator {
  readonly connection?: NetworkInformation;
}

let activeObserver: MutationObserver | null = null;

function cleanupObserver() {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
}

document.addEventListener("astro:before-swap", cleanupObserver);

document.addEventListener("astro:page-load", () => {
  cleanupObserver();

  const nav = navigator as NavigatorWithConnection;
  const conn = nav.connection;

  // Disable prefetch entirely if user has save-data enabled
  if (conn?.saveData) {
    document
      .querySelectorAll("link[rel='prefetch']")
      .forEach(el => el.remove());
    return;
  }

  // On slow connections (2g/slow-2g), disable prefetch
  if (conn?.effectiveType && ["slow-2g", "2g"].includes(conn.effectiveType)) {
    document
      .querySelectorAll("link[rel='prefetch']")
      .forEach(el => el.remove());
    return;
  }

  // On 3g, only prefetch on hover (not viewport)
  if (conn?.effectiveType === "3g") {
    // Astro's viewport observer already handles this,
    // but we intercept and remove viewport-triggered prefetches
    activeObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLLinkElement && node.rel === "prefetch") {
            // Only keep hover-triggered prefetches (they have data-astro-prefetch-hover or are hovered)
            if (!node.hasAttribute("data-astro-prefetch-hover")) {
              node.remove();
            }
          }
        }
      }
    });
    activeObserver.observe(document.head, { childList: true });
  }
});
