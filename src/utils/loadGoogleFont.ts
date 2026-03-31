import fs from "fs";
import path from "path";

async function loadGoogleFonts(
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  // Ensure it searches from the root of the project
  const fontPath = path.resolve("./src/assets/fonts/wotfard.ttf");
  const fontData = fs.readFileSync(fontPath);

  // We map different weights to the same TTF file so that satori 
  // can render correctly regardless of the fontWeight 
  // used in the templates.
  return [
    { name: "Wotfard", data: fontData.buffer, weight: 400, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 600, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 700, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 900, style: "normal" },
  ];
}

export default loadGoogleFonts;
