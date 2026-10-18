/*
 * Genera el logo de Siempre Divas como SVG 100 % vectorial (texto convertido a trazos)
 * y los íconos PNG de la app.
 *
 * Uso: node scripts/brand/build-logo.mjs <carpeta-con-fuentes>
 * Fuentes (Google Fonts, licencia OFL): Bodoni Moda 500 y Bodoni Moda Italic 500 en WOFF estático (paquete @fontsource/bodoni-moda).
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import opentype from "opentype.js";
import sharp from "sharp";

const fontsDir = process.argv[2];
if (!fontsDir) throw new Error("Indica la carpeta de fuentes");
const load = (f) => opentype.parse(fs.readFileSync(path.join(fontsDir, f)).buffer);
const italic = load("bodoni-italic-500.woff");
const roman = load("bodoni-500.woff");

const OUT = "public/brand";
fs.mkdirSync(OUT, { recursive: true });

const GOLD = "#C9A45C";
const INK = "#0E0C0A";
const IVORY = "#F4EEE6";


/** Trazo de un texto letra por letra (evita un error de opentype.js con algunas letras). */
function textPath(font, text, x, y, size) {
  const parts = [];
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  font.forEachGlyph(text, x, y, size, { kerning: true }, (glyph, gx, gy) => {
    const gp = glyph.getPath(Math.round(gx * 100) / 100, Math.round(gy * 100) / 100, size);
    parts.push(gp.toPathData(2));
    const b = gp.getBoundingBox();
    if (b.x1 === b.x2) return;
    x1 = Math.min(x1, b.x1); y1 = Math.min(y1, b.y1); x2 = Math.max(x2, b.x2); y2 = Math.max(y2, b.y2);
  });
  return { d: parts.join(" "), bb: { x1, y1, x2, y2 } };
}

const SLANT = Math.tan((13 * Math.PI) / 180); // ángulo itálico de Bodoni Moda

/** Corona de tres puntas con perlas. (x, y) = centro de la base. */
function crown(cx, baseY, w, h) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const top = baseY - h;
  const sk = (x, y) => `${(x + (baseY - y) * SLANT).toFixed(2)} ${y.toFixed(2)}`;
  const band = h * 0.2;
  const pearl = w * 0.085;
  const body = [
    `M${sk(l + w * 0.04, baseY)}`,
    `L${sk(l, top + h * 0.34)}`,
    `L${sk(l + w * 0.27, top + h * 0.62)}`,
    `L${sk(cx, top + h * 0.12)}`,
    `L${sk(r - w * 0.27, top + h * 0.62)}`,
    `L${sk(r, top + h * 0.34)}`,
    `L${sk(r - w * 0.04, baseY)}`,
    "Z",
  ].join(" ");
  const bandPath = [
    `M${sk(l + w * 0.04, baseY + band * 0.15)}`,
    `L${sk(r - w * 0.04, baseY + band * 0.15)}`,
    `L${sk(r - w * 0.05, baseY + band)}`,
    `L${sk(l + w * 0.05, baseY + band)}`,
    "Z",
  ].join(" ");
  const pearlAt = (x, y, rr) => {
    const [px, py] = sk(x, y).split(" ").map(Number);
    return `M${(px - rr).toFixed(2)} ${py.toFixed(2)} a${rr} ${rr} 0 1 0 ${(rr * 2).toFixed(2)} 0 a${rr} ${rr} 0 1 0 ${(-rr * 2).toFixed(2)} 0Z`;
  };
  const pearls = [
    pearlAt(l, top + h * 0.34 - pearl * 0.9, pearl),
    pearlAt(cx, top + h * 0.12 - pearl * 1.05, pearl * 1.2),
    pearlAt(r, top + h * 0.34 - pearl * 0.9, pearl),
  ].join(" ");
  return `${body} ${bandPath} ${pearls}`;
}

/** Traza "Dıvas" con la corona como punto de la i. Devuelve path y caja. */
function divas(x, baseline, size) {
  const text = "Dıvas";
  let dotlessX = 0;
  let dotlessAdvance = 0;
  italic.forEachGlyph(text, x, baseline, size, { kerning: true }, (glyph, gx) => {
    if (glyph.name === "dotlessi") {
      dotlessX = gx;
      dotlessAdvance = (glyph.advanceWidth / italic.unitsPerEm) * size;
    }
  });
  const p = textPath(italic, text, x, baseline, size);
  const scale = size / italic.unitsPerEm;
  // Centro del fuste de la ı a la altura x (corregido por la inclinación).
  const ib = italic.charToGlyph("ı").getPath(0, 0, size).getBoundingBox();
  const xHeight = italic.tables.os2.sxHeight * scale;
  const stemCenterAtBase = dotlessX + (ib.x1 + ib.x2) / 2 - (xHeight / 2) * SLANT;
  const crownBase = baseline - xHeight - size * 0.075;
  const cw = dotlessAdvance * 0.74;
  const ch = cw * 0.74;
  const cx = stemCenterAtBase + (baseline - crownBase) * SLANT;
  const d = `${p.d} ${crown(cx, crownBase, cw, ch)}`;
  const bb = p.bb;
  return { d, x1: bb.x1, x2: bb.x2, top: crownBase - ch - cw * 0.12, bottom: bb.y2 };
}

function tracked(font, text, x, baseline, size, tracking) {
  let cursor = x;
  const parts = [];
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    parts.push(g.getPath(Math.round(cursor * 100) / 100, baseline, size).toPathData(2));
    cursor += (g.advanceWidth / font.unitsPerEm) * size + tracking;
  }
  return { d: parts.join(" "), width: cursor - x - tracking };
}

function svg(w, h, body, title = "Siempre Divas") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
}

// ── Logo apilado: SIEMPRE / Divas / SALÓN DE BELLEZA ───────────────────────
function stacked(color, sub = true) {
  const size = 200;
  const pad = 24;
  const dv = divas(0, 0, size);
  const divasW = dv.x2 - dv.x1;
  const capSize = size * 0.18;
  const target = divasW * 0.74;
  const raw = tracked(roman, "SIEMPRE", 0, 0, capSize, 0);
  const trackingS = (target - raw.width) / 6;
  const topBase = Math.min(dv.top, -italic.tables.os2.sCapHeight / italic.unitsPerEm * size) - size * 0.13;
  const s = tracked(roman, "SIEMPRE", dv.x1 + (divasW - target) / 2 + size * 0.03, topBase, capSize, trackingS);
  const capH = (roman.tables.os2.sCapHeight / roman.unitsPerEm) * capSize;
  let bottom = dv.bottom;
  let subPath = "";
  if (sub) {
    const subSize = size * 0.085;
    const rawSub = tracked(roman, "SALÓN DE BELLEZA", 0, 0, subSize, 0);
    const subTarget = divasW * 0.66;
    const trackingSub = (subTarget - rawSub.width) / 15;
    const subBase = dv.bottom + size * 0.2;
    subPath = tracked(roman, "SALÓN DE BELLEZA", dv.x1 + (divasW - subTarget) / 2, subBase, subSize, trackingSub).d;
    bottom = subBase;
  }
  const minY = topBase - capH - pad;
  const minX = dv.x1 - pad;
  const w = divasW + pad * 2;
  const h = bottom - minY + pad;
  const body = `<g fill="${color}" transform="translate(${-minX} ${-minY})"><path d="${s.d}"/><path d="${dv.d}"/>${subPath ? `<path d="${subPath}"/>` : ""}</g>`;
  return svg(w, h, body);
}

// ── Logo horizontal: Siempre Divas en una línea ────────────────────────────
function horizontal(color) {
  const size = 200;
  const pad = 16;
  const siempre = textPath(italic, "Siempre", 0, 0, size);
  const sb = siempre.bb;
  const gap = size * 0.24;
  const dv = divas(sb.x2 + gap, 0, size);
  const minX = sb.x1 - pad;
  const minY = Math.min(sb.y1, dv.top) - pad;
  const maxY = Math.max(sb.y2, dv.bottom) + pad;
  const w = dv.x2 - sb.x1 + pad * 2;
  const body = `<g fill="${color}" transform="translate(${-minX} ${-minY})"><path d="${siempre.d}"/><path d="${dv.d}"/></g>`;
  return svg(w, maxY - minY, body);
}

// ── Monograma: D con corona ────────────────────────────────────────────────
function monogramPaths(size) {
  const p = italic.getPath("D", 0, 0, size);
  const b = p.getBoundingBox();
  const capH = (italic.tables.os2.sCapHeight / italic.unitsPerEm) * size;
  const cw = (b.x2 - b.x1) * 0.62;
  const ch = cw * 0.72;
  const crownBase = -capH - size * 0.12;
  const cx = (b.x1 + b.x2) / 2 + (capH / 2) * SLANT * 0.6;
  const d = `${p.toPathData(2)} ${crown(cx, crownBase, cw, ch)}`;
  return { d, x1: b.x1, x2: b.x2, top: crownBase - ch - cw * 0.12, bottom: b.y2 };
}

function monogram(color, bg) {
  const m = monogramPaths(1000);
  const w = m.x2 - m.x1;
  const h = m.bottom - m.top;
  const side = Math.max(w, h) * (bg ? 1.62 : 1.1);
  const ox = (side - w) / 2 - m.x1;
  const oy = (side - h) / 2 - m.top;
  const rect = bg ? `<rect width="${side.toFixed(1)}" height="${side.toFixed(1)}" fill="${bg}"/>` : "";
  return svg(side, side, `${rect}<path fill="${color}" transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)})" d="${m.d}"/>`);
}

const files = {
  "logo-gold.svg": stacked(GOLD),
  "logo-ivory.svg": stacked(IVORY),
  "logo-ink.svg": stacked(INK),
  "logo-horizontal-gold.svg": horizontal(GOLD),
  "logo-horizontal-ivory.svg": horizontal(IVORY),
  "logo-horizontal-ink.svg": horizontal(INK),
  "monogram-gold.svg": monogram(GOLD),
  "monogram-ink.svg": monogram(INK),
  "app-icon.svg": monogram(GOLD, INK),
};
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), content);

// Íconos de la app y favicon.
const icon = Buffer.from(files["app-icon.svg"]);
await sharp(icon, { density: 400 }).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(icon, { density: 400 }).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(icon, { density: 400 }).resize(180, 180).png().toFile("src/app/apple-icon.png");
fs.copyFileSync(path.join(OUT, "app-icon.svg"), "src/app/icon.svg");
// Vista previa para revisar el logo en grande.
await sharp(Buffer.from(files["logo-gold.svg"]), { density: 300 })
  .resize({ width: 1400 })
  .flatten({ background: INK })
  .extend({ top: 80, bottom: 80, left: 80, right: 80, background: INK })
  .png()
  .toFile(path.join(os.tmpdir(), "preview-logo.png"));
await sharp(Buffer.from(files["logo-horizontal-ink.svg"]), { density: 300 })
  .resize({ width: 1400 })
  .flatten({ background: IVORY })
  .extend({ top: 80, bottom: 80, left: 80, right: 80, background: IVORY })
  .png()
  .toFile(path.join(os.tmpdir(), "preview-horizontal.png"));
console.log("Logo generado en", OUT);
