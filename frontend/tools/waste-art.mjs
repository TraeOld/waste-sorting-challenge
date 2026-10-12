/* =============================================================================
   waste-art.mjs — source art for the 24 waste illustrations.
   Spec §11: transparent PNG, 2D flat vector illustration, simple outline,
   rounded shapes, soft shadow, 512 x 512, subject centred.

   These are drawn, not photographed, and contain no logos or brands. Replace
   any single item by editing its SVG below and re-running
   `node tools/render-assets.mjs`.
   ========================================================================== */

const OUTLINE = "#263238";

/** Shared outline style, so every item keeps the same line weight. */
const g = (children, strokeWidth = 9) =>
  `<g stroke="${OUTLINE}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round">${children}</g>`;

/** Soft ground shadow that anchors the object. */
const shadow = (rx = 146, cy = 448, ry = 24) =>
  `<ellipse cx="256" cy="${cy}" rx="${rx}" ry="${ry}" fill="#263238" opacity="0.10"/>`;

const plain = (children) => `${shadow()}${g(children)}`;

export const ART = {
  // -------------------------------------------------- Recyclable Waste (1–6)
  plastic_bottle: plain(`
    <rect x="228" y="140" width="56" height="70" fill="#CFE7F7" />
    <rect x="214" y="92" width="84" height="52" rx="16" fill="#4C8FD0" />
    <rect x="188" y="196" width="136" height="224" rx="28" fill="#CFE7F7" />
    <rect x="188" y="262" width="136" height="76" fill="#93CDEA" />
    <rect x="210" y="222" width="18" height="164" rx="9" fill="#FFFFFF" opacity="0.65" />
    <line x1="252" y1="300" x2="300" y2="300" stroke="#6FAEDA" stroke-width="6" />
    <line x1="252" y1="322" x2="284" y2="322" stroke="#6FAEDA" stroke-width="6" />
  `),

  newspaper: plain(`
    <rect x="132" y="150" width="248" height="250" rx="12" fill="#EFEADF"
          transform="rotate(-7 256 275)" />
    <rect x="140" y="158" width="240" height="240" rx="12" fill="#FBF8F0" />
    <line x1="260" y1="176" x2="260" y2="382" stroke-width="6" />
    <rect x="164" y="182" width="78" height="18" rx="8" fill="#6E6A60" />
    <rect x="164" y="212" width="78" height="10" rx="5" fill="#BDB5A6" />
    <rect x="164" y="232" width="78" height="10" rx="5" fill="#BDB5A6" />
    <rect x="164" y="252" width="60" height="10" rx="5" fill="#BDB5A6" />
    <rect x="164" y="290" width="78" height="10" rx="5" fill="#BDB5A6" />
    <rect x="164" y="310" width="78" height="10" rx="5" fill="#BDB5A6" />
    <rect x="164" y="330" width="52" height="10" rx="5" fill="#BDB5A6" />
    <rect x="280" y="182" width="80" height="62" rx="10" fill="#CFC7B6" />
    <rect x="280" y="262" width="80" height="10" rx="5" fill="#BDB5A6" />
    <rect x="280" y="282" width="80" height="10" rx="5" fill="#BDB5A6" />
    <rect x="280" y="302" width="52" height="10" rx="5" fill="#BDB5A6" />
  `),

  cardboard_box: plain(`
    <path d="M120 200 L92 152 L236 166 L256 200 Z" fill="#C9954F" />
    <path d="M392 200 L420 152 L276 166 L256 200 Z" fill="#C9954F" />
    <rect x="120" y="200" width="272" height="192" rx="12" fill="#D9A96B" />
    <rect x="246" y="176" width="20" height="212" fill="#F2E3C8" opacity="0.85" />
    <line x1="120" y1="228" x2="392" y2="228" stroke="#B7863F" stroke-width="6" />
    <path d="M164 268 h40 v40 h-40 z" fill="none" stroke="#B7863F" stroke-width="7" />
    <path d="M308 268 h40 v40 h-40 z" fill="none" stroke="#B7863F" stroke-width="7" />
  `),

  aluminium_can: plain(`
    <rect x="184" y="176" width="144" height="230" rx="34" fill="#C6D0D8" />
    <rect x="184" y="238" width="144" height="106" fill="#4C8FD0" />
    <ellipse cx="256" cy="176" rx="72" ry="20" fill="#DFE6EC" />
    <ellipse cx="256" cy="406" rx="72" ry="20" fill="#AEB9C2" />
    <rect x="244" y="164" width="26" height="12" rx="6" fill="#9FAAB3" />
    <rect x="206" y="198" width="16" height="186" rx="8" fill="#FFFFFF" opacity="0.6" />
    <line x1="256" y1="258" x2="256" y2="326" stroke="#2F6FB8" stroke-width="6" />
  `),

  glass_bottle: plain(`
    <rect x="234" y="140" width="44" height="72" fill="#79C39A" />
    <rect x="220" y="94" width="72" height="48" rx="14" fill="#3E7A56" />
    <rect x="196" y="204" width="120" height="214" rx="26" fill="#79C39A" />
    <rect x="196" y="270" width="120" height="64" fill="#A9DCC0" />
    <rect x="214" y="228" width="16" height="158" rx="8" fill="#FFFFFF" opacity="0.55" />
    <line x1="252" y1="292" x2="300" y2="292" stroke="#5FA47C" stroke-width="6" />
  `),

  paper_bag: plain(`
    <path d="M212 188 c 0 -44 88 -44 88 0" fill="none" stroke-width="11" />
    <path d="M160 186 L352 186 L340 418 L172 418 Z" fill="#E8C89B" />
    <rect x="160" y="186" width="192" height="26" fill="#D9B27E" />
    <line x1="256" y1="214" x2="256" y2="414" stroke="#C79E68" stroke-width="6" />
    <path d="M188 300 c 22 -18 44 -18 66 0" fill="none" stroke="#C79E68" stroke-width="6" />
    <path d="M188 322 c 22 -18 44 -18 66 0" fill="none" stroke="#C79E68" stroke-width="6" />
  `),

  // ------------------------------------------------------ Kitchen Waste (7–12)
  banana_peel: plain(`
    <path d="M256 168 C 206 186 168 254 154 346 C 198 338 242 292 264 226 Z" fill="#F2C14E" />
    <path d="M256 168 C 306 186 344 254 358 346 C 314 338 270 292 248 226 Z" fill="#F2C14E" />
    <path d="M256 178 C 236 240 232 320 246 396 C 270 320 276 240 256 178 Z" fill="#E8B23C" />
    <rect x="246" y="118" width="20" height="58" rx="9" fill="#8D6E3A" />
    <path d="M206 232 c 14 26 22 56 26 84" fill="none" stroke="#D69C2B" stroke-width="6" />
    <path d="M306 232 c -14 26 -22 56 -26 84" fill="none" stroke="#D69C2B" stroke-width="6" />
  `),

  apple_core: plain(`
    <path d="M184 156 C 172 182 186 206 256 206 C 326 206 340 182 328 156
             C 306 138 206 138 184 156 Z" fill="#E4574F" />
    <path d="M186 200 C 210 250 214 296 186 348 L326 348 C 298 296 302 250 326 200 Z" fill="#F6E3C8" />
    <path d="M186 348 C 172 374 186 402 256 402 C 326 402 340 374 326 348
             C 300 330 212 330 186 348 Z" fill="#E4574F" />
    <ellipse cx="240" cy="286" rx="10" ry="15" fill="#6B4A2A" transform="rotate(-14 240 286)" />
    <ellipse cx="272" cy="286" rx="10" ry="15" fill="#6B4A2A" transform="rotate(14 272 286)" />
    <path d="M256 150 L258 108" fill="none" stroke="#6B4A2A" stroke-width="10" />
    <path d="M262 112 C 284 96 306 104 312 118 C 292 132 268 128 262 112 Z" fill="#6BAF72" />
  `),

  vegetable_leaves: plain(`
    <path d="M256 156 C 306 196 330 292 256 392 C 182 292 206 196 256 156 Z"
          fill="#5FA463" transform="rotate(-32 256 300)" />
    <path d="M256 156 C 306 196 330 292 256 392 C 182 292 206 196 256 156 Z"
          fill="#5FA463" transform="rotate(32 256 300)" />
    <path d="M256 152 C 308 194 332 292 256 392 C 180 292 204 194 256 152 Z" fill="#7BC47F" />
    <line x1="256" y1="184" x2="256" y2="376" stroke="#4E8F55" stroke-width="7" />
    <path d="M256 232 l 26 -20 M256 268 l -26 -20 M256 304 l 26 -20 M256 340 l -26 -20"
          fill="none" stroke="#4E8F55" stroke-width="6" />
    <rect x="246" y="386" width="20" height="40" rx="9" fill="#6E9B5C" />
  `),

  eggshell: plain(`
    <path d="M300 400 C 296 356 330 328 366 334 C 402 340 416 376 398 402
             C 372 430 314 428 300 400 Z" fill="#EFE9D8" />
    <path d="M164 338 C 164 252 200 212 256 212 C 312 212 348 252 348 338
             L 324 316 L 293 342 L 261 318 L 229 342 L 196 316 Z" fill="#F7F3E6" />
    <path d="M172 328 C 196 300 316 300 340 328 C 306 350 206 350 172 328 Z" fill="#E7DFC9" />
    <path d="M214 258 l 22 18 l -14 26 l 22 16" fill="none" stroke="#B9B29C" stroke-width="7" />
    <path d="M316 360 l 16 14 l -10 20" fill="none" stroke="#C9C2AC" stroke-width="7" />
  `),

  leftover_rice: plain(`
    <path d="M126 272 H386 C 378 364 322 412 256 412 C 190 412 134 364 126 272 Z" fill="#7EA6D9" />
    <ellipse cx="256" cy="272" rx="130" ry="24" fill="#9DBFE8" />
    <ellipse cx="256" cy="250" rx="84" ry="56" fill="#FBF7EC" />
    <path d="M212 236 c 10 -12 26 -14 36 -4" fill="none" stroke="#DFD8C6" stroke-width="7" />
    <path d="M262 226 c 12 -12 30 -10 38 2" fill="none" stroke="#DFD8C6" stroke-width="7" />
    <path d="M238 262 c 10 -12 26 -12 36 -2" fill="none" stroke="#DFD8C6" stroke-width="7" />
    <path d="M154 300 c 18 46 54 74 102 74" fill="none" stroke="#5F87BA" stroke-width="7" />
  `),

  tea_leaves: plain(`
    <path d="M148 392 C 150 336 198 300 256 300 C 314 300 362 336 364 392 Z" fill="#4E7A46" />
    <g stroke="#263238" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M214 330 C 232 306 258 306 272 330 C 254 352 230 352 214 330 Z" fill="#6E9B5C" transform="rotate(-18 243 330)" />
      <path d="M258 306 C 276 282 302 282 316 306 C 298 328 274 328 258 306 Z" fill="#3F6B3C" transform="rotate(12 287 306)" />
      <path d="M180 356 C 198 332 224 332 238 356 C 220 378 196 378 180 356 Z" fill="#3F6B3C" transform="rotate(8 209 356)" />
      <path d="M264 344 C 282 320 308 320 322 344 C 304 366 280 366 264 344 Z" fill="#6E9B5C" transform="rotate(-10 293 344)" />
      <path d="M222 368 C 240 344 266 344 280 368 C 262 390 238 390 222 368 Z" fill="#4E7A46" transform="rotate(4 251 368)" />
      <path d="M340 300 C 358 276 384 276 398 300 C 380 322 356 322 340 300 Z" fill="#6E9B5C" transform="rotate(-20 369 300)" />
      <path d="M126 316 C 144 292 170 292 184 316 C 166 338 142 338 126 316 Z" fill="#3F6B3C" transform="rotate(16 155 316)" />
    </g>
  `),

  // ---------------------------------------------------- Hazardous Waste (13–18)
  button_battery: plain(`
    <circle cx="256" cy="266" r="124" fill="#C9CFD6" />
    <circle cx="256" cy="266" r="98" fill="#DFE4E9" />
    <circle cx="256" cy="266" r="74" fill="#C9CFD6" />
    <rect x="246" y="200" width="20" height="132" rx="8" fill="#5B6B73" />
    <rect x="190" y="256" width="132" height="20" rx="8" fill="#5B6B73" />
    <path d="M196 208 A 84 84 0 0 1 246 182" fill="none" stroke="#FFFFFF" stroke-width="14" opacity="0.6" />
  `),

  rechargeable_battery: plain(`
    <rect x="230" y="126" width="52" height="38" rx="10" fill="#C9CFD6" />
    <rect x="168" y="158" width="176" height="256" rx="26" fill="#3F6C4F" />
    <rect x="168" y="158" width="176" height="48" rx="24" fill="#2F543C" />
    <rect x="292" y="176" width="34" height="10" rx="5" fill="#E8EEF2" />
    <rect x="304" y="164" width="10" height="34" rx="5" fill="#E8EEF2" />
    <path d="M272 226 L212 300 L248 300 L230 348 L292 272 L254 272 Z" fill="#FFD166" />
  `),

  expired_medicine: plain(`
    <rect x="196" y="146" width="120" height="56" rx="14" fill="#E75A5A" />
    <rect x="186" y="196" width="140" height="222" rx="22" fill="#F2F5F8" />
    <rect x="186" y="248" width="140" height="120" fill="#FFFFFF" />
    <rect x="240" y="266" width="32" height="84" rx="8" fill="#E75A5A" />
    <rect x="214" y="292" width="84" height="32" rx="8" fill="#E75A5A" />
    <circle cx="216" cy="392" r="16" fill="#FFC857" />
    <circle cx="256" cy="392" r="16" fill="#A8D5BA" />
  `),

  mercury_thermometer: plain(`
    <rect x="238" y="104" width="36" height="256" rx="18" fill="#E8EEF2" />
    <line x1="284" y1="140" x2="306" y2="140" stroke="#9AA7AF" stroke-width="7" />
    <line x1="284" y1="172" x2="306" y2="172" stroke="#9AA7AF" stroke-width="7" />
    <line x1="284" y1="204" x2="306" y2="204" stroke="#9AA7AF" stroke-width="7" />
    <line x1="284" y1="236" x2="306" y2="236" stroke="#9AA7AF" stroke-width="7" />
    <line x1="284" y1="268" x2="306" y2="268" stroke="#9AA7AF" stroke-width="7" />
    <line x1="284" y1="300" x2="306" y2="300" stroke="#9AA7AF" stroke-width="7" />
    <rect x="249" y="224" width="14" height="150" rx="7" fill="#E75A5A" />
    <circle cx="256" cy="386" r="44" fill="#E8EEF2" />
    <circle cx="256" cy="386" r="30" fill="#E75A5A" />
  `),

  fluorescent_lamp: plain(`
    <rect x="88" y="188" width="336" height="84" rx="42" fill="#C9EBD9" opacity="0.7" />
    <rect x="92" y="196" width="328" height="68" rx="34" fill="#EFFAF3" />
    <rect x="92" y="196" width="44" height="68" rx="22" fill="#9FB6AC" />
    <rect x="376" y="196" width="44" height="68" rx="22" fill="#9FB6AC" />
    <line x1="150" y1="230" x2="362" y2="230" stroke="#A9E0C2" stroke-width="8" />
  `),

  pesticide_container: plain(`
    <rect x="228" y="120" width="56" height="44" rx="10" fill="#5B6B73" />
    <path d="M324 232 c 42 0 42 92 0 92" fill="none" stroke-width="14" />
    <path d="M188 200 c 0 -22 12 -36 32 -36 h 72 c 20 0 32 14 32 36 v 196
             c 0 18 -10 28 -28 28 h -80 c -18 0 -28 -10 -28 -28 z" fill="#E8C15C" />
    <path d="M256 258 L212 332 H300 Z" fill="#4A4A4A" />
    <rect x="251" y="278" width="10" height="30" rx="5" fill="#FFFFFF" />
    <circle cx="256" cy="318" r="6" fill="#FFFFFF" />
  `),

  // -------------------------------------------------------- Other Waste (19–24)
  used_tissue: plain(`
    <path d="M170 300 C 150 246 190 208 226 226 C 240 188 300 182 322 216
             C 366 214 388 262 366 300 C 392 338 366 386 322 386
             C 300 420 236 422 214 388 C 168 390 146 340 170 300 Z" fill="#F4F7F9" />
    <path d="M212 260 c 22 -14 46 -10 62 8" fill="none" stroke="#C4CED6" stroke-width="7" />
    <path d="M232 330 c 24 -12 46 -6 60 12" fill="none" stroke="#C4CED6" stroke-width="7" />
    <path d="M290 262 c 18 -10 36 -4 44 10" fill="none" stroke="#C4CED6" stroke-width="7" />
    <ellipse cx="252" cy="352" rx="30" ry="16" fill="#DCE3E8" transform="rotate(-8 252 352)" />
  `),

  ceramic_pieces: plain(`
    <path d="M150 330 C 176 232 214 198 234 194 L270 300 C 242 322 196 340 150 330 Z" fill="#E9E2D5" />
    <path d="M286 300 L340 208 C 372 234 390 292 372 340 C 342 356 306 332 286 300 Z" fill="#C7DCD4" />
    <path d="M244 356 L312 342 L294 396 C 268 410 246 388 244 356 Z" fill="#EFE0CE" />
    <path d="M196 252 l 26 22 l -18 28" fill="none" stroke="#B9AE99" stroke-width="7" />
    <path d="M318 262 l 22 20 l -14 26" fill="none" stroke="#9DBBB0" stroke-width="7" />
  `),

  cigarette_butt: `${shadow()}${g(
    `<g transform="rotate(-14 256 300)">
      <rect x="176" y="246" width="94" height="84" rx="42" fill="#E8B96B" />
      <rect x="256" y="246" width="116" height="84" rx="40" fill="#F6F2E8" />
      <path d="M368 250 c 22 6 34 22 34 44 c 0 22 -12 38 -34 44 z" fill="#6E6E6E" />
      <path d="M368 250 c 12 10 18 24 18 44 c 0 20 -6 34 -18 44" fill="none" stroke="#4A4A4A" stroke-width="7" />
      <circle cx="394" cy="294" r="10" fill="#E75A5A" stroke="none" />
      <line x1="270" y1="250" x2="270" y2="326" stroke="#D8CFC0" stroke-width="6" />
      <line x1="196" y1="262" x2="196" y2="316" stroke="#D09E4E" stroke-width="6" />
    </g>`,
    9
  )}`,

  dust: plain(`
    <path d="M118 396 C 132 338 184 310 250 310 C 316 310 368 338 382 396 Z" fill="#C7BEB2" />
    <ellipse cx="204" cy="366" rx="16" ry="10" fill="#A99F92" />
    <ellipse cx="286" cy="352" rx="12" ry="8" fill="#A99F92" />
    <ellipse cx="248" cy="384" rx="18" ry="9" fill="#B4AA9D" />
    <circle cx="330" cy="382" r="8" fill="#9C9285" />
    <line x1="386" y1="170" x2="356" y2="292" stroke="#B98A4E" stroke-width="15" />
    <path d="M330 300 L380 284 L394 352 L344 368 Z" fill="#E0B36B" />
    <line x1="342" y1="366" x2="336" y2="400" stroke="#B98A4E" stroke-width="9" />
    <line x1="360" y1="368" x2="358" y2="404" stroke="#B98A4E" stroke-width="9" />
    <line x1="376" y1="364" x2="380" y2="398" stroke="#B98A4E" stroke-width="9" />
  `),

  diaper: plain(`
    <path d="M148 168 H364 C 366 216 336 246 336 298 C 336 360 302 406 256 406
             C 210 406 176 360 176 298 C 176 246 146 216 148 168 Z" fill="#FFFFFF" />
    <path d="M148 168 H364 C 366 200 356 218 340 230 C 316 212 196 212 172 230
             C 156 218 146 200 148 168 Z" fill="#A8D5BA" />
    <rect x="222" y="252" width="68" height="130" rx="30" fill="#EDF3F7" />
    <line x1="238" y1="278" x2="274" y2="278" stroke="#C3D3DE" stroke-width="6" />
    <line x1="238" y1="302" x2="274" y2="302" stroke="#C3D3DE" stroke-width="6" />
    <line x1="238" y1="326" x2="274" y2="326" stroke="#C3D3DE" stroke-width="6" />
    <path d="M176 268 c 10 6 16 16 18 28" fill="none" stroke="#8CBF9E" stroke-width="7" />
    <path d="M336 268 c -10 6 -16 16 -18 28" fill="none" stroke="#8CBF9E" stroke-width="7" />
  `),

  dirty_plastic_bag: plain(`
    <path d="M214 186 c 0 -38 84 -38 84 0" fill="none" stroke-width="10" />
    <path d="M268 186 c 0 -38 84 -38 84 0" fill="none" stroke-width="10" />
    <path d="M168 214 C 156 280 156 344 172 400 L 340 400 C 356 344 356 280 344 214 Z" fill="#BFD9C6" />
    <path d="M168 214 C 190 184 226 174 256 174 C 286 174 322 184 344 214
             C 316 234 196 234 168 214 Z" fill="#A9C9B2" />
    <ellipse cx="222" cy="286" rx="36" ry="26" fill="#7E6D55" opacity="0.6" transform="rotate(-12 222 286)" />
    <ellipse cx="300" cy="340" rx="30" ry="22" fill="#7E6D55" opacity="0.55" transform="rotate(10 300 340)" />
    <ellipse cx="246" cy="374" rx="22" ry="14" fill="#7E6D55" opacity="0.45" />
    <path d="M330 216 c 12 10 16 24 12 36" fill="none" stroke="#7E6D55" stroke-width="8" opacity="0.5" />
    <path d="M186 240 c 20 40 22 88 12 132" fill="none" stroke="#9CB8A4" stroke-width="7" />
    <path d="M330 244 c -16 40 -18 86 -8 128" fill="none" stroke="#9CB8A4" stroke-width="7" />
  `),

  // ------------------------------------------------------------- placeholder
  _placeholder: `
    <ellipse cx="256" cy="448" rx="130" ry="22" fill="#263238" opacity="0.08" />
    <rect x="104" y="104" width="304" height="304" rx="44" fill="#EDF1F3" />
    <path d="M152 352 L216 276 L262 326 L296 292 L360 356 Z" fill="#C3CED4" />
    <circle cx="204" cy="196" r="26" fill="#C3CED4" />
  `
};

/** Wrap one item in a 512 x 512 SVG document. */
export function toSvg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">${inner}</svg>`;
}

export const PUBLIC_ITEMS = Object.keys(ART);
