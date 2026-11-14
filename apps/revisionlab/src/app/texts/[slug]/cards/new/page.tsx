import { notFound } from "next/navigation";
import Link from "next/link";
import { getTextBySlug, getAllTags, getStructureNodes } from "@/lib/queries";
import { CardForm } from "@/components/card-form";
import { ArrowLeft } from "lucide-react";

export default async function NewCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { slug } = await params;
  const { section } = await searchParams;
  const text = await getTextBySlug(slug);
  if (!text) notFound();
  const [allTags, sectionNodes] = await Promise.all([getAllTags(), getStructureNodes(text.id)]);
  const sections = sectionNodes
    .filter((n) => !n.isRealWorldEvent)
    .map((n) => ({ id: n.id, locationRef: n.locationRef, title: n.title }));

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/texts/${slug}`} className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="size-4" /> Back to {text.title}
      </Link>
      <h1 className="font-serif text-xl font-semibold text-foreground">New card — {text.title}</h1>
      <CardForm
        textId={text.id}
        textSlug={slug}
        initial={
          // Arriving from a section page pre-binds the card to that section,
          // so "add a card here" means here.
          section && sections.some((sec) => sec.id === section)
            ? {
                type: "evidence",
                title: "",
                locationRef: "",
                quoteText: "",
                speakerOrNarrator: "",
                studentExplanation: "",
                sourceNote: "",
                confidence: "tentative",
                tags: "",
                structureNodeIds: [section],
              }
            : undefined
        }
        existingTags={allTags.map((t) => ({ tag: t.tag, count: t.count }))}
        sections={sections}
      />
    </div>
  );
}
