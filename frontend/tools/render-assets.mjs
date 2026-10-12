/* =============================================================================
   render-assets.mjs — draw the 24 waste illustrations + placeholder to PNG.

   Usage (only needed when you change tools/waste-art.mjs):
     npm install sharp
     node tools/render-assets.mjs

   Output: assets/waste/<imageKey>.png — 512 x 512, transparent background,
   exactly the file names the API returns in `imageKey` (spec §3, §11).
   The PNGs are committed, so ordinary frontend work does not need this step.
   ========================================================================== */

import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ART, toSvg } from "./waste-art.mjs";

const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("This script needs sharp. Run:  npm install sharp");
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "assets", "waste");
const SIZE = 512;

await mkdir(outDir, { recursive: true });

let written = 0;
for (const [imageKey, inner] of Object.entries(ART)) {
  const target = path.join(outDir, `${imageKey}.png`);
  await sharp(Buffer.from(toSvg(inner)), { density: 192 })
    .resize(SIZE, SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9 })
    .toFile(target);
  written += 1;
}

console.log(`Rendered ${written} files into ${outDir}`);
