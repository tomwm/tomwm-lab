"""
Build a content pack from UAT-UK's TARA Question Guide (June 2026).

    python scripts/import_guide.py --guide TARA_Question_Guide.pdf \
        --out content-packs/tara-guide.json

The guide holds ten worked examples — one for each of the seven Critical
Thinking and three Problem Solving question types — each in a drawn box, with
"The answer is X." and an official explanation after it, plus one sample
Writing Task prompt and UAT-UK's recommendations for answering it.

Personal use only: content-packs/ is gitignored and must not be committed or
deployed.
"""
import argparse, base64, json, re, sys
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).parent))
from pdf_questions import lines_of  # noqa: E402
from import_paper import paragraphs  # noqa: E402

GUIDE_URL = 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/08142344/TARA_Question_Guide.pdf'
SOURCE_ID = 'uatuk-question-guide'

# Example heading -> (skill, component). The guide names these types itself.
TYPES = {
    'Identifying the Main Conclusion': 'ct-main-conclusion',
    'Drawing a Conclusion': 'ct-inference',
    'Identifying an Assumption': 'ct-assumptions',
    'Assessing the Impact of Additional': 'ct-strengthen-weaken',
    'Detecting Reasoning Errors': 'ct-flaws',
    'Matching Arguments': 'ct-argument-patterns',
    'Applying Principles': 'ct-apply-principle',
    'Relevant Selection': 'ps-relevant-selection',
    'Finding Procedures': 'ps-finding-method',
    'Identifying Similarity': 'ps-equivalence',
}
HEADING = re.compile(r'^(Example \d+:|Problem Solving\s*$|Writing Task\s*$|APPENDIX)')
FURNITURE = re.compile(r'^(© UAT-UK \d{4}|\d{1,2})\s*$')

# UAT-UK's recommendations for the Writing Task, as the guide gives them.
WRITING_CHECKLIST = [
    'Have you clearly and fully addressed all three parts of the question?',
    'Are your points precise, without repetition, with similar points grouped together?',
    'Did you plan for 5 to 10 minutes, grouping your ideas around the three parts of the task?',
    'Have you engaged closely with the wording of the statement, taking a broad and nuanced view of any general or abstract terms?',
    'Have you seen both sides, supporting arguments with targeted, concrete examples — and not resting on examples alone?',
    'Is the counter-argument strengthened with a range of points, covering different aspects from different angles?',
    'Is your own view clearly expressed, in enough depth, and supported by the arguments in the rest of your answer — rather than just summarising them?',
]


def render(page, rect, zoom=1.6):
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect, colorspace=pymupdf.csGRAY)
    b64 = base64.b64encode(pix.tobytes('png')).decode()
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {pix.width} {pix.height}">'
            f'<image width="{pix.width}" height="{pix.height}" href="data:image/png;base64,{b64}"/></svg>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--guide', required=True)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()

    doc = pymupdf.open(a.guide)
    # One running list of every line, so explanations can run across pages.
    stream = []
    for pi, page in enumerate(doc):
        for l in lines_of(page):
            stream.append(dict(l, page=pi))

    questions, report = [], []
    for pi, page in enumerate(doc):
        heading = next((l for l in lines_of(page) if l['t'].strip().startswith('Example ')), None)
        if not heading:
            continue
        title = heading['t'].split(':', 1)[1].strip()
        skill = next((s for k, s in TYPES.items() if title.startswith(k)), None)
        if not skill:
            continue
        rects = sorted((pymupdf.Rect(d['rect']) for d in page.get_drawings()), key=lambda r: -r.get_area())
        box = rects[0]
        inside = [dict(l, page=pi) for l in lines_of(page)
                  if box.y0 <= l['y'] < box.y1 and box.x0 <= l['x'] < box.x1]

        stem, opts, cur = [], {}, None
        for l in inside:
            m = re.fullmatch(r'([A-E])', l['first']) if l['first_bold'] and l['first_x'] < box.x0 + 30 else None
            if m:
                cur = m.group(1)
                opts[cur] = []
                rest = l['t'].strip()[1:].strip()
                if rest:
                    opts[cur].append(dict(l, t=rest))
                continue
            (opts[cur] if cur else stem).append(l)

        # Answer and explanation: after the box, possibly on the next page.
        start = next(i for i, l in enumerate(stream) if l['page'] == pi and l is not None
                     and l['y'] == heading['y'] and l['t'] == heading['t'])
        ans_i = next(i for i in range(start + 1, len(stream))
                     if re.match(r'The answer is ([A-E])\.', stream[i]['t'].strip()))
        answer = re.match(r'The answer is ([A-E])\.', stream[ans_i]['t'].strip()).group(1)
        expl_lines = []
        for l in stream[ans_i + 1:]:
            t = l['t'].strip()
            if HEADING.match(t) or t == 'Answer and explanation':
                break
            if FURNITURE.match(t):
                continue
            expl_lines.append(l)

        graphical = len(page.get_drawings()) > 20
        n = sum(1 for q in questions) + 1
        comp = 'critical-thinking' if skill.startswith('ct-') else 'problem-solving'
        qid = f'tara-guide-2026-{"ct" if comp == "critical-thinking" else "ps"}-{skill.split("-", 1)[1]}'
        if graphical:
            first_opt = min(l['y'] for l in opts['A']) - 10
            blocks = [{'kind': 'figure',
                       'alt': 'The example as printed in the TARA question guide. Its text reads: '
                              + ' '.join(paragraphs(stem)),
                       'svg': render(page, pymupdf.Rect(box.x0 + 2, box.y0 + 2, box.x1 - 2, first_opt)),
                       'caption': f'TARA question guide, {title}, as printed'}]
        else:
            blocks = [{'kind': 'paragraph', 'text': p} for p in paragraphs(stem)]

        if list(opts) != list('ABCDE'):
            report.append(f'{qid}: options found {list(opts)} — skipped')
            continue
        questions.append({
            'id': qid, 'version': 1, 'componentId': comp, 'primarySkillId': skill,
            'secondaryTags': ['tara', 'question guide'],
            'locator': {'sourceId': SOURCE_ID, 'paper': 'TARA Question Guide, June 2026',
                        'questionNumber': None, 'page': pi + 1, 'keyLocator': f'"The answer is {answer}.", page {stream[ans_i]["page"] + 1}'},
            'blocks': blocks,
            'options': [{'id': f'opt-{L.lower()}', 'label': L,
                         'blocks': [{'kind': 'paragraph', 'text': ' '.join(paragraphs(opts[L]))}]} for L in 'ABCDE'],
            'answerOptionId': f'opt-{answer.lower()}', 'answerVerification': 'verified-key',
            'explanation': {'status': 'official',
                            'blocks': [{'kind': 'paragraph', 'text': p} for p in paragraphs(expl_lines)],
                            'distractors': [], 'method': None,
                            'sourceNote': 'Official explanation from the TARA question guide (June 2026).'},
            'flags': {'transcriptionChecked': True, 'answerKeyChecked': True,
                      'alignmentChecked': True, 'assetsChecked': True},
            'availability': 'interactive', 'distributionMode': 'interactive-approved',
            'duplicateGroupId': f'grp-{qid}', 'reservedForMock': False, 'provenance': 'official',
            'quarantineReason': None,
        })
        print(f'  {qid}: answer {answer}, {len(paragraphs(expl_lines))} explanation paragraphs'
              + (' (image)' if graphical else ''))

    prompt = {
        'id': 'tara-guide-2026-writing-01', 'version': 1, 'provenance': 'official',
        'locator': {'sourceId': SOURCE_ID, 'paper': 'TARA Question Guide, June 2026',
                    'questionNumber': None, 'page': 18, 'keyLocator': None},
        'statement': 'Democratic freedom means there should be no restriction on what may be said in public.',
        'requirements': ['Explain what you think is meant by the statement.',
                         'Give a reasoned argument against the statement.',
                         'To what extent do you agree with the statement?'],
        'coaching': {'status': 'none', 'approaches': [], 'counterpoints': [], 'checklist': WRITING_CHECKLIST},
        'skillIds': ['wr-interpret-claim', 'wr-counterargument', 'wr-judgement', 'wr-planning-editing'],
        'availability': 'interactive',
    }

    pack = {
        'packFormatVersion': 1, 'id': 'tara-guide', 'name': 'TARA question guide (June 2026)',
        'version': 1, 'createdAt': '2026-09-19',
        'description': 'Personal-use import of the official examples. Not for redistribution.',
        'sources': [{
            'id': SOURCE_ID, 'exam': 'TARA', 'year': '2026-27', 'section': None,
            'title': 'TARA question guide (2026-27)', 'paperUrl': GUIDE_URL, 'keyUrl': None,
            'retrievedAt': '2026-09-19', 'version': '2026-27', 'attribution': 'UAT-UK',
            'contentUse': 'interactive-approved', 'importStatus': 'imported',
            'note': f'Imported for personal use: {len(questions)} worked examples with official explanations, '
                    'and the sample Writing Task prompt with UAT-UK’s recommendations as its checklist.',
        }],
        'questions': questions, 'writingPrompts': [prompt],
    }
    Path(a.out).write_text(json.dumps(pack, ensure_ascii=False))
    print(f'Wrote {a.out}: {len(questions)} questions, 1 writing prompt')
    for r in report:
        print('  ' + r)


if __name__ == '__main__':
    main()
