/**
 * Seeds four text workspaces with a small, credible starter set.
 *
 * Quotation policy (important — do not loosen this casually):
 *  - Dracula (1897) and King Lear (c.1606) are public domain. Short, very
 *    well-known lines are included as evidence with confidence `solid`.
 *  - Beloved (1987) and Jerusalem (2009) are in copyright. Evidence cards for
 *    these ship WITHOUT invented quotations — the quote field is left for the
 *    student to fill in from her own copy, except one extremely short,
 *    famously-reproduced case (Beloved's three-word opening line).
 *  - Critics/sources named here (Arata on Dracula, the Fugitive Slave Act,
 *    the original Royal Court/Apollo staging of Jerusalem) are real and
 *    well documented, but are flagged "needs_checking" wherever this seed
 *    isn't fully certain of an exact citation detail — verify before citing
 *    in written work.
 *
 * Run with: npm run db:seed (after npm run db:push)
 */
import { db } from "./client";
import {
  texts,
  structureNodes,
  cards,
  cardTexts,
  cardLinks,
  reviewStates,
  cardStructureNodes,
  essays,
  type CardType,
} from "./schema";
import { newId } from "@/lib/ids";
import { generatePromptsForCard } from "@/lib/practice";

const now = Date.now();
const slugToTextId = new Map<string, string>();

async function clearAll() {
  // essays/essayFeedback/developMoments have no FK back to texts or cards
  // (they reference them only by id in free-text/JSON fields), so they must
  // be cleared explicitly — they won't cascade from deleting texts/cards.
  await db.delete(essays);
  await db.delete(reviewStates);
  await db.delete(cardLinks);
  await db.delete(cards);
  await db.delete(structureNodes);
  await db.delete(texts);
}

interface NodeSeed {
  key: string;
  kind: "act" | "scene" | "chapter" | "document" | "poem" | "section" | "movement";
  title: string;
  locationRef: string;
  track?: string;
  orderIndex: number;
  chronologyOrderIndex?: number;
  chronologyLabel?: string;
  dateInWorld?: string;
  narratorOrPov?: string;
  summary?: string;
  significance?: string;
  /** True where this seed is working from general knowledge of the text's
   *  shape rather than something it can state as verified fact. */
  needsVerification?: boolean;
  /** Character card keys present in this scene/beat — drives the presence grid. */
  characters?: string[];
  /** Publication/performance history, kept out of the fictional timeline. */
  isRealWorldEvent?: boolean;
}

interface CardSeed {
  key: string;
  type: CardType;
  title: string;
  structureNodeKey?: string;
  locationRef?: string;
  quoteText?: string;
  quoteVerified?: boolean;
  speakerOrNarrator?: string;
  studentExplanation?: string;
  sourceNote?: string;
  provenance: "app_written";
  confidence: "solid" | "tentative" | "needs_checking";
  tags?: string[];
  textIds?: string[]; // for comparison cards spanning texts, keyed by text slug
}

interface LinkSeed {
  from: string;
  to: string;
  relation: "supports" | "challenges" | "contrasts_with" | "develops" | "foreshadows" | "provides_context_for";
  explanation: string;
}

async function seedText(opts: {
  slug: string;
  title: string;
  author: string;
  textType: "novel" | "play";
  structureMode: "chapters" | "acts_scenes" | "narration_vs_chronology";
  accentKey: string;
  summary: string;
  nodes: NodeSeed[];
  cards: CardSeed[];
  links: LinkSeed[];
}) {
  const textId = newId("text");
  await db.insert(texts).values({
    id: textId,
    slug: opts.slug,
    title: opts.title,
    author: opts.author,
    textType: opts.textType,
    structureMode: opts.structureMode,
    qualificationCode: "H472",
    assessmentComponent: null,
    assessmentComponentNote: "Not yet confirmed — set this in Settings once the course outline is finalised.",
    summary: opts.summary,
    accentKey: opts.accentKey,
    createdAt: now,
  });
  slugToTextId.set(opts.slug, textId);

  const nodeIdByKey = new Map<string, string>();
  for (const n of opts.nodes) {
    const id = newId("node");
    nodeIdByKey.set(n.key, id);
    await db.insert(structureNodes).values({
      id,
      textId,
      parentId: null,
      kind: n.kind,
      title: n.title,
      locationRef: n.locationRef,
      track: n.track ?? null,
      orderIndex: n.orderIndex,
      chronologyOrderIndex: n.chronologyOrderIndex ?? null,
      chronologyLabel: n.chronologyLabel ?? null,
      dateInWorld: n.dateInWorld ?? null,
      narratorOrPov: n.narratorOrPov ?? null,
      summary: n.summary ?? null,
      significance: n.significance ?? null,
      isRealWorldEvent: n.isRealWorldEvent ?? false,
      isUserAdded: false,
      needsVerification: n.needsVerification ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  const cardIdByKey = new Map<string, string>();
  for (const c of opts.cards) {
    const id = newId("card");
    cardIdByKey.set(c.key, id);
    await db.insert(cards).values({
      id,
      type: c.type,
      title: c.title,
      primaryTextId: textId,
      locationRef: c.locationRef ?? null,
      quoteText: c.quoteText ?? null,
      quoteVerified: c.quoteVerified ?? false,
      speakerOrNarrator: c.speakerOrNarrator ?? null,
      studentExplanation: c.studentExplanation ?? null,
      sourceNote: c.sourceNote ?? null,
      provenance: c.provenance,
      confidence: c.confidence,
      tags: c.tags ?? [],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    });

    if (c.structureNodeKey) {
      const nodeId = nodeIdByKey.get(c.structureNodeKey);
      if (nodeId) {
        await db.insert(cardStructureNodes).values({ id: newId("csn"), cardId: id, structureNodeId: nodeId });
      }
    }

    if (c.textIds?.length) {
      for (const slug of c.textIds) {
        const otherTextId = slugToTextId.get(slug);
        if (!otherTextId) continue; // referenced text not seeded yet — skip rather than guess
        await db.insert(cardTexts).values({ id: newId("ctx"), cardId: id, textId: otherTextId, roleNote: null });
      }
    }

    const prompts = generatePromptsForCard({
      type: c.type,
      title: c.title,
      locationRef: c.locationRef ?? null,
      speakerOrNarrator: c.speakerOrNarrator ?? null,
      hasQuote: !!c.quoteText,
    });
    for (const p of prompts) {
      await db.insert(reviewStates).values({
        id: newId("rs"),
        cardId: id,
        promptType: p.promptType,
        easeFactor: 250,
        intervalDays: 0,
        dueAt: now,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Character presence per scene/beat — the same card/section binding every
  // other card type uses, written after cards exist so the keys resolve.
  // Only seeded where this seed is confident; the rest she fills in herself.
  for (const n of opts.nodes) {
    const nodeId = nodeIdByKey.get(n.key);
    if (!nodeId || !n.characters?.length) continue;
    for (const charKey of n.characters) {
      const cardId = cardIdByKey.get(charKey);
      if (!cardId) continue;
      await db.insert(cardStructureNodes).values({ id: newId("csn"), cardId, structureNodeId: nodeId });
    }
  }

  for (const l of opts.links) {
    const fromId = cardIdByKey.get(l.from);
    const toId = cardIdByKey.get(l.to);
    if (!fromId || !toId) continue;
    await db.insert(cardLinks).values({
      id: newId("cl"),
      fromCardId: fromId,
      toCardId: toId,
      relation: l.relation,
      explanation: l.explanation,
      createdAt: now,
    });
  }

  return { textId, nodeIdByKey, cardIdByKey };
}

async function main() {
  await clearAll();

  // ─── DRACULA ────────────────────────────────────────────────────────────
  const draculaNodes: NodeSeed[] = [
    { key: "ch1", kind: "chapter", title: "Chapter 1", locationRef: "Ch. 1", orderIndex: 1, characters: ["dr-char-dracula"], narratorOrPov: "Jonathan Harker (journal)", dateInWorld: "Early May", summary: "Harker travels through Transylvania to Castle Dracula, past increasingly anxious locals.", significance: "Establishes the journey from rational modern Europe into a world where the narrators' assumptions stop working." },
    { key: "ch2", kind: "chapter", title: "Chapter 2", locationRef: "Ch. 2", orderIndex: 2, characters: ["dr-char-dracula"], narratorOrPov: "Jonathan Harker (journal)", summary: "Harker meets Count Dracula, dines with him, and hears Dracula speak about his family and his plans to move to London.", significance: "Dracula's hospitality and control over the house are established together." },
    { key: "ch3", kind: "chapter", title: "Chapter 3", locationRef: "Ch. 3", orderIndex: 3, characters: ["dr-char-dracula"], narratorOrPov: "Jonathan Harker (journal)", summary: "Harker realises he is a prisoner in the castle and sees Dracula climb head-first down the outer wall.", significance: "The first clearly supernatural detail Harker records himself, rather than hearing secondhand." },
    { key: "ch4", kind: "chapter", title: "Chapter 4", locationRef: "Ch. 4", orderIndex: 4, characters: ["dr-char-dracula"], narratorOrPov: "Jonathan Harker (journal)", summary: "The three vampire women threaten Harker; Dracula stops them, claiming Harker for himself.", significance: "Introduces the novel's recurring pattern of possession and claimed ownership over bodies." },
    { key: "ch5-7", kind: "chapter", title: "Chapters 5–7", locationRef: "Ch. 5–7", orderIndex: 5, characters: ["dr-char-mina", "dr-char-renfield"], narratorOrPov: "Mina & Lucy (letters), Dr Seward (diary), ship's log, newspaper cutting", summary: "In England, Lucy receives three proposals; Seward's patient Renfield is introduced; the Demeter wrecks at Whitby with her crew gone and a large dog seen leaping ashore.", significance: "Multiple document types are woven together — the reader has to do the work of connecting what none of the narrators yet can." },
    { key: "ch8-9", kind: "chapter", title: "Chapters 8–9", locationRef: "Ch. 8–9", orderIndex: 6, characters: ["dr-char-mina"], narratorOrPov: "Mina's journal, Seward's diary", summary: "Lucy begins sleepwalking and declining; Mina finds her in the churchyard with a dark figure. Mina travels to nurse Jonathan and they marry.", significance: "Lucy's decline is witnessed only partially by each character — no single narrator has the full picture." },
    { key: "ch10-12", kind: "chapter", title: "Chapters 10–12", locationRef: "Ch. 10–12", orderIndex: 7, characters: ["dr-char-renfield"], narratorOrPov: "Seward's diary", summary: "Van Helsing is called in; repeated blood transfusions fail to save Lucy, who dies.", significance: "Modern medicine (transfusion) is shown as helpless against a threat the men don't yet name." },
    { key: "ch13-16", kind: "chapter", title: "Chapters 13–16", locationRef: "Ch. 13–16", orderIndex: 8, characters: ["dr-char-mina"], narratorOrPov: "Seward's diary, newspaper cuttings", summary: "Reports of a \"bloofer lady\" attacking children lead the men to Lucy's tomb, where they find her undead and destroy her.", significance: "The novel's most disturbing act of violence is carried out by the \"good\" characters, framed as necessary mercy." },
    { key: "ch17-18", kind: "chapter", title: "Chapters 17–18", locationRef: "Ch. 17–18", orderIndex: 9, characters: ["dr-char-mina", "dr-char-renfield"], narratorOrPov: "Mina compiles the group's documents", summary: "The group pools every diary, letter and cutting; Mina, as typist, becomes central to assembling the case against Dracula.", significance: "The novel makes its own method visible: this is how a shared, incomplete set of accounts becomes a single narrative." },
    { key: "ch19-21", kind: "chapter", title: "Chapters 19–21", locationRef: "Ch. 19–21", orderIndex: 10, characters: ["dr-char-mina", "dr-char-renfield", "dr-char-dracula"], narratorOrPov: "Jonathan & Seward's diaries", summary: "The men sanitise Dracula's boxes of earth; Renfield is found dying; Dracula is discovered forcing Mina to drink his blood.", significance: "Mina moves from documenter to victim, complicating her role in the narrative she has been assembling." },
    { key: "ch22-23", kind: "chapter", title: "Chapters 22–23", locationRef: "Ch. 22–23", orderIndex: 11, characters: ["dr-char-mina", "dr-char-dracula"], summary: "The group destroys Dracula's remaining boxes; Van Helsing marks Mina with a sacred wafer, which burns her; the men corner Dracula, who escapes to flee England.", significance: "Mina's marked forehead makes her contamination visible on her body, echoing anxieties about purity elsewhere in the novel." },
    { key: "ch24-27", kind: "chapter", title: "Chapters 24–27", locationRef: "Ch. 24–27", orderIndex: 12, characters: ["dr-char-mina", "dr-char-dracula"], summary: "The group pursues Dracula back to Transylvania. In the final confrontation Quincey Morris is fatally wounded, and Jonathan and Quincey kill Dracula as the sun sets.", significance: "The novel closes with a note, years later, naming a son after \"all our little band of men\" — especially Quincey." },
  ];

  const dr: CardSeed[] = [
    { key: "dr-ev-welcome", type: "evidence", title: "Dracula's welcome to Harker", structureNodeKey: "ch2", locationRef: "Ch. 2", speakerOrNarrator: "Count Dracula, to Harker", provenance: "app_written", confidence: "needs_checking", tags: ["hospitality", "threshold"], studentExplanation: "Dracula welcomes Harker with a speech about coming freely and going safely — check the exact wording in your edition and add it here. Once you have it exact, analyse what's unsettling about a welcome that turns out to be a trap." },
    { key: "dr-ev-children-of-night", type: "evidence", title: "\"Children of the night\"", structureNodeKey: "ch2", locationRef: "Ch. 2–3", quoteText: "Listen to them—the children of the night. What music they make!", quoteVerified: true, speakerOrNarrator: "Count Dracula", provenance: "app_written", confidence: "solid", tags: ["nature", "the-uncanny"], studentExplanation: "Dracula finds beauty (\"music\") in the howling of wolves — a moment where he seems to belong to a natural order Harker (and the reader) finds alien and threatening." },
    { key: "dr-ev-blood-is-life", type: "evidence", title: "\"The blood is the life\"", locationRef: "Ch. 11", quoteText: "The blood is the life!", quoteVerified: true, speakerOrNarrator: "Renfield", provenance: "app_written", confidence: "solid", tags: ["blood", "renfield", "biblical-allusion"], studentExplanation: "Renfield is quoting Deuteronomy 12:23. His deranged echo of scripture links the novel's vampire mythology to real religious language about blood and life." },
    { key: "dr-ev-lucy-staking", type: "evidence", title: "The destruction of Lucy", structureNodeKey: "ch13-16", locationRef: "Ch. 16", provenance: "app_written", confidence: "needs_checking", tags: ["violence", "gender"], studentExplanation: "Add the exact description of Lucy's staking here once you've re-read Ch.16. Consider: the men describe this as restoring her \"holy calm\" — what does the chapter want you to feel about an act of violence against a woman's body carried out by men who love her?" },
    { key: "dr-theme-thresholds", type: "theme", title: "Invitation and the threshold", provenance: "app_written", confidence: "solid", tags: ["power", "consent"], studentExplanation: "In the novel's vampire mythology, Dracula cannot enter a home uninvited. Power in Dracula repeatedly depends on someone granting access — literally at a threshold, and more broadly through trust, hospitality or naivety." },
    { key: "dr-theme-modernity", type: "theme", title: "Modernity vs the ancient", provenance: "app_written", confidence: "solid", tags: ["technology", "science"], studentExplanation: "Typewriters, phonographs, blood transfusion and train timetables are set against Dracula's ancient, folkloric power. Track where modern methods help the group, and where they fail or arrive too late." },
    { key: "dr-theme-narration", type: "theme", title: "Who knows what, and when", provenance: "app_written", confidence: "solid", tags: ["narration", "structure"], studentExplanation: "The novel is built entirely from documents compiled after the fact. No single narrator has the full picture while events are happening. Track a moment where the reader knows more than a character does, or vice versa." },
    { key: "dr-method-epistolary", type: "method", title: "Epistolary form: a compiled dossier", provenance: "app_written", confidence: "solid", tags: ["form", "narration", "structure"], studentExplanation: "Journals, letters, telegrams, a ship's log and newspaper cuttings, assembled after the fact. The form means every account is partial and retrospective — and that the 'truth' about Dracula only exists once the documents are collated. Ask what a single omniscient narrator would have destroyed." },
    { key: "dr-method-delay", type: "method", title: "Withholding and dramatic irony", provenance: "app_written", confidence: "solid", tags: ["structure", "form", "suspense"], studentExplanation: "Because entries are dated and interleaved, the reader routinely knows more than the writer of the entry does — Harker's journal reads very differently once you know what he's describing. Find a passage where that gap does the work." },
    { key: "dr-char-dracula", type: "character", title: "Count Dracula", provenance: "app_written", confidence: "solid", tags: ["dracula"], studentExplanation: "Dracula is seen almost entirely through others' accounts — he narrates nothing himself after Ch.1–4. Consider what that structural choice does to how threatening or sympathetic he can seem." },
    { key: "dr-char-mina", type: "character", title: "Mina Harker", provenance: "app_written", confidence: "solid", tags: ["mina", "gender"], studentExplanation: "Mina is the novel's central compiler of documents and later Dracula's victim. Critics often contrast her with Lucy as a \"New Woman\" figure who is competent and modern but still ultimately protected/managed by the men." },
    { key: "dr-char-renfield", type: "character", title: "Renfield", provenance: "app_written", confidence: "solid", tags: ["renfield", "madness"], studentExplanation: "Renfield's \"zoophagy\" (eating flies, spiders, birds to absorb life) makes him a distorted mirror of Dracula's own hunger for blood, staged inside the asylum rather than out in the world." },
    { key: "dr-context-transfusion", type: "context", title: "Blood transfusion before blood groups", sourceNote: "Blood groups (ABO) were identified by Karl Landsteiner in 1901 — four years after Dracula was published.", provenance: "app_written", confidence: "solid", tags: ["science", "victorian"], studentExplanation: "The novel's transfusions from multiple donors into Lucy would have been medically dangerous by later standards, since blood-type incompatibility wasn't yet understood. It's worth asking what the transfusions mean symbolically (repeated \"marriage\" of blood) rather than only medically." },
    { key: "dr-context-newwoman", type: "context", title: "The \"New Woman\"", provenance: "app_written", confidence: "solid", tags: ["gender", "victorian"], studentExplanation: "The 1890s saw growing public debate about women's independence, education and role in marriage — the so-called \"New Woman\". Mina jokes about New Women in the novel even while embodying some of that competence herself." },
    { key: "dr-interp-hunters", type: "interpretation", title: "The hunters mirror what they hunt", provenance: "app_written", confidence: "tentative", tags: ["violence", "morality"], studentExplanation: "Test this claim: \"In destroying Dracula, Van Helsing's group increasingly adopts his methods — secrecy, violation of bodies, control over women's choices.\" Find two moments that support it, and one moment that complicates it." },
    { key: "dr-perf-arata", type: "performance", title: "Reverse colonization reading", sourceNote: "Associated with Stephen D. Arata's essay on Dracula and anxieties of reverse colonization (Victorian Studies, c.1990) — verify the exact citation before using it in an essay.", provenance: "app_written", confidence: "needs_checking", tags: ["criticism", "empire"], studentExplanation: "This well-known critical reading argues the novel expresses British anxiety about being \"colonised\" in reverse by a foreign threat. Consider what evidence in the text supports or complicates this beyond the obvious foreignness of Dracula himself." },
  ];

  const drLinks: LinkSeed[] = [
    { from: "dr-ev-children-of-night", to: "dr-theme-thresholds", relation: "supports", explanation: "Dracula's comfort with the wild/uncanny world outside the house contrasts with how carefully his access to human spaces is controlled." },
    { from: "dr-ev-lucy-staking", to: "dr-interp-hunters", relation: "supports", explanation: "The men's violent \"cure\" for Lucy is one of the clearest moments where their methods start to resemble the threat they're fighting." },
    { from: "dr-context-transfusion", to: "dr-char-mina", relation: "provides_context_for", explanation: "Reading the transfusions as symbolic (rather than only medical) changes how you read the men's repeated claims over Lucy's, and later Mina's, body." },
    { from: "dr-perf-arata", to: "dr-char-dracula", relation: "challenges", explanation: "A reverse-colonization reading asks you to look past Dracula as simply monstrous, toward what cultural fear he's shaped to represent." },
  ];

    draculaNodes.push(
    { key: "dr-rw-pub", kind: "section", title: "Dracula published", locationRef: "1897", orderIndex: 1000, dateInWorld: "1897", isRealWorldEvent: true, summary: "Stoker's novel is published in London.", significance: "Everything in the novel was written for an 1890s readership — the anxieties it plays on are theirs, not ours." },
    { key: "dr-rw-blood", kind: "section", title: "Blood groups identified", locationRef: "1901", orderIndex: 1001, dateInWorld: "1901", isRealWorldEvent: true, summary: "Karl Landsteiner identifies the ABO blood groups — four years after publication.", significance: "The novel's repeated transfusions were written before anyone knew blood types had to match." },
  );

  const draculaResult = await seedText({
    slug: "dracula",
    title: "Dracula",
    author: "Bram Stoker",
    textType: "novel",
    structureMode: "chapters",
    accentKey: "dracula",
    summary: "Told entirely through journals, letters, telegrams and news cuttings compiled after the events. Pay attention to who is narrating, what they can't yet know, and how the documents are eventually assembled into one case.",
    nodes: draculaNodes,
    cards: dr,
    links: drLinks,
  });

  // ─── KING LEAR ──────────────────────────────────────────────────────────
  const lear: NodeSeed[] = [
    { key: "1.1", kind: "scene", title: "Lear divides the kingdom", locationRef: "1.1", track: "shared", orderIndex: 1, characters: ["kl-char-lear", "kl-char-cordelia", "kl-char-edmund", "kl-char-gloucester"], summary: "Lear demands declarations of love from his daughters before dividing his kingdom; Cordelia's honesty costs her everything; Kent is banished for objecting. Gloucester introduces Edmund to Kent.", significance: "Both plots begin here: a father misjudges which child truly loves him." },
    { key: "1.2", kind: "scene", title: "Edmund's plot begins", locationRef: "1.2", track: "gloucester_plot", orderIndex: 2, characters: ["kl-char-edmund", "kl-char-gloucester", "kl-char-edgar"], summary: "Edmund's soliloquy on \"Nature\" as his goddess; he forges a letter to make Gloucester believe Edgar plots against him.", significance: "Sets out Edmund's justification for treating bonds of blood as irrelevant to who deserves power." },
    { key: "1.4", kind: "scene", title: "Lear at Goneril's house", locationRef: "1.4", track: "lear_plot", orderIndex: 3, characters: ["kl-char-lear", "kl-char-fool"], summary: "Goneril's household treats Lear with open disrespect; the Fool needles Lear about his own foolishness in giving away his power.", significance: "Lear first feels the practical consequences of having no authority left to enforce respect." },
    { key: "2.4", kind: "scene", title: "Lear finds Kent in the stocks", locationRef: "2.4", track: "lear_plot", orderIndex: 4, characters: ["kl-char-lear", "kl-char-fool", "kl-char-gloucester"], summary: "Regan and Goneril together strip Lear of his knights and his remaining status; Lear storms out into the gathering storm.", significance: "The daughters' cruelty is coordinated, not accidental — and Lear has no power left to answer it." },
    { key: "3.2", kind: "scene", title: "The storm on the heath", locationRef: "3.2", track: "lear_plot", orderIndex: 5, characters: ["kl-char-lear", "kl-char-fool"], summary: "Lear rages at the storm, beginning to recognise his own smallness and folly.", significance: "The storm is both literal weather and a staging of Lear's mental unravelling." },
    { key: "3.4", kind: "scene", title: "The hovel: Lear meets Poor Tom", locationRef: "3.4", track: "shared", orderIndex: 6, characters: ["kl-char-lear", "kl-char-fool", "kl-char-edgar", "kl-char-gloucester"], summary: "Lear, Kent and the Fool meet the disguised Edgar (as Poor Tom); Lear's madness deepens as he fixates on Tom as a figure of \"unaccommodated man\".", significance: "Lear and Poor Tom — a king and a disguised, apparently mad beggar — briefly occupy the same moral ground." },
    { key: "3.7", kind: "scene", title: "Gloucester is blinded", locationRef: "3.7", track: "gloucester_plot", orderIndex: 7, characters: ["kl-char-gloucester", "kl-char-edmund"], summary: "Cornwall gouges out Gloucester's eyes on stage; a servant, appalled, fatally wounds Cornwall in protest.", significance: "The Gloucester plot's cruelty becomes as literal and physical as the Lear plot's is emotional." },
    { key: "4.1", kind: "scene", title: "Gloucester meets Poor Tom", locationRef: "4.1", track: "gloucester_plot", orderIndex: 8, characters: ["kl-char-gloucester", "kl-char-edgar"], summary: "Blinded Gloucester, guided by the disguised Edgar, reflects bitterly on the gods' indifference to human suffering.", significance: "Gloucester's literal blindness ends where his figurative blindness (trusting Edmund) began." },
    { key: "4.6", kind: "scene", title: "\"Dover cliff\"", locationRef: "4.6", track: "shared", orderIndex: 9, characters: ["kl-char-gloucester", "kl-char-edgar", "kl-char-lear"], summary: "Edgar tricks Gloucester into surviving a fake suicide attempt from an imagined cliff; mad Lear enters and speaks with unsettling clarity about justice and desert.", significance: "Both plots converge on the idea that despair can be treated, even staged, rather than simply endured." },
    { key: "4.7", kind: "scene", title: "Lear and Cordelia reunited", locationRef: "4.7", track: "lear_plot", orderIndex: 10, characters: ["kl-char-lear", "kl-char-cordelia"], summary: "Lear wakes from madness to find Cordelia has not abandoned him, and asks her forgiveness.", significance: "The play's one clear moment of reconciliation — made almost unbearable by what follows." },
    { key: "5.3", kind: "scene", title: "The deaths", locationRef: "5.3", track: "shared", orderIndex: 11, characters: ["kl-char-lear", "kl-char-cordelia", "kl-char-edmund", "kl-char-edgar"], summary: "Edmund is exposed and mortally wounded by Edgar; Goneril poisons Regan and kills herself; Cordelia is hanged on Edmund's earlier order before his late confession can stop it; Lear dies grieving over her body.", significance: "Whatever restoration of order the ending offers, it comes after losses the play refuses to soften." },
  ];

  const kl: CardSeed[] = [
    { key: "kl-ev-nothing", type: "evidence", title: "\"Nothing will come of nothing\"", structureNodeKey: "1.1", locationRef: "1.1", quoteText: "Nothing will come of nothing. Speak again.", quoteVerified: true, speakerOrNarrator: "Lear, to Cordelia", provenance: "app_written", confidence: "solid", tags: ["language", "authority"], studentExplanation: "Lear treats love as something that must be spoken to exist. Cordelia's refusal to \"heave her heart into her mouth\" exposes how much Lear's authority depends on performance rather than substance." },
    { key: "kl-ev-serpent", type: "evidence", title: "\"Sharper than a serpent's tooth\"", structureNodeKey: "1.4", locationRef: "1.4", quoteText: "How sharper than a serpent's tooth it is / To have a thankless child!", quoteVerified: true, speakerOrNarrator: "Lear", provenance: "app_written", confidence: "solid", tags: ["family", "ingratitude"] },
    { key: "kl-ev-blow-winds", type: "evidence", title: "\"Blow, winds\"", structureNodeKey: "3.2", locationRef: "3.2", quoteText: "Blow, winds, and crack your cheeks! rage! blow!", quoteVerified: true, speakerOrNarrator: "Lear", provenance: "app_written", confidence: "solid", tags: ["madness", "nature"], studentExplanation: "Lear commands the storm as he once commanded his kingdom — the language of absolute power turned on something that cannot obey him." },
    { key: "kl-ev-flies", type: "evidence", title: "\"As flies to wanton boys\"", structureNodeKey: "4.1", locationRef: "4.1", quoteText: "As flies to wanton boys are we to th' gods; / They kill us for their sport.", quoteVerified: true, speakerOrNarrator: "Gloucester", provenance: "app_written", confidence: "solid", tags: ["justice", "gods", "nihilism"] },
    { key: "kl-ev-ripeness", type: "evidence", title: "\"Ripeness is all\"", structureNodeKey: "5.3", locationRef: "5.2", quoteText: "Men must endure / Their going hence, even as their coming hither: / Ripeness is all.", quoteVerified: true, speakerOrNarrator: "Edgar, to Gloucester", provenance: "app_written", confidence: "solid", tags: ["endurance", "philosophy"] },
    { key: "kl-ev-never", type: "evidence", title: "\"Never, never, never, never, never\"", structureNodeKey: "5.3", locationRef: "5.3", quoteText: "Never, never, never, never, never!", quoteVerified: true, speakerOrNarrator: "Lear, over Cordelia's body", provenance: "app_written", confidence: "solid", tags: ["grief", "language"], studentExplanation: "Five bare monosyllables — critics disagree about whether this is the bleakest line in the play or oddly close to Lear finally speaking without performance." },
    { key: "kl-theme-authority", type: "theme", title: "Authority once given away", provenance: "app_written", confidence: "solid", tags: ["power", "authority"], studentExplanation: "Lear expects the \"name\" of king to survive without the power. Track every moment characters test how much authority Lear has left, and who still chooses to obey him." },
    { key: "kl-theme-sight", type: "theme", title: "Sight and blindness", provenance: "app_written", confidence: "solid", tags: ["imagery", "irony"], studentExplanation: "Gloucester is literally blinded after being figuratively blind to Edmund's lies; Lear says he sees clearly while completely misjudging his daughters. Track where \"seeing\" and \"knowing\" separate." },
    { key: "kl-theme-nature", type: "theme", title: "Competing ideas of \"Nature\"", provenance: "app_written", confidence: "solid", tags: ["nature", "edmund", "power"], studentExplanation: "Edmund invokes \"Nature\" to justify self-interest and reject inherited bonds; other characters use \"nature\" to mean natural affection and duty. The play never resolves which \"nature\" wins." },
    { key: "kl-method-double-plot", type: "method", title: "The double plot", provenance: "app_written", confidence: "solid", tags: ["structure", "form"], studentExplanation: "Lear/daughters and Gloucester/sons run in parallel, converging at 3.4, 4.6 and 5.3. The doubling means each plot comments on the other: Gloucester's literal blinding reads against Lear's figurative blindness. Note how rarely the two sets of characters share a stage before those convergences." },
    { key: "kl-method-prose-verse", type: "method", title: "Verse, prose and the Fool's rhymes", provenance: "app_written", confidence: "needs_checking", tags: ["form", "language"], studentExplanation: "Track where characters shift between verse and prose — Lear's breakdown, Edgar's Poor Tom register, the Fool's snatches of rhyme. Check specific passages in your edition, then ask what each shift signals about status or state of mind." },
    { key: "kl-char-lear", type: "character", title: "Lear", provenance: "app_written", confidence: "solid", tags: ["lear"] },
    { key: "kl-char-cordelia", type: "character", title: "Cordelia", provenance: "app_written", confidence: "solid", tags: ["cordelia"], studentExplanation: "Cordelia appears in only a handful of scenes, yet the play makes her absence and her return the emotional centre of the action. Consider what her silence in Act 1 and near-silence before her death do to how she's read." },
    { key: "kl-char-edmund", type: "character", title: "Edmund", provenance: "app_written", confidence: "solid", tags: ["edmund"] },
    { key: "kl-char-fool", type: "character", title: "The Fool", provenance: "app_written", confidence: "solid", tags: ["fool"], studentExplanation: "The Fool tells Lear the truth no one else dares to, then vanishes from the play without explanation after 3.6. Consider what function he serves, why Shakespeare doesn't need to account for his disappearance, and what changes in Lear once the Fool is no longer there to contradict him." },
    { key: "kl-char-gloucester", type: "character", title: "Gloucester", provenance: "app_written", confidence: "solid", tags: ["gloucester", "sight"], studentExplanation: "Gloucester's arc mirrors Lear's: a father who misjudges which child loves him, punished far past any proportion to the error. His is the plot where the play's cruelty becomes physical." },
    { key: "kl-char-edgar", type: "character", title: "Edgar / Poor Tom", provenance: "app_written", confidence: "solid", tags: ["edgar", "disguise"], studentExplanation: "Edgar spends most of the play in disguise, and chooses not to reveal himself to his blinded father until 5.3. Whether that withholding is kindness or cruelty is genuinely arguable — a good interpretation card waiting to be written." },
    { key: "kl-context-order", type: "context", title: "Order, hierarchy and \"correspondence\"", sourceNote: "Often discussed via E.M.W. Tillyard's account of the Elizabethan/Jacobean \"world picture\" — verify the exact reference before citing it.", provenance: "app_written", confidence: "needs_checking", tags: ["jacobean", "order"], studentExplanation: "Jacobean audiences were used to the idea that disorder in a family, the state and the cosmos reflected one another. The kingdom's division and the storm can both be read against that expectation." },
    { key: "kl-context-sources", type: "context", title: "Shakespeare's sources", provenance: "app_written", confidence: "solid", tags: ["sources"], studentExplanation: "Shakespeare drew on an earlier anonymous play, King Leir, and on Geoffrey of Monmouth's legendary history for the Lear plot; the Gloucester subplot is adapted from a blind-king story in Philip Sidney's Arcadia. Unlike his source material, Shakespeare's ending does not restore Cordelia to the throne." },
    { key: "kl-interp-authority-performance", type: "interpretation", title: "Lear's authority depends on others performing deference", provenance: "app_written", confidence: "tentative", tags: ["power"], studentExplanation: "Test this claim using 1.1, 1.4 and 2.4: find two moments that support it, and consider whether the Fool or Cordelia complicate it." },
    { key: "kl-interp-bleak", type: "interpretation", title: "The play offers no final justice", provenance: "app_written", confidence: "tentative", tags: ["nihilism", "ending"], studentExplanation: "Test this claim against the ending: Edgar and Albany survive to \"rule\", but Cordelia dies after Edmund's change of heart arrives too late. Does the ending suggest any restored order, or none?" },
    { key: "kl-perf-ending", type: "performance", title: "Staging the ending's bleakness", sourceNote: "General performance-history point — add a specific production you've seen or studied once confirmed.", provenance: "app_written", confidence: "needs_checking", tags: ["staging"], studentExplanation: "Productions vary in how bleak they play the final moments — some let Albany and Edgar's closing lines suggest exhausted restoration, others stage a stage empty of any comfort at all." },
  ];

  const klLinks: LinkSeed[] = [
    { from: "kl-ev-nothing", to: "kl-theme-authority", relation: "supports", explanation: "Lear's demand for spoken love is the first sign that his sense of authority depends on performance, not just birthright." },
    { from: "kl-ev-flies", to: "kl-theme-sight", relation: "develops", explanation: "Gloucester reaches this bleak conclusion about the gods only after losing his physical sight." },
    { from: "kl-context-sources", to: "kl-interp-bleak", relation: "provides_context_for", explanation: "Knowing Shakespeare changed his source material's happier ending sharpens the question of why he chose this bleaker one." },
    { from: "kl-char-fool", to: "kl-interp-authority-performance", relation: "supports", explanation: "The Fool is one of the few figures who keeps telling Lear the truth after his authority has emptied out." },
  ];

    lear.push(
    { key: "kl-rw-perf", kind: "section", title: "Earliest recorded performance", locationRef: "c.1606", orderIndex: 1000, dateInWorld: "c.1606", isRealWorldEvent: true, needsVerification: true, summary: "Recorded as performed at court before James I. Check the exact date and occasion before citing it.", significance: "A play about dividing a kingdom, performed for the king who had recently united two crowns." },
    { key: "kl-rw-texts", kind: "section", title: "Quarto and Folio texts", locationRef: "1608 / 1623", orderIndex: 1001, dateInWorld: "1608, 1623", isRealWorldEvent: true, needsVerification: true, summary: "The play survives in two substantially different versions — the 1608 Quarto and the 1623 Folio. Modern editions conflate or choose between them.", significance: "There is no single authoritative King Lear. Check which text your edition follows — it affects which lines you can quote." },
  );

  const learResult = await seedText({
    slug: "king-lear",
    title: "King Lear",
    author: "William Shakespeare",
    textType: "play",
    structureMode: "acts_scenes",
    accentKey: "lear",
    summary: "Two parallel plots — Lear and his daughters, Gloucester and his sons — run alongside each other. Use the track filter to follow one plot at a time, or see both together.",
    nodes: lear,
    cards: kl,
    links: klLinks,
  });

  // ─── BELOVED ────────────────────────────────────────────────────────────
  const beloved: NodeSeed[] = [
    { key: "part1-open", kind: "movement", title: "124 is haunted", locationRef: "Part One, opening", orderIndex: 1, characters: ["bel-char-sethe", "bel-char-denver", "bel-char-paul-d"], chronologyOrderIndex: 4, chronologyLabel: "The novel's narrative present, 1873", summary: "Sethe and Denver live in an isolated, ghost-plagued house; Paul D arrives after eighteen years and drives the ghost out.", significance: "The haunting is presented as an ordinary fact of the household before the novel explains its cause." },
    { key: "sweet-home", kind: "movement", title: "Sweet Home remembered", locationRef: "Part One, recalled throughout", orderIndex: 2, characters: ["bel-char-sethe", "bel-char-paul-d"], chronologyOrderIndex: 1, chronologyLabel: "Before 1855 — exact span uncertain, told only through fragments of memory", summary: "Through rememory, Sethe and Paul D recall enslaved life at Sweet Home, first under the Garners and then under the brutal \"schoolteacher\".", significance: "Morrison withholds the worst of what happened at Sweet Home until far into the novel, controlling how and when the reader can bear it." },
    { key: "escape", kind: "movement", title: "The escape", locationRef: "Part One, recalled", orderIndex: 3, characters: ["bel-char-sethe", "bel-char-denver"], chronologyOrderIndex: 2, chronologyLabel: "1855, before the event at the heart of the novel", summary: "Pregnant and alone, Sethe escapes Sweet Home, is helped by a young white woman, Amy Denver, and gives birth on the way.", significance: "Denver is literally named for the act of a stranger's unexpected kindness during the escape." },
    { key: "the-event", kind: "movement", title: "Schoolteacher arrives at 124", locationRef: "Part One / Part Two, revealed gradually", orderIndex: 4, characters: ["bel-char-sethe", "bel-char-denver"], chronologyOrderIndex: 3, chronologyLabel: "1855, weeks after the escape", summary: "When schoolteacher comes to reclaim Sethe and her children under the law, Sethe attempts to kill all of them rather than see them returned to slavery; only her eldest daughter dies.", significance: "The novel approaches this event obliquely for a long time — the structure itself enacts the difficulty of telling it." },
    { key: "beloved-arrives", kind: "movement", title: "Beloved arrives", locationRef: "Part One", orderIndex: 5, characters: ["bel-char-sethe", "bel-char-denver", "bel-char-paul-d", "bel-char-beloved"], chronologyOrderIndex: 5, chronologyLabel: "Shortly after Paul D's arrival, 1873", summary: "A young woman calling herself Beloved appears at 124; she is gradually understood, or interpreted, as the dead daughter returned.", significance: "The novel never fully confirms whether Beloved is a ghost, a traumatised survivor, or something the household needs her to be." },
    { key: "paul-d-learns", kind: "movement", title: "Paul D learns the truth", locationRef: "Part Two", orderIndex: 6, characters: ["bel-char-paul-d", "bel-char-sethe"], chronologyOrderIndex: 6, chronologyLabel: "1873", summary: "Stamp Paid tells Paul D what Sethe did; Paul D leaves 124.", significance: "Knowledge of the past event breaks the fragile present-day household apart." },
    { key: "consumed", kind: "movement", title: "Sethe consumed by Beloved", locationRef: "Part Three", orderIndex: 7, characters: ["bel-char-sethe", "bel-char-denver", "bel-char-beloved"], chronologyOrderIndex: 7, chronologyLabel: "1873", summary: "Sethe becomes absorbed in trying to explain herself to Beloved, neglecting herself; Denver reaches out to the wider community for help.", significance: "Denver's turn outward reverses the household's earlier isolation." },
    { key: "exorcism", kind: "movement", title: "The community intervenes", locationRef: "Part Three", orderIndex: 8, characters: ["bel-char-sethe", "bel-char-denver", "bel-char-beloved"], chronologyOrderIndex: 8, chronologyLabel: "1873", summary: "A group of local women comes to 124 and Beloved disappears.", significance: "What individual memory and guilt could not resolve, collective action addresses instead." },
    { key: "not-a-story", kind: "movement", title: "\"This is not a story to pass on\"", locationRef: "Part Three, closing", orderIndex: 9, characters: ["bel-char-sethe", "bel-char-denver", "bel-char-paul-d"], chronologyOrderIndex: 9, chronologyLabel: "After 1873", summary: "The novel closes reflecting on memory, forgetting, and how a story like this can and can't be told.", significance: "The ending questions its own act of narration rather than offering simple closure." },
  ];

  const bel: CardSeed[] = [
    { key: "bel-ev-124", type: "evidence", title: "\"124 was spiteful\"", structureNodeKey: "part1-open", locationRef: "Part One, opening line", quoteText: "124 was spiteful.", quoteVerified: true, speakerOrNarrator: "Third-person narration", provenance: "app_written", confidence: "solid", tags: ["haunting", "opening"], studentExplanation: "The novel opens mid-thought, treating the house's malevolence as already established fact. Note how the number \"124\" is used almost as the house's name throughout." },
    { key: "bel-ev-rememory", type: "evidence", title: "Sethe's idea of \"rememory\"", structureNodeKey: "sweet-home", locationRef: "Part One", provenance: "app_written", confidence: "needs_checking", tags: ["memory", "rememory"], studentExplanation: "Sethe describes memories as places that still exist and can be walked back into by someone else, even a stranger. Find the exact passage in your copy and add the quotation here — then consider what it implies about whether the past is ever truly \"over\"." },
    { key: "bel-ev-schoolteacher", type: "evidence", title: "Schoolteacher's \"categories\"", structureNodeKey: "sweet-home", locationRef: "Part One", provenance: "app_written", confidence: "needs_checking", tags: ["dehumanisation"], studentExplanation: "Schoolteacher has his nephews record Sethe's \"animal\" and \"human\" characteristics in two columns. Add the exact passage, then consider how this scene of being catalogued shapes Sethe's later, extreme choice." },
    { key: "bel-theme-rememory", type: "theme", title: "Memory and \"rememory\"", provenance: "app_written", confidence: "solid", tags: ["memory"], studentExplanation: "Morrison's invented term \"rememory\" treats the past as something that can resurface involuntarily, or even be encountered by someone who wasn't there. Track where the novel's structure itself performs this rather than just describing it." },
    { key: "bel-theme-motherhood", type: "theme", title: "Motherhood under slavery", provenance: "app_written", confidence: "solid", tags: ["motherhood"], studentExplanation: "Sethe's love for her children is presented as fierce almost to the point of destructiveness. Consider how the novel asks you to judge (or refuse to judge) a mother's choice made under conditions no reader has faced." },
    { key: "bel-theme-community", type: "theme", title: "Community: failure and repair", provenance: "app_written", confidence: "solid", tags: ["community"], studentExplanation: "The community fails to warn Sethe before schoolteacher's arrival, then later returns to help drive Beloved out. Track what changes between these two moments." },
    { key: "bel-theme-naming", type: "theme", title: "Naming and identity", provenance: "app_written", confidence: "solid", tags: ["naming"], studentExplanation: "Beloved's name comes from the single word Sethe could afford to have carved on a gravestone. Consider what it means that a name bought in exchange for something else becomes the identity a lost child returns under." },
    { key: "bel-method-withholding", type: "method", title: "Circling and withholding the centre", provenance: "app_written", confidence: "solid", tags: ["structure", "form", "trauma"], studentExplanation: "The novel approaches the killing obliquely for a long time, returning to it and veering away before finally telling it. The gap between when the event happens (1855) and when the reader is finally told is itself the method — the delay enacts how hard the thing is to say." },
    { key: "bel-method-polyvocal", type: "method", title: "Shifting voices and unattributed narration", provenance: "app_written", confidence: "needs_checking", tags: ["form", "narration", "voice"], studentExplanation: "Narration moves between third person and interior voices, and in Part Two into passages where attribution dissolves entirely. Find one such passage in your copy and ask what's gained by not knowing for certain who is speaking." },
    { key: "bel-char-sethe", type: "character", title: "Sethe", provenance: "app_written", confidence: "solid", tags: ["sethe"] },
    { key: "bel-char-denver", type: "character", title: "Denver", provenance: "app_written", confidence: "solid", tags: ["denver"], studentExplanation: "Denver is the only character born free, yet grows up isolated by her mother's past. Her decision to leave 124 for help marks the novel's turn toward resolution." },
    { key: "bel-char-paul-d", type: "character", title: "Paul D", provenance: "app_written", confidence: "solid", tags: ["paul-d"] },
    { key: "bel-char-beloved", type: "character", title: "Beloved", provenance: "app_written", confidence: "tentative", tags: ["beloved", "ambiguity"], studentExplanation: "The novel never settles whether Beloved is a ghost made flesh, a traumatised survivor of the Middle Passage, or something the household's grief and guilt have shaped her into being. Treat this ambiguity as the point, not a puzzle with one answer." },
    { key: "bel-context-fugitive-act", type: "context", title: "The Fugitive Slave Act, 1850", sourceNote: "Federal U.S. law requiring escaped enslaved people to be returned to enslavers even from free states.", provenance: "app_written", confidence: "solid", tags: ["history", "law"], studentExplanation: "This law is why schoolteacher has legal grounds to come for Sethe in a nominally free state — it's the mechanism that makes the novel's central crisis possible at all." },
    { key: "bel-context-margaret-garner", type: "context", title: "Margaret Garner", sourceNote: "Morrison has spoken about the real 1856 case of Margaret Garner as an inspiration for the novel — verify specific details before citing.", provenance: "app_written", confidence: "needs_checking", tags: ["history", "source"], studentExplanation: "Beloved is loosely inspired by a real historical case of an enslaved woman who killed her child rather than see her returned to slavery. The novel is not a retelling of the facts of that case — check what Morrison herself has said about the relationship between the two before treating them as equivalent." },
    { key: "bel-interp-structure-trauma", type: "interpretation", title: "The fragmented structure enacts trauma", provenance: "app_written", confidence: "tentative", tags: ["structure", "trauma"], studentExplanation: "Test this claim: \"the novel's refusal to tell events in order isn't just style — it performs the way traumatic memory actually resists being told as a straight line.\" Find two structural moments that support this." },
    { key: "bel-perf-morrison-intent", type: "performance", title: "Morrison on \"unspeakable things unspoken\"", sourceNote: "Morrison has discussed the difficulty of narrating slavery directly in interviews and essays — verify the specific source before citing it.", provenance: "app_written", confidence: "needs_checking", tags: ["author-intention"], studentExplanation: "Morrison has spoken about deliberately withholding and circling the novel's central act rather than narrating it directly. Consider how that authorial choice shapes your reading of the novel's structure." },
  ];

  const belLinks: LinkSeed[] = [
    { from: "bel-ev-124", to: "bel-theme-rememory", relation: "foreshadows", explanation: "The house's haunting, stated as fact from the first line, is the earliest sign the past won't stay in the past." },
    { from: "bel-context-fugitive-act", to: "bel-char-sethe", relation: "provides_context_for", explanation: "Without this law, schoolteacher would have no legal claim once Sethe crossed into a free state — it creates the trap she's caught in." },
    { from: "bel-char-beloved", to: "bel-interp-structure-trauma", relation: "supports", explanation: "Beloved's unresolved identity mirrors the novel's refusal to resolve its own timeline into one clear sequence." },
  ];

    beloved.push(
    { key: "bel-rw-pub", kind: "section", title: "Beloved published", locationRef: "1987", orderIndex: 1000, dateInWorld: "1987", isRealWorldEvent: true, summary: "Published more than a century after the events it describes.", significance: "The novel is a late-twentieth-century act of recovery, not a contemporary account — that distance is part of its argument about memory." },
    { key: "bel-rw-pulitzer", kind: "section", title: "Pulitzer Prize for Fiction", locationRef: "1988", orderIndex: 1001, dateInWorld: "1988", isRealWorldEvent: true, needsVerification: true, summary: "Awarded the Pulitzer Prize for Fiction. Verify the year before citing it.", significance: "Useful for reception context — how the novel was received and canonised." },
  );

  const belovedResult = await seedText({
    slug: "beloved",
    title: "Beloved",
    author: "Toni Morrison",
    textType: "novel",
    structureMode: "narration_vs_chronology",
    accentKey: "beloved",
    summary: "Told from a fixed present (1873) that the past keeps interrupting. Use the chronology view to see what's placed in time (even loosely) versus what stays deliberately uncertain — that uncertainty is part of the novel's method, not a gap to fill in.",
    nodes: beloved,
    cards: bel,
    links: belLinks,
  });

  // ─── JERUSALEM ──────────────────────────────────────────────────────────
  // Beat-level structure. The act divisions and the broad sequence are solid;
  // the individual beats are this seed's reading of the play's shape and are
  // flagged for verification against her own text — she can rename, reorder,
  // split or delete any of them from the Overview tab.
  const jerusalem: NodeSeed[] = [
    { key: "j-prologue", kind: "section", title: "Prologue: the fairy sings", locationRef: "Before Act 1", orderIndex: 1, needsVerification: true, summary: "A short curtain-raiser before the main action, setting an older, more mythic England against what follows.", significance: "Frames the whole play as standing between folk myth and the contemporary world." },
    { key: "j-morning", kind: "scene", title: "Morning after the party", locationRef: "Act 1", orderIndex: 2, needsVerification: true, characters: ["jer-char-rooster", "jer-char-ginger"], summary: "The aftermath of the previous night's rave outside Rooster's mobile home; the wreckage of the party and Rooster's morning routine.", significance: "Establishes the clearing as a place apart, and Rooster as its presiding figure." },
    { key: "j-notice", kind: "scene", title: "The eviction notice", locationRef: "Act 1", orderIndex: 3, needsVerification: true, characters: ["jer-char-rooster"], summary: "Council officers serve notice that Rooster is to be evicted from the woodland.", significance: "Starts the clock running over the whole play — everything after happens under this threat." },
    { key: "j-crew", kind: "scene", title: "The crew gathers", locationRef: "Act 1", orderIndex: 4, needsVerification: true, characters: ["jer-char-rooster", "jer-char-ginger"], summary: "Davey, Lee, Pea and Tanya drift in and out of the clearing; Lee is about to leave for Australia.", significance: "Shows what the clearing provides for the young people who use it — and how provisional their loyalty is." },
    { key: "j-phaedra", kind: "scene", title: "Phaedra revealed", locationRef: "Act 1", orderIndex: 5, needsVerification: true, characters: ["jer-char-rooster", "jer-char-phaedra"], summary: "Phaedra, the missing May Queen the village is searching for, turns out to be sheltering at Rooster's.", significance: "The play's central moral ambiguity — is Rooster protecting her or endangering her?" },
    { key: "j-wesley", kind: "scene", title: "Wesley and the new England", locationRef: "Act 2", orderIndex: 6, needsVerification: true, characters: ["jer-char-rooster", "jer-char-ginger"], summary: "The publican Wesley appears, made to perform folk tradition as corporate theming by the pub's new owners.", significance: "A sharp contrast: folk custom as commodity versus Rooster's lived (if unreliable) version of it." },
    { key: "j-professor", kind: "scene", title: "The Professor", locationRef: "Act 2", orderIndex: 7, needsVerification: true, characters: ["jer-char-rooster", "jer-char-professor"], summary: "The Professor, an unmoored academic figure, drifts through the clearing and is absorbed into the group.", significance: "Widens the clearing's role as refuge for people modern England has no place for." },
    { key: "j-giant", kind: "scene", title: "Rooster's giant story", locationRef: "Act 2", orderIndex: 8, needsVerification: true, characters: ["jer-char-rooster"], summary: "Rooster tells his tall tale of meeting a giant connected to Stonehenge.", significance: "The play's clearest test case for whether myth-making is resistance or self-deception." },
    { key: "j-troy", kind: "scene", title: "Troy Whitworth arrives", locationRef: "Act 2–3", orderIndex: 9, needsVerification: true, characters: ["jer-char-rooster"], summary: "Phaedra's stepfather comes looking for her, and the threat to Rooster stops being bureaucratic and becomes personal.", significance: "The eviction plot and the Phaedra plot collide here." },
    { key: "j-beating", kind: "scene", title: "The beating", locationRef: "Act 3", orderIndex: 10, needsVerification: true, characters: ["jer-char-rooster"], summary: "Rooster is confronted and violently beaten.", significance: "Strips away the mythic protection Rooster's stories seemed to offer him." },
    { key: "j-abandonment", kind: "scene", title: "The crew peel away", locationRef: "Act 3", orderIndex: 11, needsVerification: true, characters: ["jer-char-rooster", "jer-char-ginger"], summary: "One by one the people who idolised Rooster leave him to it.", significance: "Track who is still onstage here against Act 1 — the emptying stage is the argument." },
    { key: "j-drumming", kind: "scene", title: "The final drumming", locationRef: "Act 3, closing", orderIndex: 12, needsVerification: true, characters: ["jer-char-rooster"], summary: "Alone, Rooster beats the drum and calls on his ancestors and the giants of England.", significance: "Deliberately unresolved: the play refuses to confirm whether anything answers." },
  ];

  const jer: CardSeed[] = [
    { key: "jer-ev-eviction", type: "evidence", title: "The eviction notice scene", structureNodeKey: "j-notice", locationRef: "Act 1", provenance: "app_written", confidence: "needs_checking", tags: ["eviction", "bureaucracy", "power"], studentExplanation: "Add the exact exchange between Rooster and the council officials once you have your text to hand. Consider how the scene's comedy sits alongside the real threat the notice represents." },
    { key: "jer-ev-giant-story", type: "evidence", title: "Rooster's giant story", structureNodeKey: "j-giant", locationRef: "Act 2", provenance: "app_written", confidence: "needs_checking", tags: ["myth", "storytelling"], studentExplanation: "Rooster tells a tall tale about meeting a giant connected to Stonehenge. Add the exact lines, then consider: does the play want you to believe Rooster, disbelieve him, or hold both at once?" },
    { key: "jer-ev-drumming", type: "evidence", title: "The final drumming", structureNodeKey: "j-drumming", locationRef: "Act 3, closing", provenance: "app_written", confidence: "needs_checking", tags: ["ending", "myth"], studentExplanation: "Add the exact stage directions and any lines for the play's final moment once you have them. The ambiguity of whether anything answers Rooster's summons is central — don't resolve it in your notes before deciding it's worth arguing about." },
    { key: "jer-method-tall-tale", type: "method", title: "The tall tale as dramatic method", provenance: "app_written", confidence: "solid", tags: ["myth", "storytelling", "form"], studentExplanation: "Butterworth repeatedly stops the naturalistic action so Rooster can tell a story that can't be literally true. Ask what the *form* does: the audience is put in the same position as the characters — enjoying it while knowing better." },
    { key: "jer-method-single-setting", type: "method", title: "One clearing, one day", provenance: "app_written", confidence: "solid", tags: ["structure", "form", "unity"], studentExplanation: "The play holds to a single location across roughly a day and a night. Nothing is shown of the estate, the pub or the village — they only ever arrive as intrusions. Consider what that structural confinement does to the sense of a world closing in." },
    { key: "jer-theme-englishness", type: "theme", title: "Myth vs official England", provenance: "app_written", confidence: "solid", tags: ["myth", "englishness"], studentExplanation: "Rooster's tall tales and ancestral claims sit against council paperwork, planning permission and a new housing estate. Track where the play makes myth look like resistance, and where it looks like self-deception." },
    { key: "jer-theme-freedom", type: "theme", title: "Freedom and enclosure", provenance: "app_written", confidence: "solid", tags: ["freedom"], studentExplanation: "The literal enclosure of Rooster's woodland for development mirrors a wider question about whether his kind of freedom can survive contact with the modern world at all." },
    { key: "jer-theme-fatherhood", type: "theme", title: "Fatherhood and responsibility", provenance: "app_written", confidence: "solid", tags: ["fatherhood", "marky"], studentExplanation: "Rooster is a mythic outlaw hero to the local teenagers but an unreliable, largely absent father to his own son, Marky. Track how the play holds both versions of Rooster open at once." },
    { key: "jer-char-rooster", type: "character", title: "Johnny \"Rooster\" Byron", provenance: "app_written", confidence: "solid", tags: ["rooster"], studentExplanation: "Rooster is presented simultaneously as mythic hero, drug-supplying outlaw, storyteller and neglectful father. Resist flattening him into just one of these." },
    { key: "jer-char-ginger", type: "character", title: "Ginger", provenance: "app_written", confidence: "solid", tags: ["ginger"], studentExplanation: "Ginger idolises Rooster and clearly wants to be part of his world, while also being kept slightly at arm's length by him — one of several characters who need Rooster to be more than he can actually be." },
    { key: "jer-char-phaedra", type: "character", title: "Phaedra", provenance: "app_written", confidence: "needs_checking", tags: ["phaedra", "may-queen"], studentExplanation: "The missing May Queen sheltering at Rooster's. Check her scenes against your text: where she appears, and how little she says compared with everyone around her, is worth arguing about." },
    { key: "jer-char-professor", type: "character", title: "The Professor", provenance: "app_written", confidence: "needs_checking", tags: ["professor"], studentExplanation: "An unmoored academic figure absorbed into the clearing's company. Verify his scenes against your text, then consider what he adds to the play's picture of people modern England has no use for." },
    { key: "jer-context-st-george", type: "context", title: "St George's Day setting", provenance: "app_written", confidence: "solid", tags: ["setting", "myth"], studentExplanation: "The play is set on St George's Day, England's patron saint's day — a choice that frames Rooster's story explicitly against ideas of English identity and myth-making." },
    { key: "jer-context-rylance", type: "context", title: "Original 2009 production", sourceNote: "Jerusalem premiered at the Royal Court in 2009 with Mark Rylance as Rooster Byron, later transferring to the West End and Broadway.", provenance: "app_written", confidence: "solid", tags: ["performance-history"] },
    { key: "jer-interp-hero-and-danger", type: "interpretation", title: "Rooster is both hero and danger", provenance: "app_written", confidence: "tentative", tags: ["ambiguity"], studentExplanation: "Test this claim: \"the play refuses to let the audience settle on Rooster as either purely a mythic hero or purely a dangerous, irresponsible man.\" Find one moment supporting each reading." },
    { key: "jer-comparison-outsiders", type: "comparison", title: "Threatened outsiders: Rooster and Dracula", provenance: "app_written", confidence: "tentative", tags: ["exploratory", "not-a-confirmed-pairing"], textIds: ["dracula"], studentExplanation: "Exploratory only — this is not a confirmed exam pairing. Both Rooster and Dracula are outsider figures whose claim to a place is challenged by an organised, official force (the council; the vampire hunters). Consider how differently the two texts want you to feel about that challenge." },
  ];

  const jerLinks: LinkSeed[] = [
    { from: "jer-ev-giant-story", to: "jer-theme-englishness", relation: "supports", explanation: "Rooster's tall tale is one of the clearest places the play stages myth-making as both entertainment and a claim about belonging." },
    { from: "jer-char-rooster", to: "jer-interp-hero-and-danger", relation: "supports", explanation: "Rooster's treatment of Marky and of the teenagers who depend on him are the clearest test cases for this claim." },
  ];

    jerusalem.push(
    { key: "jer-rw-premiere", kind: "section", title: "Premiere at the Royal Court", locationRef: "2009", orderIndex: 1000, dateInWorld: "2009", isRealWorldEvent: true, summary: "Jerusalem premieres with Mark Rylance as Rooster Byron, later transferring to the West End and Broadway.", significance: "Rylance's performance shaped how the part is understood — worth separating what's in the script from what one actor made of it." },
  );

  await seedText({
    slug: "jerusalem",
    title: "Jerusalem",
    author: "Jez Butterworth",
    textType: "play",
    structureMode: "acts_scenes",
    accentKey: "jerusalem",
    summary: "A contemporary play, still in copyright — quotations here are left for you to add from your own copy rather than reproduced by the app. Structured as three acts in one continuous setting, across roughly a day and a night.",
    nodes: jerusalem,
    cards: jer,
    links: jerLinks,
  });

  console.log("Seeded texts:", ["dracula", "king-lear", "beloved", "jerusalem"].join(", "));
  console.log(`Dracula: ${draculaResult.cardIdByKey.size} cards, ${draculaResult.nodeIdByKey.size} structure nodes`);
  console.log(`King Lear: ${learResult.cardIdByKey.size} cards, ${learResult.nodeIdByKey.size} structure nodes`);
  console.log(`Beloved: ${belovedResult.cardIdByKey.size} cards, ${belovedResult.nodeIdByKey.size} structure nodes`);
}

main()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
