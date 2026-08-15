export type FontUnicodeRange = [number, number];
export type FontAxisMetadata = { tag: string; min: number; defaultValue: number; max: number; nameId: number };
export type FontEmbeddingPermission = "installable" | "restricted" | "preview-print" | "editable" | "unknown";
export type FontFileMetadata = {
  family?: string;
  subfamily?: string;
  postScriptName?: string;
  version?: string;
  weightClass?: number;
  widthClass?: number;
  embeddingPermission: FontEmbeddingPermission;
  unicodeRanges: FontUnicodeRange[];
  axes: FontAxisMetadata[];
  variable: boolean;
};

const decoder = (() => {
  if (typeof TextDecoder === "undefined") return undefined;
  try { return new TextDecoder("utf-16be"); } catch { return undefined; }
})();
const u16 = (v: DataView, o: number) => v.getUint16(o, false);
const u32 = (v: DataView, o: number) => v.getUint32(o, false);
const fixed16 = (v: DataView, o: number) => v.getInt32(o, false) / 65536;
const tagAt = (v: DataView, o: number) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));

function decodeUtf16Be(bytes: Uint8Array) {
  if (decoder) return decoder.decode(bytes);
  let out = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
  return out;
}
function decodeLatin(bytes: Uint8Array) { return Array.from(bytes, (b) => String.fromCharCode(b)).join(""); }

function tableMap(view: DataView, fontOffset = 0) {
  const count = u16(view, fontOffset + 4);
  const map = new Map<string, { offset: number; length: number }>();
  for (let i = 0; i < count; i++) {
    const p = fontOffset + 12 + i * 16;
    if (p + 16 > view.byteLength) break;
    const tag = tagAt(view, p);
    const offset = u32(view, p + 8);
    const length = u32(view, p + 12);
    if (offset >= 0 && length >= 0 && offset + length <= view.byteLength) map.set(tag, { offset, length });
  }
  return map;
}

function resolveFontOffset(view: DataView) {
  if (view.byteLength < 12) throw new Error("Font file is too small.");
  if (tagAt(view, 0) === "ttcf") {
    const numFonts = u32(view, 8);
    if (!numFonts || view.byteLength < 16) throw new Error("Invalid TrueType collection.");
    const offset = u32(view, 12);
    if (offset > view.byteLength - 12) throw new Error("Invalid TrueType collection font offset.");
    return offset;
  }
  return 0;
}

function parseName(view: DataView, table?: { offset: number; length: number }) {
  const values = new Map<number, string>();
  if (!table || table.length < 6) return values;
  const base = table.offset;
  const count = u16(view, base + 2);
  const stringOffset = u16(view, base + 4);
  for (let i = 0; i < count; i++) {
    const p = base + 6 + i * 12;
    if (p + 12 > base + table.length) break;
    const platform = u16(view, p);
    const encoding = u16(view, p + 2);
    const language = u16(view, p + 4);
    const nameId = u16(view, p + 6);
    const length = u16(view, p + 8);
    const offset = u16(view, p + 10);
    const start = base + stringOffset + offset;
    if (start < base || start + length > base + table.length) continue;
    const bytes = new Uint8Array(view.buffer, view.byteOffset + start, length);
    const text = (platform === 0 || platform === 3) ? decodeUtf16Be(bytes) : decodeLatin(bytes);
    if (!text.trim()) continue;
    const existing = values.get(nameId);
    const preferred = platform === 3 && (encoding === 1 || encoding === 10) && (language === 0x0409 || language === 0);
    if (!existing || preferred) values.set(nameId, text.replace(/\0/g, "").trim());
  }
  return values;
}

function mergeRanges(ranges: FontUnicodeRange[]) {
  const sorted = ranges.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b >= a).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out: FontUnicodeRange[] = [];
  for (const [start, end] of sorted) {
    const last = out[out.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}

function parseCmap(view: DataView, table?: { offset: number; length: number }) {
  if (!table || table.length < 4) return [] as FontUnicodeRange[];
  const base = table.offset;
  const tableEnd = base + table.length;
  const count = u16(view, base + 2);
  const candidates: Array<{ score: number; offset: number }> = [];
  for (let i = 0; i < count; i++) {
    const p = base + 4 + i * 8;
    if (p + 8 > tableEnd) break;
    const platform = u16(view, p), encoding = u16(view, p + 2), offset = u32(view, p + 4);
    const sub = base + offset;
    if (sub + 2 > tableEnd) continue;
    const format = u16(view, sub);
    const score = format === 12 ? 100 : format === 4 ? 50 : 0;
    if (score) candidates.push({ score: score + (platform === 3 ? 5 : 0) + (encoding === 10 ? 3 : 0), offset: sub });
  }
  candidates.sort((a, b) => b.score - a.score);
  const covered: number[] = [];
  const pushRange = (start: number, end: number) => {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return;
    covered.push(start, end);
  };
  for (const candidate of candidates.slice(0, 3)) {
    const sub = candidate.offset;
    const format = u16(view, sub);
    if (format === 12 && sub + 16 <= tableEnd) {
      const subLength = u32(view, sub + 4);
      const subEnd = Math.min(tableEnd, sub + subLength);
      const groups = u32(view, sub + 12);
      for (let i = 0; i < groups; i++) {
        const p = sub + 16 + i * 12;
        if (p + 12 > subEnd) break;
        const start = u32(view, p), end = u32(view, p + 4), startGlyph = u32(view, p + 8);
        if (end < start) continue;
        // Glyph id 0 is .notdef. In format 12 glyph ids increase across the group.
        if (startGlyph === 0 && start < end) pushRange(start + 1, end);
        else if (startGlyph !== 0) pushRange(start, end);
      }
    } else if (format === 4 && sub + 16 <= tableEnd) {
      const subLength = u16(view, sub + 2);
      const subEnd = Math.min(tableEnd, sub + subLength);
      const segCount = u16(view, sub + 6) / 2;
      const endCodes = sub + 14;
      const startCodes = endCodes + segCount * 2 + 2;
      const idDeltas = startCodes + segCount * 2;
      const idRangeOffsets = idDeltas + segCount * 2;
      let rangeStart = -1, previous = -2;
      const flush = () => { if (rangeStart >= 0) pushRange(rangeStart, previous); rangeStart = -1; previous = -2; };
      for (let i = 0; i < segCount; i++) {
        const end = u16(view, endCodes + i * 2), start = u16(view, startCodes + i * 2);
        if (start === 0xffff || end < start) continue;
        const delta = u16(view, idDeltas + i * 2);
        const rangeOffset = u16(view, idRangeOffsets + i * 2);
        for (let cp = start; cp <= end; cp++) {
          let glyph = 0;
          if (rangeOffset === 0) glyph = (cp + delta) & 0xffff;
          else {
            const roAddress = idRangeOffsets + i * 2;
            const glyphAddress = roAddress + rangeOffset + (cp - start) * 2;
            if (glyphAddress + 2 <= subEnd) {
              glyph = u16(view, glyphAddress);
              if (glyph) glyph = (glyph + delta) & 0xffff;
            }
          }
          if (glyph !== 0) {
            if (cp !== previous + 1) flush();
            if (rangeStart < 0) rangeStart = cp;
            previous = cp;
          } else flush();
        }
      }
      flush();
    }
  }
  const ranges: FontUnicodeRange[] = [];
  for (let i = 0; i + 1 < covered.length; i += 2) ranges.push([covered[i], covered[i + 1]]);
  return mergeRanges(ranges);
}

function embeddingPermission(fsType?: number): FontEmbeddingPermission {
  if (fsType == null) return "unknown";
  if (fsType === 0) return "installable";
  if (fsType & 0x0002) return "restricted";
  if (fsType & 0x0008) return "editable";
  if (fsType & 0x0004) return "preview-print";
  return "unknown";
}

function parseFvar(view: DataView, table?: { offset: number; length: number }) {
  const axes: FontAxisMetadata[] = [];
  if (!table || table.length < 16) return axes;
  const base = table.offset;
  const axesOffset = u16(view, base + 4);
  const axisCount = u16(view, base + 8);
  const axisSize = u16(view, base + 10);
  if (axisSize < 20) return axes;
  for (let i = 0; i < axisCount; i++) {
    const p = base + axesOffset + i * axisSize;
    if (p + 20 > base + table.length) break;
    const nameId = u16(view, p + 18);
    axes.push({ tag: tagAt(view, p), min: fixed16(view, p + 4), defaultValue: fixed16(view, p + 8), max: fixed16(view, p + 12), nameId });
  }
  return axes;
}

export function inspectFontFile(bytes: Uint8Array): FontFileMetadata {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fontOffset = resolveFontOffset(view);
  const tables = tableMap(view, fontOffset);
  if (!tables.has("cmap") || !tables.has("name")) throw new Error("This file does not look like a supported OpenType/TrueType font.");
  const names = parseName(view, tables.get("name"));
  const os2 = tables.get("OS/2");
  const fsType = os2 && os2.length >= 10 ? u16(view, os2.offset + 8) : undefined;
  const weightClass = os2 && os2.length >= 8 ? u16(view, os2.offset + 4) : undefined;
  const widthClass = os2 && os2.length >= 8 ? u16(view, os2.offset + 6) : undefined;
  const axes = parseFvar(view, tables.get("fvar"));
  return {
    family: names.get(16) || names.get(1),
    subfamily: names.get(17) || names.get(2),
    postScriptName: names.get(6),
    version: names.get(5),
    weightClass,
    widthClass,
    embeddingPermission: embeddingPermission(fsType),
    unicodeRanges: parseCmap(view, tables.get("cmap")),
    axes,
    variable: axes.length > 0,
  };
}

export function fontMetadataSupportsText(metadata: Pick<FontFileMetadata, "unicodeRanges"> | undefined, text: string) {
  if (!metadata?.unicodeRanges?.length || !text.trim()) return undefined;
  const ranges = metadata.unicodeRanges;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    // Layout/control characters do not require a visible glyph in the selected font.
    if (/\s/u.test(ch) || cp < 0x20 || cp === 0x200c || cp === 0x200d || (cp >= 0x200e && cp <= 0x200f) || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2060 && cp <= 0x2069) || (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef)) continue;
    if (!ranges.some(([start, end]) => cp >= start && cp <= end)) return false;
  }
  return true;
}

export function bytesToDataUri(bytes: Uint8Array, mime = "font/ttf") {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += alphabet[(n >>> 18) & 63] + alphabet[(n >>> 12) & 63] + (i + 1 < bytes.length ? alphabet[(n >>> 6) & 63] : "=") + (i + 2 < bytes.length ? alphabet[n & 63] : "=");
  }
  return `data:${mime};base64,${out}`;
}
