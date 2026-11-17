/**
 * code-copy.ts
 *
 * Attaches interactive copy-to-clipboard buttons to markdown code fences
 * and deep anchor links to article section headings.
 */

export function addHeadingLinks() {
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>("h2, h3, h4, h5, h6")
  );
  for (const heading of headings) {
    if (heading.querySelector(".heading-link")) continue;

    heading.classList.add("group");
    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = "#" + heading.id;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    link.ariaLabel = "link to heading";
    heading.appendChild(link);
  }
}

export function attachCopyButtons() {
  const copyButtonLabel = "Copy";
  const codeBlocks = Array.from(
    document.querySelectorAll<HTMLPreElement>("pre")
  );
  const unattachedCodeBlocks = codeBlocks.filter(
    cb => !cb.querySelector(".copy-code")
  );
  if (unattachedCodeBlocks.length === 0) return;

  // Pass 1: read all computed styles before touching DOM to avoid reflows
  const topClasses = unattachedCodeBlocks.map(cb =>
    getComputedStyle(cb).getPropertyValue("--file-name-offset").trim() !== ""
      ? "top-(--file-name-offset)"
      : "-top-3"
  );

  // Pass 2: mutate DOM
  unattachedCodeBlocks.forEach((codeBlock, i) => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const copyButton = document.createElement("button");
    copyButton.className = `copy-code absolute end-3 ${topClasses[i]} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium cursor-pointer`;
    copyButton.innerHTML = copyButtonLabel;
    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);

    codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);

    copyButton.addEventListener("click", async () => {
      const code = codeBlock.querySelector("code");
      const text = code?.innerText;

      await navigator.clipboard.writeText(text ?? "");

      copyButton.innerText = "Copied";
      setTimeout(() => {
        copyButton.innerText = copyButtonLabel;
      }, 700);
    });
  });
}
