"""
Segment an official BMAT/TSA Section 1 paper into questions.

Handles the layout differences between years: the column the question numbers
sit in, the offset of the option letters, and the handful of PDFs whose text
layer is stored with a fixed character shift (TSA 2012–2014, BMAT 2013).
"""
import re
from collections import Counter

import pymupdf

# A few PDFs store every glyph shifted by 29 code points ("7KLV" == "This").
SPECIAL = {'¶': '’', '·': '‘', 'µ': '‘', '³': '“', '´': '”', '±': '–', '²': '—', '¦': '…', '¼': '£',
           '\x83': '°'}

# Private glyph mappings some PDFs use for punctuation, in any font.
FIXUPS = {'\u0bd4': ' ', '\u0bd7': ',', '\u0374': '–'}

# Characters that mean the text layer is unreadable for this question: symbol
# fonts with private encodings. Such questions are shown as an image instead.
GARBLED = re.compile(r'[\u0080-\u009f\u0370-\u03ff\u0b00-\u0bff\ue000-\uf8ff\ufffd]')


def fixup(t):
    for a, b in FIXUPS.items():
        t = t.replace(a, b)
    return t


def encoded_fonts(doc):
    """Fonts whose glyphs are stored shifted. The shift is per font, not per
    document, so plain fonts in the same PDF must be left alone."""
    fonts = set()
    for page in doc:
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    if '\x03' in s['text']:
                        fonts.add(s['font'])
    return fonts


def is_encoded(doc):
    return bool(encoded_fonts(doc))


def decode(t):
    out = []
    for c in t:
        if c in SPECIAL:
            out.append(SPECIAL[c])
        elif ord(c) < 0x62:
            out.append(chr(ord(c) + 29))
        else:
            out.append(c)
    return ''.join(out)


def lines_of(page, encoded=frozenset()):
    enc = encoded if isinstance(encoded, (set, frozenset)) else frozenset()
    out = []
    for b in page.get_text('dict')['blocks']:
        if 'lines' not in b:
            continue
        for l in b['lines']:
            for sp in l['spans']:
                if sp['font'] in enc:
                    sp['text'] = decode(sp['text'])
            for sp in l['spans']:
                sp['text'] = fixup(sp['text'])
            t = ''.join(s['text'] for s in l['spans'])
            if not t.strip():
                continue
            spans = [s for s in l['spans'] if s['text'].strip()]
            bold = any('Bold' in s['font'] or s['flags'] & 16 for s in spans)
            first = spans[0] if spans else l['spans'][0]
            ft = first['text']
            out.append(dict(
                x=l['bbox'][0], y=l['bbox'][1], y1=l['bbox'][3], x1=l['bbox'][2], t=t, bold=bold,
                first=ft.strip(), first_bold=('Bold' in first['font'] or bool(first['flags'] & 16)),
                first_x=first['bbox'][0], first_x1=first['bbox'][2],
            ))
    # Group into visual rows before ordering left to right. Rounding y alone lets
    # an option letter sitting 0.4pt lower than its text land after it, which
    # would attach the text to the wrong letter.
    out.sort(key=lambda l: l['y'])
    rows, row_y = [], None
    for l in out:
        mid = (l['y'] + l['y1']) / 2
        if row_y is None or abs(mid - row_y) > 3.5:
            rows.append([l])
            row_y = mid
        else:
            rows[-1].append(l)
    ordered = []
    for r in rows:
        top = min(l['y'] for l in r)
        for l in sorted(r, key=lambda l: l['x']):
            ordered.append(dict(l, y=top) if abs(l['y'] - top) < 3.5 else l)
    return ordered


def extract(path, first_page=1):
    doc = pymupdf.open(path)
    enc = frozenset(encoded_fonts(doc))
    TOP, BOTTOM = 30, 785
    pages = {i: lines_of(doc[i], enc) for i in range(doc.page_count)}
    blank = {i for i in range(doc.page_count) if any('BLANK PAGE' in l['t'] for l in pages[i])}

    # Candidate question numbers: a bold integer that opens a line near the left
    # margin — either on its own or followed by the start of the question.
    cands = []
    for pi in range(first_page, doc.page_count):
        if pi in blank:
            continue
        for l in pages[pi]:
            m = re.fullmatch(r'(\d{1,2})\.?', l['first'])
            if m and l['first_bold'] and l['first_x'] < 120 and TOP < l['y'] < BOTTOM:
                cands.append((int(m.group(1)), pi, l['y'], l['first_x']))
    if not cands:
        return []

    def chain(cs):
        """Longest run counting upwards in page order, tolerating a missed number."""
        out, last = [], 0
        for c in sorted(cs, key=lambda c: (c[1], c[2])):
            if last < c[0] <= last + 3:
                out.append(c)
                last = c[0]
        return out

    # The question-number column is the one whose numbers best count 1, 2, 3…
    # Alternate pages can sit a few points apart, so buckets are generous.
    buckets = {}
    for c in cands:
        buckets.setdefault(round(c[3] / 12), []).append(c)
    best = max(buckets.values(), key=lambda cs: len(chain([c for c in cands if abs(c[3] - cs[0][3]) <= 12])))
    col = sorted(c[3] for c in best)[len(best) // 2]
    starts = chain([c for c in cands if abs(c[3] - col) <= 12])

    qs = []
    for i, (n, pi, y, x) in enumerate(starts):
        nxt = starts[i + 1] if i + 1 < len(starts) else None
        segs = []
        if nxt and nxt[1] == pi:
            segs.append((pi, y - 2, nxt[2] - 4))
        else:
            segs.append((pi, y - 2, BOTTOM))
            end_page = nxt[1] if nxt else doc.page_count - 1
            for pj in range(pi + 1, end_page + 1):
                if pj in blank:
                    continue
                y1 = nxt[2] - 4 if (nxt and pj == nxt[1]) else BOTTOM
                body = [l for l in pages[pj] if TOP < l['y'] < y1 and not re.fullmatch(r'\s*\d+\s*', l['t'])]
                if body:
                    segs.append((pj, TOP, y1))
        lines = []
        for (pg, y0, y1) in segs:
            for l in pages[pg]:
                if y0 <= l['y'] < y1 and l['y'] < BOTTOM:
                    lines.append(dict(l, page=pg))
        qs.append(dict(n=n, segs=segs, lines=lines, col=col, encoded=bool(enc)))

    # "Questions 8 to 11 refer to the passage below" sits after question 7, so
    # the passage lands in question 7's region. Cut it out there and attach it to
    # every question in its range instead.
    GROUP = re.compile(r'^\s*(?:Questions?|Items?)\s+(\d{1,2})\s*(?:to|and|–|-|&)\s*(\d{1,2})\b', re.I)
    contexts = {}
    for q in qs:
        for i, l in enumerate(q['lines']):
            m = GROUP.match(l['t'])
            if not m:
                continue
            a, b = int(m.group(1)), int(m.group(2))
            if a <= q['n'] or b < a:
                continue
            cut_page, cut_y = l['page'], l['y'] - 3
            ctx_lines = q['lines'][i:]
            ctx_segs = []
            for (pg, y0, y1) in q['segs']:
                if pg < cut_page:
                    continue
                ctx_segs.append((pg, max(y0, cut_y) if pg == cut_page else y0, y1))
            q['lines'] = q['lines'][:i]
            q['segs'] = [(pg, y0, (min(y1, cut_y) if pg == cut_page else y1))
                         for (pg, y0, y1) in q['segs'] if pg <= cut_page]
            ctx = dict(range=(a, b), lines=ctx_lines, segs=ctx_segs)
            ctx['draws'], ctx['imgs'] = region_stats(doc, ctx_segs)
            for k in range(a, b + 1):
                contexts[k] = ctx
            break

    for q in qs:
        q['draws'], q['imgs'] = region_stats(doc, q['segs'])
        q['context'] = contexts.get(q['n'])
    return qs


def _visible(colour):
    return colour is not None and any(c < 0.92 for c in colour)


def region_stats(doc, segs):
    """
    Count the visible graphics inside a question's region.

    Some papers are wrapped in invisible layout tables: white page-sized boxes
    and white or zero-width borders. Those are ignored. A lone rule is
    decoration; several rules make a table.
    """
    shapes = rules = imgs = 0
    for (pg, y0, y1) in segs:
        page = doc[pg]
        W, H = page.rect.width, page.rect.height
        clip = pymupdf.Rect(0, y0, W, y1)
        for d in page.get_drawings():
            r = pymupdf.Rect(d['rect'])
            if not r.intersects(clip):
                continue
            if not (_visible(d.get('fill')) or (_visible(d.get('color')) and (d.get('width') or 0) > 0)):
                continue
            if r.width > 0.8 * W and r.height > 0.5 * H:
                continue
            if min(r.width, r.height) < 1.2:
                rules += 1
            else:
                shapes += 1
        imgs += sum(1 for im in page.get_image_info()
                    if pymupdf.Rect(im['bbox']).intersects(clip)
                    and pymupdf.Rect(im['bbox']).width > 20 and pymupdf.Rect(im['bbox']).height > 20)
    draws = shapes + (rules if rules >= 4 else 0)
    return draws, imgs


def split(q):
    """Stem lines, and option lines keyed by letter (A–H)."""
    stem, opts, cur = [], {}, None
    col = q['col']
    for l in q['lines']:
        t = l['t'].strip()
        if abs(l['first_x'] - col) <= 12 and re.fullmatch(r'\d{1,2}\.?', l['first']) and l['first_bold']:
            rest = t[len(l['first']):].strip()
            if not rest:
                continue
            l = dict(l, t=rest)
            t = rest
        m = re.fullmatch(r'([A-H])', l['first']) if l['first_bold'] and col + 6 < l['first_x'] < col + 90 else None
        if m:
            cur = m.group(1)
            opts[cur] = []
            rest = t[1:].strip()
            if rest:
                opts[cur].append(dict(l, t=rest))
            continue
        (opts[cur] if cur else stem).append(l)
    return stem, opts
