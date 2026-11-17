/**
 * post-reading-mode.ts
 *
 * Implements distractor-free Reading Mode for article reading, including:
 * - Fullscreen minimalist article view toggling
 * - Serif / Sans typography family toggle
 * - Font scale increment and decrement (80% - 150%)
 * - LocalStorage persistence and keyboard shortcut ('r' / 'Escape') controls
 */

const SCALE_CLASSES = [
  "font-scale-1",
  "font-scale-2",
  "font-scale-3",
  "font-scale-4",
  "font-scale-5",
  "font-scale-6",
  "font-scale-7",
  "font-scale-8",
];

let keydownCleanup: ((e: KeyboardEvent) => void) | null = null;

export function cleanupReadingMode() {
  if (keydownCleanup) {
    window.removeEventListener("keydown", keydownCleanup);
    keydownCleanup = null;
  }
  if (typeof document !== "undefined" && document.body) {
    document.body.classList.remove(
      "reading-mode-active",
      "font-serif-active",
      ...SCALE_CLASSES
    );
  }
}

export function initReadingMode() {
  cleanupReadingMode();

  const readModeBtn = document.getElementById("read-mode-btn");
  const controlsPill = document.getElementById("reading-controls-pill");
  const fontSansBtn = document.getElementById("reading-font-sans");
  const fontSerifBtn = document.getElementById("reading-font-serif");
  const sizeDecBtn = document.getElementById("reading-size-dec");
  const sizeIncBtn = document.getElementById("reading-size-inc");
  const sizeDisplay = document.getElementById("reading-size-display");
  const exitBtn = document.getElementById("reading-exit-btn");

  if (!readModeBtn || !controlsPill) return;

  const SCALE_LABELS = [
    "80%",
    "90%",
    "100%",
    "110%",
    "120%",
    "130%",
    "140%",
    "150%",
  ];

  let activeFont = localStorage.getItem("reading-mode-font") || "sans";
  let activeScaleIndex = parseInt(
    localStorage.getItem("reading-mode-scale") || "2",
    10
  );
  if (
    isNaN(activeScaleIndex) ||
    activeScaleIndex < 0 ||
    activeScaleIndex >= SCALE_CLASSES.length
  ) {
    activeScaleIndex = 2;
  }

  function applyFontPreferences() {
    if (activeFont === "serif") {
      document.body.classList.add("font-serif-active");
      fontSerifBtn?.classList.remove(
        "text-foreground/60",
        "hover:bg-foreground/5"
      );
      fontSerifBtn?.classList.add("bg-accent", "text-background");
      fontSansBtn?.classList.remove("bg-accent", "text-background");
      fontSansBtn?.classList.add("text-foreground/60", "hover:bg-foreground/5");
    } else {
      document.body.classList.remove("font-serif-active");
      fontSansBtn?.classList.remove(
        "text-foreground/60",
        "hover:bg-foreground/5"
      );
      fontSansBtn?.classList.add("bg-accent", "text-background");
      fontSerifBtn?.classList.remove("bg-accent", "text-background");
      fontSerifBtn?.classList.add(
        "text-foreground/60",
        "hover:bg-foreground/5"
      );
    }
  }

  function applyScalePreferences() {
    SCALE_CLASSES.forEach(cls => document.body.classList.remove(cls));
    const targetClass = SCALE_CLASSES[activeScaleIndex];
    if (targetClass) {
      document.body.classList.add(targetClass);
    }
    if (sizeDisplay) {
      sizeDisplay.textContent = SCALE_LABELS[activeScaleIndex] || "100%";
    }
  }

  applyFontPreferences();
  applyScalePreferences();

  function toggleReadingMode() {
    if (!controlsPill) return;
    const isActive = document.body.classList.toggle("reading-mode-active");

    if (isActive) {
      controlsPill.classList.remove(
        "opacity-0",
        "translate-y-10",
        "scale-95",
        "pointer-events-none"
      );
      controlsPill.classList.add("opacity-100", "translate-y-0", "scale-100");
    } else {
      controlsPill.classList.remove(
        "opacity-100",
        "translate-y-0",
        "scale-100"
      );
      controlsPill.classList.add(
        "opacity-0",
        "translate-y-10",
        "scale-95",
        "pointer-events-none"
      );
    }
  }

  readModeBtn.addEventListener("click", toggleReadingMode);
  exitBtn?.addEventListener("click", toggleReadingMode);

  fontSansBtn?.addEventListener("click", () => {
    activeFont = "sans";
    localStorage.setItem("reading-mode-font", activeFont);
    applyFontPreferences();
  });

  fontSerifBtn?.addEventListener("click", () => {
    activeFont = "serif";
    localStorage.setItem("reading-mode-font", activeFont);
    applyFontPreferences();
  });

  sizeDecBtn?.addEventListener("click", () => {
    if (activeScaleIndex > 0) {
      activeScaleIndex--;
      localStorage.setItem("reading-mode-scale", activeScaleIndex.toString());
      applyScalePreferences();
    }
  });

  sizeIncBtn?.addEventListener("click", () => {
    if (activeScaleIndex < SCALE_CLASSES.length - 1) {
      activeScaleIndex++;
      localStorage.setItem("reading-mode-scale", activeScaleIndex.toString());
      applyScalePreferences();
    }
  });

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

    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      toggleReadingMode();
    } else if (
      e.key === "Escape" &&
      document.body.classList.contains("reading-mode-active")
    ) {
      e.preventDefault();
      toggleReadingMode();
    }
  }

  keydownCleanup = handleKeyDown;
  window.addEventListener("keydown", handleKeyDown);
}
