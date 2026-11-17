/**
 * post-progress.ts
 *
 * Implements:
 * 1. Fallback scroll reading progress bar for browsers without native scroll-driven animations.
 * 2. Reading position bookmarking and "Resume where you left off" pill toast.
 */

let scrollProgressCleanup: (() => void) | null = null;
let readingPositionCleanup: (() => void) | null = null;

export function cleanupPostProgress() {
  if (scrollProgressCleanup) {
    scrollProgressCleanup();
    scrollProgressCleanup = null;
  }
  if (readingPositionCleanup) {
    readingPositionCleanup();
    readingPositionCleanup = null;
  }
}

/** Fallback reading progress bar for browsers without scroll-driven animations support */
export function initProgressBarFallback() {
  if (scrollProgressCleanup) {
    scrollProgressCleanup();
    scrollProgressCleanup = null;
  }

  // Check if scroll-driven animations are supported natively (both timeline and range)
  if (
    typeof window !== "undefined" &&
    window.CSS &&
    CSS.supports(
      "(animation-timeline: scroll()) and (animation-range: 0% 100%)"
    )
  ) {
    return; // Handled natively by CSS
  }

  const progressBar = document.getElementById("reading-progress-bar");
  if (!progressBar) return;

  let ticking = false;
  const updateProgress = () => {
    const winScroll = document.documentElement.scrollTop;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    if (height > 0) {
      const ratio = winScroll / height;
      progressBar.style.transform = `scaleX(${ratio})`;
    }
  };

  updateProgress();

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  };

  document.addEventListener("scroll", handleScroll, { passive: true });

  scrollProgressCleanup = () => {
    document.removeEventListener("scroll", handleScroll);
  };
}

/** Estimated Reading Position — "Continue where you left off" */
export function initReadingPosition() {
  if (readingPositionCleanup) {
    readingPositionCleanup();
    readingPositionCleanup = null;
  }

  const pathname = window.location.pathname;
  const storageKey = `reading-position:${pathname}`;

  const savedData = localStorage.getItem(storageKey);
  let saved: { scrollY: number } | null = null;
  try {
    if (savedData) saved = JSON.parse(savedData);
  } catch {}

  let toast: HTMLElement | null = null;
  let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let isProgrammaticScroll = false;

  function dismissToast(clearStorage = false) {
    if (clearStorage) {
      localStorage.removeItem(storageKey);
    }
    window.removeEventListener("scroll", handleManualScroll);
    window.removeEventListener("keydown", handleKeyDown);
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    if (toast && toast.parentNode) {
      toast.classList.remove("opacity-100", "translate-y-0", "scale-100");
      toast.classList.add("opacity-0", "-translate-y-3", "scale-95");
      setTimeout(() => {
        if (toast && toast.parentNode) toast.remove();
      }, 300);
    }
  }

  function handleManualScroll() {
    if (isProgrammaticScroll) return;
    dismissToast(false);
  }

  let performResume = () => {};

  function handleKeyDown(e: KeyboardEvent) {
    const activeEl = document.activeElement;
    if (
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable))
    ) {
      return;
    }

    if (e.key.toLowerCase() === "y" || e.key === "Enter") {
      e.preventDefault();
      performResume();
    } else if (e.key === "Escape") {
      e.preventDefault();
      dismissToast(true);
    }
  }

  const currentScroll = window.scrollY;
  if (
    saved &&
    saved.scrollY > 100 &&
    Math.abs(currentScroll - saved.scrollY) > 150
  ) {
    if (document.body) {
      const mainEl = document.querySelector("#main-content");
      const resumeQuestion =
        mainEl?.getAttribute("data-resume-question") ||
        "Continue reading from where you left off?";
      const resumeBtnText = mainEl?.getAttribute("data-resume-btn") || "Resume";

      const lang = document.documentElement.lang || "en";
      const orText = lang === "es" ? "o" : "or";
      const dismissLabel = lang === "es" ? "Descartar" : "Dismiss";

      toast = document.createElement("div");
      toast.className =
        "fixed top-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3.5 rounded-full border border-accent/20 bg-background/85 px-5 py-2 shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-auto select-none opacity-0 -translate-y-4 scale-95 hover:border-accent/40";
      toast.id = "reading-resume-modal";
      toast.innerHTML = `
        <div class="absolute -inset-1.5 -z-10 rounded-full bg-accent/20 blur-md pointer-events-none animate-reading-halo"></div>
        <div class="flex items-center gap-2 text-foreground/80">
          <svg class="size-4 text-accent shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 8v4l3 3"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <span class="text-xs font-medium">${resumeQuestion}</span>
        </div>
        <div class="h-4 w-px bg-border/40"></div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <button class="px-2.5 py-1 bg-accent text-background rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-accent/80 transition-colors cursor-pointer" data-resume-btn>
              ${resumeBtnText}
            </button>
            <div class="flex items-center gap-0.5 opacity-60">
              <kbd class="toast-kbd text-[9px] scale-90">Y</kbd>
              <span class="text-[9px] text-foreground/45">${orText}</span>
              <kbd class="toast-kbd text-[9px] scale-90">↵</kbd>
            </div>
          </div>
          <button class="p-1 hover:bg-foreground/5 rounded-full text-foreground/45 hover:text-foreground/70 transition-colors cursor-pointer" aria-label="${dismissLabel}" data-dismiss-btn>
            <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        if (toast) {
          toast.classList.remove("opacity-0", "-translate-y-4", "scale-95");
          toast.classList.add("opacity-100", "translate-y-0", "scale-100");
        }
      }, 50);

      const resumeBtn = toast.querySelector("[data-resume-btn]");
      const dismissBtn = toast.querySelector("[data-dismiss-btn]");

      performResume = () => {
        isProgrammaticScroll = true;
        window.scrollTo({ top: saved?.scrollY || 0, behavior: "smooth" });
        dismissToast(false);
        setTimeout(() => {
          isProgrammaticScroll = false;
        }, 800);
      };

      resumeBtn?.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        performResume();
      });

      dismissBtn?.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        dismissToast(true);
      });

      toast.addEventListener("click", () => {
        performResume();
      });

      window.addEventListener("keydown", handleKeyDown);

      setTimeout(() => {
        window.addEventListener("scroll", handleManualScroll);
      }, 150);

      autoDismissTimer = setTimeout(() => {
        dismissToast(false);
      }, 5000);
    }
  }

  function handleScrollSave() {
    if (isProgrammaticScroll) return;

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollPercent = (window.scrollY / scrollHeight) * 100;

      if (scrollPercent < 5 || window.scrollY < 100) {
        localStorage.removeItem(storageKey);
      } else if (scrollPercent >= 95) {
        localStorage.removeItem(storageKey);
      } else {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              scrollY: window.scrollY,
              percentage: scrollPercent,
              timestamp: Date.now(),
            })
          );
        } catch {}
      }
    }, 200);
  }

  window.addEventListener("scroll", handleScrollSave, { passive: true });

  readingPositionCleanup = () => {
    window.removeEventListener("scroll", handleScrollSave);
    window.removeEventListener("scroll", handleManualScroll);
    window.removeEventListener("keydown", handleKeyDown);
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    if (saveTimeout) clearTimeout(saveTimeout);
    document.getElementById("reading-resume-modal")?.remove();
  };
}
