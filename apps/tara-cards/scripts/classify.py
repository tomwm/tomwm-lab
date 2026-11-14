"""Map a question to one primary skill from its wording. Heuristic, and says so."""
import re

CT_RULES = [
    (r'\bflaw', 'ct-flaws'),
    (r'\bassum', 'ct-assumptions'),
    (r'main conclusion', 'ct-main-conclusion'),
    (r'weaken|strengthen|undermine|challenge|support (?:for )?the|best explain|explains? the', 'ct-strengthen-weaken'),
    (r'parallel|similar (?:in|to)|same (?:structure|pattern|reasoning)|closest to the reasoning', 'ct-argument-patterns'),
    (r'principle', 'ct-apply-principle'),
    (r'conclusion|can be (?:inferred|concluded|drawn)|must be true|follows? from|best supported|reliably', 'ct-inference'),
]

EQUIV = r'which (?:one )?of the following (?:graphs?|charts?|diagrams?|nets?|views?|shapes?|tables?|pie|patterns?)' \
        r'|could be (?:the|a) (?:net|view|graph)|represents?|shows? (?:the|this|these) (?:proportion|content|data|same)' \
        r'|exactly the same|equivalent'


def ask_sentence(stem_text):
    sents = re.split(r'(?<=[.?!])\s+', stem_text.strip())
    asks = [s for s in sents if '?' in s]
    return (asks[-1] if asks else sents[-1] if sents else '').lower()


def classify(stem_text, graphical):
    ask = ask_sentence(stem_text)
    for pat, skill in CT_RULES:
        if re.search(pat, ask):
            return skill
    if re.search(EQUIV, ask):
        return 'ps-equivalence'
    if graphical or re.search(r'\btable\b|\bgraph\b|\bchart\b|timetable|below shows', stem_text.lower()):
        return 'ps-relevant-selection'
    return 'ps-finding-method'
