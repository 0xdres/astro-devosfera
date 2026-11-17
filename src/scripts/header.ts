let scrollCleanup: AbortController | null = null;
let mobileNavCleanup: AbortController | null = null;
let moreCleanup: AbortController | null = null;

function setupScrollPhysics() {
  if (scrollCleanup) scrollCleanup.abort();
  scrollCleanup = new AbortController();
  const { signal } = scrollCleanup;

  const header = document.getElementById("main-header");
  const navWrap = document.getElementById("top-nav-wrap");
  const borderLine = document.getElementById("header-border");

  if (!header || !navWrap || !borderLine) return;

  let rafPending = false;
  const handleScroll = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY > 15;
      header.classList.toggle("header-scrolled", scrolled);
      navWrap.classList.toggle("sm:py-5", !scrolled);
      navWrap.classList.toggle("sm:py-3", scrolled);
      borderLine.classList.toggle("opacity-0", !scrolled);
      borderLine.classList.toggle("opacity-100", scrolled);
      rafPending = false;
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true, signal });
  handleScroll(); // Init instantly
}

function setupMobileNav() {
  if (mobileNavCleanup) mobileNavCleanup.abort();
  mobileNavCleanup = new AbortController();
  const { signal } = mobileNavCleanup;

  const menuBtn = document.querySelector("#menu-btn");
  const mobileMenu = document.querySelector("#mobile-menu");
  const backdrop = document.querySelector(".mobile-menu-backdrop");

  if (!menuBtn || !mobileMenu) return;

  const labelOpen = menuBtn.getAttribute("data-label-open") || "Open Menu";
  const labelClose = menuBtn.getAttribute("data-label-close") || "Close Menu";

  const closeMenu = () => {
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", labelOpen);
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
  };

  menuBtn.addEventListener(
    "click",
    () => {
      const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
      } else {
        menuBtn.setAttribute("aria-expanded", "true");
        menuBtn.setAttribute("aria-label", labelClose);
        mobileMenu.classList.add("is-open");
        mobileMenu.setAttribute("aria-hidden", "false");
      }
    },
    { signal }
  );

  if (backdrop) {
    backdrop.addEventListener("click", closeMenu, { signal });
  }

  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu, { signal });
  });
}

function setupMorePopover() {
  if (moreCleanup) moreCleanup.abort();
  moreCleanup = new AbortController();
  const { signal } = moreCleanup;

  const moreBtn = document.getElementById("more-btn");
  const morePopover = document.getElementById("more-popover");

  if (!moreBtn || !morePopover) return;

  const openPopover = () => {
    moreBtn.setAttribute("aria-expanded", "true");
    morePopover.classList.remove("hidden");
  };

  const closePopover = () => {
    moreBtn.setAttribute("aria-expanded", "false");
    morePopover.classList.add("hidden");
  };

  moreBtn.addEventListener(
    "click",
    e => {
      e.stopPropagation();
      const isExpanded = moreBtn.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        closePopover();
      } else {
        openPopover();
      }
    },
    { signal }
  );

  // Close when clicking outside
  document.addEventListener(
    "click",
    e => {
      const target = e.target as HTMLElement;
      if (
        !morePopover.classList.contains("hidden") &&
        !morePopover.contains(target) &&
        target !== moreBtn &&
        !moreBtn.contains(target)
      ) {
        closePopover();
      }
    },
    { signal }
  );

  // Close popover on Escape key
  document.addEventListener(
    "keydown",
    e => {
      if (e.key === "Escape" && !morePopover.classList.contains("hidden")) {
        closePopover();
        moreBtn.focus();
      }
    },
    { signal }
  );

  // Close popover on scroll
  window.addEventListener("scroll", closePopover, { passive: true, signal });

  // Close popover when focus leaves the container
  morePopover.addEventListener(
    "focusout",
    e => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (
        relatedTarget &&
        !morePopover.contains(relatedTarget) &&
        relatedTarget !== moreBtn
      ) {
        closePopover();
      }
    },
    { signal }
  );

  // Close popover when a link inside is clicked
  morePopover.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closePopover, { signal });
  });
}

export function initHeader() {
  setupScrollPhysics();
  setupMobileNav();
  setupMorePopover();
}
