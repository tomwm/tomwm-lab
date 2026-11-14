import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getTextBySlug,
  getStructureNodes,
  getCardsForText,
  getCardLinksForText,
  getCharacterCards,
  getCharacterPresence,
  getCardNodeBindings,
} from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StructureView } from "@/components/structure-view";
import { hasViewToggle } from "@/lib/structure-mode";
import { PresenceGrid } from "@/components/presence-grid";
import { AoCoverage } from "@/components/ao-coverage";
import { CardFilterGrid } from "@/components/card-filter-grid";
import { ConnectionsView } from "@/components/connections-view";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ACCENT_COLORS } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function TextPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const text = await getTextBySlug(slug);
  if (!text) notFound();

  const [nodes, allCards, links, characterCards, presence, bindings] = await Promise.all([
    getStructureNodes(text.id),
    getCardsForText(text.id),
    getCardLinksForText(text.id),
    getCharacterCards(text.id),
    getCharacterPresence(text.id),
    getCardNodeBindings(text.id),
  ]);

  // How many cards each section carries — sections with none are gaps in her
  // notes, which is the more useful signal than raw density.
  const cardCounts: Record<string, number> = {};
  for (const b of bindings) cardCounts[b.nodeId] = (cardCounts[b.nodeId] ?? 0) + 1;

  const comparisonCards = allCards.filter((c) => c.type === "comparison");
  // The brief asks for these to be kept apart: what happens inside the fiction
  // vs. when the thing was published, performed or received.
  const inWorldNodes = nodes.filter((n) => !n.isRealWorldEvent);
  const realWorldNodes = nodes.filter((n) => n.isRealWorldEvent);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="size-3 rounded-full" style={{ background: ACCENT_COLORS[text.accentKey] }} />
            <h1 className="font-serif text-2xl font-semibold text-foreground">{text.title}</h1>
          </div>
          <p className="text-sm text-foreground-muted">{text.author}</p>
        </div>
        <div className="flex items-center gap-2">
          {text.assessmentComponent ? (
            <Badge className="bg-success-bg text-success border-success/30 border">
              {text.assessmentComponent === "exam" ? "Exam text" : "Coursework"}
            </Badge>
          ) : (
            <Link
              href="/settings"
              title="OCR splits the qualification into assessment components — exam papers and coursework. Which one this text belongs to isn't confirmed for 2028, so it's left unset rather than guessed. Click to set it."
              className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning hover:border-warning"
            >
              Exam or coursework? Not set
            </Link>
          )}
          <Link href={`/texts/${slug}/cards/new`} className={buttonVariants({ size: "sm" })}>
            <Plus className="size-4" /> New card
          </Link>
        </div>
      </div>

      {text.summary && <p className="text-sm text-foreground-muted max-w-3xl">{text.summary}</p>}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="evidence">Evidence &amp; methods</TabsTrigger>
          <TabsTrigger value="themes">Themes &amp; characters</TabsTrigger>
          <TabsTrigger value="context">Context &amp; interpretations</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TabIntro>
            The structure of {text.title}, with how many cards you&rsquo;ve linked to each section. Sections marked
            &ldquo;no cards&rdquo; are gaps. Edit, add or delete sections freely — it&rsquo;s a starting point, not a fixed list.
          </TabIntro>
          <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-start">
            <div className="space-y-6">
              <StructureView textId={text.id} textSlug={slug} structureMode={text.structureMode} nodes={inWorldNodes} cardCounts={cardCounts} />

              {realWorldNodes.length > 0 && (
                <div className="border-t border-border pt-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Publication &amp; performance history</h3>
                  <p className="text-xs text-foreground-muted mb-3">
                    Real-world events, deliberately kept out of the story&rsquo;s own timeline above.
                  </p>
                  <div className="space-y-2">
                    {realWorldNodes.map((n) => (
                      <div key={n.id} className="rounded-lg border border-border bg-surface-muted/40 p-3">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-xs font-semibold text-foreground-muted">{n.locationRef}</span>
                          <h4 className="font-serif font-semibold text-sm text-foreground">{n.title}</h4>
                          {n.needsVerification && (
                            <span className="text-[11px] text-warning">check this</span>
                          )}
                        </div>
                        {n.summary && <p className="text-sm text-foreground mt-1">{n.summary}</p>}
                        {n.significance && <p className="text-sm text-foreground-muted mt-1 italic">{n.significance}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Toggle row is h-8 + mb-4 = 3rem; offset by the same so the panel
                starts level with the first section, not with the toggles. */}
            <div className={hasViewToggle(text.structureMode, inWorldNodes) ? "lg:mt-12" : undefined}>
              <AoCoverage cards={allCards} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <TabIntro>
            Who appears where. Rows that stop, start late, or never overlap are structural arguments waiting to be made —
            the Fool vanishing after Act 3, or Dracula&rsquo;s long absence from the middle of his own novel.
          </TabIntro>
          <PresenceGrid
            nodes={inWorldNodes}
            characters={characterCards}
            presence={presence}
            supportsChronology={text.structureMode === "narration_vs_chronology"}
          />
        </TabsContent>

        <TabsContent value="evidence">
          <TabIntro>
            Evidence and writer&rsquo;s methods — the AO2 material. Evidence is what the text says; method is how it&rsquo;s built.
          </TabIntro>
          <CardFilterGrid cards={allCards} types={["evidence", "method"]} textSlug={slug} />
        </TabsContent>

        <TabsContent value="themes">
          <TabIntro>The bigger patterns running across the whole text.</TabIntro>
          <CardFilterGrid cards={allCards} types={["theme", "character"]} textSlug={slug} />
        </TabsContent>

        <TabsContent value="context">
          <TabIntro>Background information, debatable readings, and critical or performance perspectives.</TabIntro>
          <CardFilterGrid cards={allCards} types={["context", "interpretation", "performance"]} textSlug={slug} />
        </TabsContent>

        <TabsContent value="connections">
          <TabIntro>
            How your ideas about {text.title} hang together — and which ones are still floating free.
          </TabIntro>
          <div className="space-y-6">
            {comparisonCards.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Comparisons with other texts</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {comparisonCards.map((c) => (
                    <Link
                      key={c.id}
                      href={`/texts/${slug}/cards/${c.id}`}
                      className="block rounded-lg border border-border bg-surface p-3 hover:border-primary/40"
                    >
                      <p className="font-serif font-semibold text-sm">{c.title}</p>
                      {c.studentExplanation && <p className="text-sm text-foreground-muted line-clamp-2 mt-1">{c.studentExplanation}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <ConnectionsView
              cards={allCards.map((c) => ({ id: c.id, title: c.title, type: c.type }))}
              connections={links.map(({ link, from, to }) => ({
                id: link.id,
                relation: link.relation,
                explanation: link.explanation,
                fromId: from.id,
                fromTitle: from.title,
                toId: to.id,
                toTitle: to.title,
              }))}
              textSlug={slug}
            />
          </div>
        </TabsContent>

        <TabsContent value="practice">
          <TabIntro>Retrieval practice generated from this text&rsquo;s cards.</TabIntro>
          <div className="text-center py-10">
            <p className="text-sm text-foreground-muted mb-3">Practice for {text.title} lives in the main practice queue, filtered to this text.</p>
            <Link href={`/practice?text=${slug}`} className={buttonVariants()}>
              Practice {text.title}
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabIntro({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground-muted mb-4 max-w-2xl">{children}</p>;
}
