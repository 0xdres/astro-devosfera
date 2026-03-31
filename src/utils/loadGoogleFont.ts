import fs from "fs";
import path from "path";

async function loadGoogleFonts(
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  // Aseguramos que busque desde la raíz del proyecto
  const fontPath = path.resolve("./src/assets/fonts/wotfard.ttf");
  const fontData = fs.readFileSync(fontPath);

  // Mapeamos distintos pesos al mismo archivo TTF para que satori 
  // pueda renderizar correctamente independientemente del fontWeight 
  // usado en los templates.
  return [
    { name: "Wotfard", data: fontData.buffer, weight: 400, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 600, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 700, style: "normal" },
    { name: "Wotfard", data: fontData.buffer, weight: 900, style: "normal" },
  ];
}

export default loadGoogleFonts;
