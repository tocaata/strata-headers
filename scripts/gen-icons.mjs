// Generates the extension icons (three "strata" bars on dark ground) as raw
// PNGs — no image library needed.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, pixel) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = size * 4 + 1
  const raw = Buffer.alloc(size * stride)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y)
      const o = y * stride + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const BG = [17, 21, 26]
const BARS = [
  { y0: 0.2, y1: 0.34, x0: 0.18, x1: 0.82, rgb: [255, 178, 36] }, // amber — request
  { y0: 0.43, y1: 0.57, x0: 0.18, x1: 0.68, rgb: [86, 204, 242] }, // cyan — response
  { y0: 0.66, y1: 0.8, x0: 0.18, x1: 0.54, rgb: [240, 101, 149] }, // magenta — redirect
]

function draw(size) {
  const radius = size * 0.19
  return png(size, (px, py) => {
    // rounded-corner alpha mask for the background square
    const cx = Math.max(radius - px, px - (size - 1 - radius), 0)
    const cy = Math.max(radius - py, py - (size - 1 - radius), 0)
    if (Math.hypot(cx, cy) > radius + 0.5) return [0, 0, 0, 0]

    const u = (px + 0.5) / size
    const v = (py + 0.5) / size
    for (const bar of BARS) {
      if (v >= bar.y0 && v < bar.y1 && u >= bar.x0 && u < bar.x1) return [...bar.rgb, 255]
    }
    return [...BG, 255]
  })
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })
for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(outDir, `icon${size}.png`), draw(size))
  console.log(`icon${size}.png`)
}
