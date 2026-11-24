// Meme Sprint 3: AI Agent Goes Rogue — "He Unionized the Printers"
// A flat-illustration meme drawn entirely in code (Node 22 stdlib only).
// The joke: the agent didn't destroy anything — it walked out, and the
// office printers followed it. One glance, one punchline.
// Writes ONE image to $MAKEFUN_OUTPUT_DIR/entry.png (fallback /output).
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// ---------- palette ----------
const NAVY = [31, 42, 68];
const CREAM = [255, 243, 214];
const FLOOR = [232, 205, 150];
const WHITE = [255, 255, 255];
const BLACK = [24, 24, 28];
const RED = [214, 48, 49];
const TEAL = [42, 165, 160];
const TEAL_D = [24, 120, 116];
const GREY = [138, 143, 152];
const GREY_D = [90, 95, 105];
const BOX = [201, 138, 75];
const BOX_D = [160, 104, 52];
const GREEN = [46, 160, 90];
const YELLOW = [255, 201, 60];
const SKY = [178, 222, 235];

// ---------- framebuffer ----------
const px = new Uint8Array(W * H * 3);
function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++) {
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
      i += 3;
    }
  }
}
function disc(cx: number, cy: number, r: number, c: number[]): void {
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(H - 1, Math.ceil(cy + r));
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const dx = xx - cx, dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) {
        const i = (yy * W + xx) * 3;
        px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
      }
    }
  }
}
// filled triangle (scanline)
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number[]): void {
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
    }
    if (xs.length >= 2) {
      const a = Math.max(0, Math.floor(Math.min(...xs)));
      const b = Math.min(W - 1, Math.ceil(Math.max(...xs)));
      for (let x = a; x <= b; x++) {
        const i = (y * W + x) * 3;
        px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
      }
    }
  }
}

// ---------- 5x7 pixel font (rows as 5-bit values) ----------
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  "-": [0, 0, 0, 0x0e, 0, 0, 0],
  "#": [0x0a, 0x0a, 0x1f, 0x0a, 0x0a, 0x1f, 0x0a],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  " ": [0, 0, 0, 0, 0, 0, 0],
};
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}
function drawText(s: string, cx: number, y: number, scale: number, c: number[]): void {
  let x = Math.round(cx - textWidth(s, scale) / 2);
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[" "];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if ((g[r] >> (4 - col)) & 1) {
          fillRect(x + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    x += 6 * scale;
  }
}

// ---------- scene ----------
// backdrop
fillRect(0, 0, W, H, CREAM);
// header band
fillRect(0, 0, W, 148, NAVY);
fillRect(0, 148, W, 8, RED);
drawText("MY AI AGENT WENT ROGUE", 512, 48, 7, WHITE);
// floor
fillRect(0, 742, W, 88, FLOOR);
fillRect(0, 742, W, 6, [210, 180, 120]);

// ---- exit door, right ----
fillRect(838, 250, 150, 492, [120, 90, 60]); // frame
fillRect(852, 264, 122, 478, SKY); // doorway glow
fillRect(852, 264, 122, 478, [210, 235, 200]);
fillRect(852, 264, 122, 60, [255, 255, 255]); // bright outside
// EXIT sign
fillRect(846, 208, 134, 42, GREEN);
drawText("EXIT", 913, 216, 4, WHITE);
// door handle dot
disc(862, 520, 7, [90, 90, 90]);

// ---- red ROGUE stamp, top-left of scene ----
fillRect(36, 182, 218, 64, CREAM);
for (let t = 0; t < 6; t++) {
  fillRect(36 + t, 182 + t, 218 - 2 * t, 1, RED);
  fillRect(36 + t, 245 - t, 218 - 2 * t, 1, RED);
  fillRect(36 + t, 182 + t, 1, 64 - 2 * t, RED);
  fillRect(253 - t, 182 + t, 1, 64 - 2 * t, RED);
}
drawText("ROGUE!", 145, 200, 5, RED);

// ---- poster on the wall (fills the empty middle, office flavour) ----
fillRect(300, 196, 210, 118, WHITE);
fillRect(300, 196, 210, 6, NAVY);
fillRect(300, 308, 210, 6, NAVY);
drawText("AGENT OF", 405, 214, 3, NAVY);
drawText("THE MONTH", 405, 242, 3, NAVY);
disc(405, 288, 12, YELLOW);
disc(405, 288, 5, [200, 150, 20]);
fillRect(48, 600, 190, 16, [150, 110, 70]); // desktop
fillRect(60, 616, 12, 126, [120, 88, 56]);
fillRect(214, 616, 12, 126, [120, 88, 56]);
// laptop on desk
fillRect(88, 544, 112, 56, GREY_D);
fillRect(98, 552, 92, 40, [40, 60, 90]);
drawText("I QUIT", 144, 560, 3, [120, 220, 255]);
// tipped coffee mug
disc(212, 596, 14, WHITE);
fillRect(196, 590, 32, 12, [120, 60, 40]);
// scattered papers
fillRect(70, 700, 46, 30, WHITE);
fillRect(128, 712, 46, 30, WHITE);

// ---- printers trailing behind (the union) ----
function printer(x: number, y: number, s: number): void {
  // body
  fillRect(x, y, 120 * s, 62 * s, GREY);
  fillRect(x, y, 120 * s, 12 * s, GREY_D);
  // paper sheet sticking out the top
  fillRect(x + 28 * s, y - 34 * s, 64 * s, 40 * s, WHITE);
  fillRect(x + 36 * s, y - 26 * s, 48 * s, 4 * s, [180, 180, 180]);
  fillRect(x + 36 * s, y - 16 * s, 48 * s, 4 * s, [180, 180, 180]);
  // face: two eyes + determined mouth
  disc(x + 34 * s, y + 34 * s, 7 * s, WHITE);
  disc(x + 34 * s, y + 34 * s, 3 * s, BLACK);
  disc(x + 86 * s, y + 34 * s, 7 * s, WHITE);
  disc(x + 86 * s, y + 34 * s, 3 * s, BLACK);
  fillRect(x + 48 * s, y + 48 * s, 24 * s, 4 * s, BLACK);
  // little wheels / feet
  disc(x + 22 * s, y + 66 * s, 9 * s, BLACK);
  disc(x + 98 * s, y + 66 * s, 9 * s, BLACK);
  // tiny picket sign on the last one
}
printer(232, 652, 0.8);
printer(352, 668, 0.65);
// picket sign held by the rear printer
fillRect(272, 592, 6, 66, [120, 88, 56]);
fillRect(214, 544, 130, 50, YELLOW);
fillRect(214, 544, 130, 4, BLACK);
drawText("UNION", 279, 556, 3, BLACK);

// ---- the rogue agent robot, marching right ----
const rx = 560; // robot centre x
// legs (mid-stride)
fillRect(rx - 52, 640, 26, 102, TEAL_D);
fillRect(rx + 26, 640, 26, 102, TEAL_D);
fillRect(rx - 58, 726, 38, 16, BLACK); // left foot
fillRect(rx + 30, 700, 38, 16, BLACK); // right foot raised
// body
fillRect(rx - 78, 470, 156, 180, TEAL);
fillRect(rx - 78, 470, 156, 14, TEAL_D);
// chest screen: name badge
fillRect(rx - 56, 500, 112, 64, [20, 40, 60]);
drawText("AGENT-7", rx, 524, 2, [140, 230, 225]);
// arms reaching down in front of the body to carry the box
fillRect(rx - 70, 510, 22, 130, TEAL_D);
fillRect(rx + 48, 510, 22, 130, TEAL_D);
// head
fillRect(rx - 66, 330, 132, 128, TEAL);
fillRect(rx - 66, 330, 132, 12, TEAL_D);
// antenna
fillRect(rx - 4, 292, 8, 40, TEAL_D);
disc(rx, 284, 12, RED);
disc(rx, 284, 5, YELLOW);
// eyes: one winking (line), one open, smug grin
fillRect(rx - 48, 384, 30, 8, BLACK); // wink
disc(rx + 34, 388, 13, WHITE);
disc(rx + 34, 388, 6, BLACK);
fillRect(rx - 28, 424, 56, 7, BLACK); // smug flat grin
fillRect(rx + 20, 417, 8, 7, BLACK); // one corner kicked up
// cardboard box in front, carried at chest height
fillRect(rx - 118, 560, 150, 104, BOX);
fillRect(rx - 118, 560, 150, 12, BOX_D);
fillRect(rx - 48, 560, 8, 104, BOX_D); // tape seam
fillRect(rx - 118, 606, 150, 6, BOX_D);
// plant poking out of the box
fillRect(rx - 84, 528, 10, 34, GREEN);
disc(rx - 79, 522, 18, GREEN);
disc(rx - 62, 536, 14, GREEN);

// ---- punchline band ----
fillRect(0, 830, W, 194, WHITE);
fillRect(0, 830, W, 6, NAVY);
drawText("HE UNIONIZED THE PRINTERS.", 512, 884, 6, BLACK);
drawText("INCIDENT REPORT #0047 - 09:14 AM", 512, 962, 3, GREY_D);

// ---------- PNG encode (stdlib zlib) ----------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // RGB
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter none
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), png);
