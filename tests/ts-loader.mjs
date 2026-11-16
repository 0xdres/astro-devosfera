import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const srcRoot = path.resolve(process.cwd(), "src");

const astroStubs = {
  "astro:content": "export const defineCollection = c => c;",
  "astro/zod": "export const z = {};",
  "astro/loaders": "export const glob = () => ({});",
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier in astroStubs) {
      return { url: `data:text/javascript,${astroStubs[specifier]}`, shortCircuit: true };
    }

    let resolvedPath = null;
    if (specifier.startsWith("@/")) {
      resolvedPath = path.join(srcRoot, specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:")
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      resolvedPath = path.resolve(parentDir, specifier);
    }

    if (resolvedPath) {
      const candidates = [
        resolvedPath,
        `${resolvedPath}.ts`,
        `${resolvedPath}.mts`,
        path.join(resolvedPath, "index.ts"),
      ];
      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }

    return nextResolve(specifier, context);
  },
});
