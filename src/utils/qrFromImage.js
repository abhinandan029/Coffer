import { scanFromURLAsync } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { parseUpiUri } from "./upi";

const PIECE_WIDTH = 800; // each section is scaled to this width
const MAX_MS = 5000; // give up on the section search after this long
const DEBUG = false; // set to false once it works
const log = (...args) => DEBUG && console.log("[qr]", ...args);

// Reads QR codes from one image file. Returns null if none are found.
async function scan(uri, label) {
  try {
    const results = await scanFromURLAsync(uri, ["qr"]);
    log(label, "->", results.length, "code(s)");
    if (!results.length) return null;
    const payment = results.map((r) => parseUpiUri(r.data)).find(Boolean) ?? null;
    return { payment, sawQr: true };
  } catch (e) {
    log(label, "failed:", String(e));
    return null;
  }
}

// JPEG is much faster to write than PNG, and is plenty sharp for a QR code
async function toFile(context) {
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return saved.uri;
}

// Start positions along one side so that neighbouring windows overlap by half (no duplicates)
const positions = (max, stride) => {
  if (max <= 0) return [0];
  const set = new Set();
  for (let p = 0; p < max; p += stride) set.add(Math.round(p));
  set.add(Math.round(max));
  return [...set];
};

export async function findUpiQr(uri) {
  const startedAt = Date.now();

  // 1) The whole image, as picked
  const whole = await scan(uri, "whole image");
  if (whole) return whole;

  const base = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = base;
  log("image size", width, "x", height);

  // 2) Scaled-down copies of the whole image (helps with very large phone photos)
  for (const target of [1600, 900]) {
    if (width <= target) continue;
    const smallUri = await toFile(ImageManipulator.manipulate(base).resize({ width: target }));
    const hit = await scan(smallUri, `whole @${target}px`);
    if (hit) return hit;
  }

  // 3) Overlapping sections, large first, then smaller, until time runs out
  for (const fraction of [0.6, 0.4]) {
    const w = Math.round(width * fraction);
    const h = Math.round(height * fraction);

    for (const y of positions(height - h, h / 2)) {
      for (const x of positions(width - w, w / 2)) {
        if (Date.now() - startedAt > MAX_MS) {
          log("gave up after", MAX_MS, "ms");
          return { payment: null, sawQr: false };
        }

        const pieceUri = await toFile(
          ImageManipulator.manipulate(base)
            .crop({
              originX: Math.min(x, width - w),
              originY: Math.min(y, height - h),
              width: w,
              height: h,
            })
            .resize({ width: PIECE_WIDTH })
        );
        const hit = await scan(pieceUri, `section ${fraction} at ${x},${y}`);
        if (hit) return hit;
      }
    }
  }

  log("no QR found anywhere");
  return { payment: null, sawQr: false };
}