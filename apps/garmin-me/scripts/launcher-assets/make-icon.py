"""Draw the Garmin Me app icon (1024px PNG, transparent corners).

Pure Python, no dependencies:  python3 make-icon.py icon.png
Only needs re-running if the design changes; icon.png is committed.
"""
import math, struct, sys, zlib

S = 1024
BG, BLUE, GREEN = (20, 20, 19), (57, 135, 229), (25, 158, 112)


def rrect(x, y, x0, y0, x1, y1, r):
    """Signed distance to a rounded rectangle (negative inside)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = abs(x - cx) - ((x1 - x0) / 2 - r), abs(y - cy) - ((y1 - y0) / 2 - r)
    return math.hypot(max(dx, 0), max(dy, 0)) + min(max(dx, dy), 0) - r


def segment(x, y, ax, ay, bx, by):
    px, py, vx, vy = x - ax, y - ay, bx - ax, by - ay
    t = max(0, min(1, (px * vx + py * vy) / (vx * vx + vy * vy)))
    return math.hypot(px - vx * t, py - vy * t)


BARS = [(270, 560, 366, 750), (464, 440, 560, 750), (658, 330, 754, 750)]
LINE = [(250, 400), (390, 400), (450, 300), (530, 470), (590, 380), (774, 250)]


def shapes(x, y):
    """(colour, signed distance) for each layer, back to front."""
    yield BG, rrect(x, y, 100, 100, 924, 924, 185)
    for b in BARS:
        yield BLUE, rrect(x, y, *b, 28)
    yield GREEN, min(segment(x, y, *LINE[i], *LINE[i + 1]) for i in range(len(LINE) - 1)) - 22
    yield GREEN, math.hypot(x - 774, y - 250) - 40


rows = []
for py in range(S):
    row = bytearray([0])
    for px in range(S):
        r = g = b = a = 0.0
        for (cr, cg, cb), d in shapes(px + 0.5, py + 0.5):
            cov = max(0.0, min(1.0, 0.5 - d))  # 1px anti-aliased edge
            if cov:
                r, g, b = r + (cr - r) * cov, g + (cg - g) * cov, b + (cb - b) * cov
                a = a + (1 - a) * cov
        row += bytes((round(r), round(g), round(b), round(a * 255)))
    rows.append(bytes(row))


def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))


png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', S, S, 8, 6, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(b''.join(rows), 9)) + chunk(b'IEND', b'')
open(sys.argv[1] if len(sys.argv) > 1 else 'icon.png', 'wb').write(png)
