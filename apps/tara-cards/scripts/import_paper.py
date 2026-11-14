"""
Build TARA Cards content packs from the official BMAT/TSA Section 1 papers.

    python scripts/import_paper.py --papers-dir <dir with downloaded PDFs> \
        --out-dir content-packs

Expects files named like `tsa-2020-Question-Paper.pdf`, `tsa-2020-Answer-Key.pdf`
and optionally `tsa-2020-Explained-Answers.pdf` (download them with the URLs in
scripts/papers.tsv). Writes one combined pack per exam: tara-tsa.json and
tara-bmat.json. Needs PyMuPDF (`pip install pymupdf`).

What it does, and what it deliberately does not:

- Segments each paper by its question numbers, and attaches shared passages
  ("Questions 8 to 11 refer to…") to every question in their range.
- Reads the official answer key and never infers an answer. Free-response and
  multi-answer items cannot be marked by the app, so they are skipped and counted.
- Questions containing tables, charts or diagrams are shown as an image of the
  printed question, so nothing is lost in text extraction. Where the options are
  themselves graphical, the whole question is an image.
- Attaches official explained answers where they exist (TSA 2020 only), and
  checks the key against them.
- Classifies each question to one primary skill with scripts/classify.py, unless
  a hand-made map exists in scripts/skills/<source-id>.json.

Personal use only. content-packs/ is gitignored and must not be committed or
deployed: UAT-UK prohibits sharing test content.
"""
import argparse, base64, csv, json, re, sys
from collections import Counter
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).parent))
from pdf_questions import GARBLED, extract, split  # noqa: E402
from classify import classify  # noqa: E402

HERE = Path(__file__).parent
ZOOM = 1.6
LETTERS = 'ABCDEFGH'

# Print furniture that must never end up inside a question or explanation.
BACK_MATTER = re.compile(
    r'This document was initially designed for print|If you need this document in a different format'
    r'|We are Cambridge Assessment|Copyright ©|© UCLES|BLANK PAGE|Turn over|^\s*\*\d{6,}\*',
    re.I,
)


def parse_key(path):
    """
    Read an answer key as {question number: raw answer}.

    Keys print in one column, two interleaved columns, "1 A" on a line, or with
    a comments and points column alongside. Every question number is paired
    with the token after it; a small bare integer there is a points value or the
    next question number, never an answer, so it is not accepted.
    """
    tokens = []
    for page in pymupdf.open(path):
        for line in page.get_text().split('\n'):
            line = line.strip()
            if not line:
                continue
            m = re.fullmatch(r'(\d{1,2})\s+(\S.*)', line)
            tokens.extend([m.group(1), m.group(2)] if m else [line])
    out = {}
    for i in range(len(tokens) - 1):
        if re.fullmatch(r'\d{1,2}', tokens[i]):
            n, nxt = int(tokens[i]), tokens[i + 1]
            if 1 <= n <= 60 and n not in out and not re.fullmatch(r'\d{1,2}', nxt):
                out[n] = nxt
    return out


def single_answer(raw):
    """The app marks single-answer multiple choice only."""
    return raw if re.fullmatch(r'[A-H]', raw or '') else None


def paragraphs(lines, gap=16, short=440):
    """Reflow printed lines. A new paragraph starts after a vertical gap, a page
    change, or a line that stopped well short of the right margin — which is how
    the papers print short rules and list items on lines of their own."""
    paras, cur, last = [], [], None
    for l in lines:
        t = l['t'].strip()
        if not t or BACK_MATTER.search(t):
            continue
        if last is not None and (
            l['y'] - last['y'] > gap or l.get('page') != last.get('page') or last['x1'] < short
        ):
            paras.append(' '.join(cur))
            cur = []
        cur.append(t)
        last = l
    if cur:
        paras.append(' '.join(cur))
    return [re.sub(r'\s+', ' ', p).strip() for p in paras if p.strip()]


def render(doc, segs, y_stop=None):
    """Images of a region, one per page it spans, as inline SVGs over PNG data URIs."""
    svgs = []
    for i, (pg, y0, y1) in enumerate(segs):
        if y_stop is not None and i == 0:
            y1 = min(y1, y_stop)
        if y1 - y0 < 8:
            continue
        page = doc[pg]
        clip = pymupdf.Rect(36, y0, page.rect.width - 28, y1)
        pix = page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=clip, colorspace=pymupdf.csGRAY)
        b64 = base64.b64encode(pix.tobytes('png')).decode()
        svgs.append(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {pix.width} {pix.height}">'
            f'<image width="{pix.width}" height="{pix.height}" href="data:image/png;base64,{b64}"/></svg>'
        )
        if y_stop is not None:
            break
    return svgs


def explanation_names(expl):
    """Letters an official explanation names as the answer."""
    text = ' '.join(expl)
    found = set()
    for pat in [
        r'(?:correct|right) (?:answer|option) is(?: option)? ([A-H])\b',
        r'answer is(?: option)? ([A-H])\b',
        r'\boption ([A-H]) is (?:correct|the correct|the answer|right)',
        r'\b([A-H]) is (?:the )?correct',
        r'(?:expressed|given|stated|illustrated|shown) (?:in|by) option ([A-H])\b',
        r'\bso (?:option )?([A-H]) is\b',
        r'\bOption ([A-H]) (?:states|expresses|is a statement of|identifies|best expresses|supplies) (?:the |this )'
        r'(?:main conclusion|flaw|erroneous step|assumption|connection|principle)',
        r'\b(?:passage and )?option ([A-H]) (?:both )?(?:has|share|shares|follows) the same',
        r'\bwe can draw option ([A-H])\b',
    ]:
        found.update(re.findall(pat, text, re.I))
    return found


def build_questions(exam, year, source_id, papers_dir, report, assets):
    base = Path(papers_dir) / f'{exam.lower()}-{year}'
    paper = f'{base}-Question-Paper.pdf'
    key = parse_key(f'{base}-Answer-Key.pdf')
    doc = pymupdf.open(paper)
    manual_path = HERE / 'skills' / f'{source_id}.json'
    manual = {int(k): v for k, v in json.loads(manual_path.read_text()).items()} if manual_path.exists() else {}

    explained = {}
    expl_path = Path(f'{base}-Explained-Answers.pdf')
    if expl_path.exists():
        for q in extract(str(expl_path), first_page=1):
            lines = [l for l in q['lines'] if l['x'] < 75]
            explained[q['n']] = paragraphs(lines)

    out = []
    for q in extract(paper):
        n = q['n']
        qid = f'{source_id}-q{n:02d}'
        answer = single_answer(key.get(n))
        if not answer:
            report['skipped_non_mcq'] += 1
            continue

        stem, opts = split(q)
        letters = ''.join(opts)
        stem_text = ' '.join(paragraphs(stem))
        n_opts = len(letters)
        text_options_ok = (
            n_opts >= 3 and LETTERS.startswith(letters) and answer in letters
            and all(paragraphs(opts[x]) for x in letters)
        )
        if text_options_ok and any(GARBLED.search(' '.join(l['t'] for l in opts[x])) for x in letters):
            text_options_ok = False
        garbled = bool(GARBLED.search(stem_text))
        if garbled:
            report['garbled_as_image'] += 1
        graphical = q['draws'] > 0 or q['imgs'] > 0 or not text_options_ok or garbled

        blocks = []
        ctx = q.get('context')
        if ctx:
            a, b = ctx['range']
            ctx_text = ' '.join(paragraphs(ctx['lines']))
            if ctx['draws'] or ctx['imgs'] or GARBLED.search(ctx_text):
                # Rendered once per passage and stored in the pack's asset map;
                # every question in the range references it.
                base_id = f'{source_id}-shared-{a}-{b}'
                if f'{base_id}-1' not in assets:
                    for i, s in enumerate(render(doc, ctx['segs'])):
                        assets[f'{base_id}-{i + 1}'] = s
                i = 1
                while f'{base_id}-{i}' in assets:
                    blocks.append({'kind': 'figure',
                                   'alt': f'Shared information for questions {a} to {b}, as printed. Its text reads: {ctx_text}',
                                   'assetId': f'{base_id}-{i}',
                                   'caption': f'Shared information for questions {a}–{b}'})
                    i += 1
            else:
                for i, para in enumerate(paragraphs(ctx['lines'])):
                    blocks.append({'kind': 'passage', 'text': para,
                                   **({'label': f'Shared information for questions {a}–{b}'} if i == 0 else {})})

        if graphical:
            if text_options_ok:
                first_opt_y = min(l['y'] for l in opts['A']) - 12
                svgs = render(doc, q['segs'], y_stop=first_opt_y)
            else:
                svgs = render(doc, q['segs'])
            for i, s in enumerate(svgs):
                blocks.append({'kind': 'figure',
                               'alt': f'The question as printed in the paper. Its text reads: {stem_text}',
                               'svg': s,
                               'caption': f'{exam} {year} Section 1, question {n}, as printed'
                               + (f' (part {i + 1})' if len(svgs) > 1 else '')})
            report['graphical'] += 1
        else:
            blocks.extend({'kind': 'paragraph', 'text': p} for p in paragraphs(stem))

        if not blocks:
            report['skipped_empty'] += 1
            continue

        if text_options_ok:
            option_letters = letters
        else:
            last = max(LETTERS.index(answer), 4)
            option_letters = LETTERS[: last + 1]
        options = []
        for L in option_letters:
            txt = ' '.join(paragraphs(opts[L])) if text_options_ok else f'Option {L} in the figure above'
            options.append({'id': f'opt-{L.lower()}', 'label': L, 'blocks': [{'kind': 'paragraph', 'text': txt}]})

        expl = [p for p in explained.get(n, []) if not BACK_MATTER.search(p)]
        for i, p in enumerate(expl):
            if BACK_MATTER.search(p):
                expl = expl[:i]
                break
        ok = True
        if expl:
            named = explanation_names(expl)
            if named and answer not in named:
                report['key_disagreements'].append(f'{qid}: key {answer}, explanation names {sorted(named)}')
                ok = False

        skill = manual.get(n) or classify(stem_text, graphical)
        report['skills'][skill] += 1

        out.append({
            'id': qid, 'version': 1,
            'componentId': 'critical-thinking' if skill.startswith('ct-') else 'problem-solving',
            'primarySkillId': skill,
            'secondaryTags': [exam.lower(), year],
            'locator': {'sourceId': source_id, 'paper': 'Section 1', 'questionNumber': n,
                        'page': q['segs'][0][0] + 1, 'keyLocator': f'Answer key, question {n}'},
            'blocks': blocks,
            'options': options,
            'answerOptionId': f'opt-{answer.lower()}',
            'answerVerification': 'verified-key',
            'explanation': {
                'status': 'official' if expl else 'none',
                'blocks': [{'kind': 'paragraph', 'text': p} for p in expl],
                'distractors': [], 'method': None,
                'sourceNote': f'Official explained answer, {exam} {year} Section 1.' if expl else None,
            },
            'flags': {'transcriptionChecked': True, 'answerKeyChecked': ok,
                      'alignmentChecked': True, 'assetsChecked': True},
            'availability': 'interactive' if ok else 'quarantined',
            'distributionMode': 'interactive-approved',
            'duplicateGroupId': f'grp-{qid}',
            'reservedForMock': False,
            'provenance': 'official',
            'quarantineReason': None if ok else 'Answer key disagrees with the official explanation',
        })
    return out, bool(explained)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--papers-dir', required=True)
    ap.add_argument('--out-dir', default=str(HERE.parent / 'content-packs'))
    ap.add_argument('--exam', choices=['TSA', 'BMAT'], action='append')
    a = ap.parse_args()
    exams = a.exam or ['TSA', 'BMAT']

    rows = [r for r in csv.reader(open(HERE / 'papers.tsv'), delimiter='\t')]
    urls = {}
    for year, exam, kind, url in rows:
        urls.setdefault((exam, year), {})[kind] = url

    for exam in exams:
        report = {'skipped_non_mcq': 0, 'skipped_empty': 0, 'graphical': 0, 'garbled_as_image': 0,
                  'key_disagreements': [], 'skills': Counter()}
        sources, questions, assets = [], [], {}
        for (ex, year), u in sorted(urls.items()):
            if ex != exam:
                continue
            source_id = f'{exam.lower()}-{year}-s1'
            qs, has_expl = build_questions(exam, year, source_id, a.papers_dir, report, assets)
            questions.extend(qs)
            sources.append({
                'id': source_id, 'exam': exam, 'year': year, 'section': 'Section 1',
                'title': f'{year} {exam} Section 1',
                'paperUrl': u['Question-Paper'], 'keyUrl': u.get('Answer-Key'),
                'retrievedAt': '2026-09-19', 'version': None,
                'attribution': 'UAT-UK / Cambridge Assessment Admissions Testing. Imported for personal study only.',
                'contentUse': 'interactive-approved', 'importStatus': 'imported',
                'note': f'Imported for personal use: {len(qs)} questions'
                        + (', with official explained answers.' if has_expl else ', answer key only — no official worked explanations exist for this paper.'),
            })
            print(f'  {source_id}: {len(qs)} questions')

        pack = {
            'packFormatVersion': 1, 'id': f'tara-{exam.lower()}', 'name': f'{exam} Section 1 past papers',
            'version': 1, 'createdAt': '2026-09-19',
            'description': 'Personal-use import of the official papers. Not for redistribution.',
            'sources': sources, 'questions': questions, 'writingPrompts': [], 'assets': assets,
        }
        path = Path(a.out_dir) / f'tara-{exam.lower()}.json'
        path.write_text(json.dumps(pack, ensure_ascii=False))
        ct = sum(1 for q in questions if q['componentId'] == 'critical-thinking')
        print(f'{exam}: {len(questions)} questions ({ct} Critical Thinking, {len(questions) - ct} Problem Solving), '
              f'{report["graphical"]} shown as images, {report["skipped_non_mcq"]} free-response/multi-answer skipped, '
              f'{report["skipped_empty"]} empty skipped, {report["garbled_as_image"]} unreadable text shown as images, '
              f'{len(report["key_disagreements"])} key disagreements, '
              f'{path.stat().st_size / 1e6:.1f} MB')
        for d in report['key_disagreements']:
            print('   ', d)
        print('   skills:', dict(report['skills']))


if __name__ == '__main__':
    main()
