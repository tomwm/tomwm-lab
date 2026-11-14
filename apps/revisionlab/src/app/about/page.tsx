import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardTypeBadge } from "@/components/badges";
import { CARD_TYPES } from "@/db/schema";
import { RELATION_LABELS } from "@/lib/utils";
import { RELATIONS } from "@/db/schema";

const CARD_TYPE_BLURBS: Record<string, string> = {
  evidence: "A short exact quotation or precise reference, plus analysis of the language, form or structure around it.",
  method: "A recurring technique the writer uses — epistolary form, a double plot, withholding an event. The 'how it's built' half of AO2.",
  theme: "A recurring concern — how it develops, and where it gets complicated or contradicts itself.",
  character: "Relationships, changes, and moments of ambiguity.",
  context: "Historical, social or literary background, with a source and why it matters for a specific moment.",
  interpretation: "A debatable claim you can test with evidence — and against counter-evidence.",
  comparison: "A specific similarity or difference between two texts, backed by evidence from both.",
  performance: "A production choice or a named critical reading, and what it implies.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">How RevisionLab works</h1>
        <p className="text-sm text-foreground-muted">
          A quick guide to what everything is for. If you only read one section, read &ldquo;Where to start&rdquo; at the bottom.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>The core idea</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground">
          <p>
            Everything in a text — its scenes, your evidence, your themes, your interpretations — lives as a <strong>card</strong>.
            Cards can be linked together to say how they relate. The dashboard, the structure overview, the theme list, and
            practice are all just different <em>views</em> of that same set of connected cards — edit a card once, and it
            updates everywhere it appears.
          </p>
          <p className="text-foreground-muted">
            The aim isn&rsquo;t to build a huge web of cards. A handful of well-explained ones, properly connected, is worth
            far more than hundreds of shallow ones.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CARD_TYPES.map((t) => (
            <div key={t} className="flex items-start gap-3">
              <div className="w-40 shrink-0 pt-0.5">
                <CardTypeBadge type={t} />
              </div>
              <p className="text-sm text-foreground-muted">{CARD_TYPE_BLURBS[t]}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connecting cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground-muted">
            Open any card and add a connection to another one. Pick a relationship that says something real:
          </p>
          <div className="flex flex-wrap gap-2">
            {RELATIONS.map((r) => (
              <span key={r} className="text-xs bg-surface-muted rounded-full px-2.5 py-1">
                {RELATION_LABELS[r]}
              </span>
            ))}
          </div>
          <p className="text-foreground-muted">
            Always add a sentence in your own words explaining <em>why</em> the connection matters — that explanation is
            usually more useful for revision than the link itself.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inside a text workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Overview</strong> — the structure of the text (chapters, acts/scenes, or narrative order vs. chronology). Edit, add, verify or delete sections: the structure is a starting point, not fixed.</p>
          <p><strong>Timeline</strong> — a presence grid of who appears in which scene. Rows that stop, start late or never overlap are structural arguments waiting to be made.</p>
          <p><strong>Evidence &amp; methods</strong> — quotations and the writer&rsquo;s techniques: the close-reading material.</p>
          <p><strong>Themes &amp; characters</strong> — the bigger patterns running across the whole text.</p>
          <p><strong>Context &amp; interpretations</strong> — background information, debatable readings, and critical/performance perspectives.</p>
          <p><strong>Connections</strong> — every relationship involving this text&rsquo;s cards, including comparisons with other texts.</p>
          <p><strong>Practice</strong> — retrieval practice drawn from this text&rsquo;s cards specifically.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground-muted">
          <p>Every card generates practice prompts. There are two kinds, and they work differently — reading a card doesn&rsquo;t count as knowing it for either.</p>
          <p><strong className="text-foreground">Quotations have a right answer.</strong> Write the line out from memory. If you&rsquo;re stuck, ask for a hint — the line with a few words gapped out. If you&rsquo;re still stuck, show the answer; that counts as not recalled, so it comes back soon. Otherwise rate yourself (Didn&rsquo;t get it / Struggled / Got it / Knew it instantly — though not &ldquo;instantly&rdquo; if you used the hint).</p>
          <p><strong className="text-foreground">Everything else doesn&rsquo;t.</strong> Explaining an effect, tracing a theme, writing a thesis or paragraph — there&rsquo;s no answer key, so you have to write something before moving on, or skip it for now if there isn&rsquo;t time (a skip doesn&rsquo;t count against you; the prompt just comes back tomorrow). Afterwards you see what you wrote the last time that prompt came up, and judge whether you got further.</p>
          <p>Your rating decides when a prompt comes back — ones you struggle with return sooner, ones you know drift further out.</p>
          <p>You can step back through a session with Previous. Prompts you&rsquo;ve finished are shown read-only — you&rsquo;ve seen the answer, so a second go wouldn&rsquo;t tell you anything. Ones you skipped are still open to do.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Essays and feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground-muted">
          <p>Submit a full essay or a single paragraph with the exact question. You&rsquo;ll get strengths, priority improvements, comments anchored to your actual sentences, and — where you&rsquo;ve given marks-available — an indicative mark.</p>
          <p>The most useful part is usually <strong>&ldquo;Develop this idea further&rdquo;</strong>: it finds the one place you raised a good idea but moved on too soon, and asks a specific question about that sentence. Have a go yourself before asking for an example — you can then save your improved idea as a new card.</p>
          <p>Without an AI provider configured, feedback is clearly marked as demonstration only — never mistaken for a real assessment.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What&rsquo;s intentionally unconfirmed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground-muted">
          <p>OCR hasn&rsquo;t published the final text list, poetry selections, or exam/coursework split for the 2028 series. <Link href="/settings" className="text-primary hover:underline">Settings</Link> lets you assign each text once that&rsquo;s confirmed — until then it stays &ldquo;Unassigned&rdquo; on purpose, rather than guessing.</p>
          <p>Beloved and Jerusalem are still in copyright, so their evidence cards ship with the quotation left blank for you to fill in from your own copy, rather than risking a misquoted line. Dracula and King Lear are public domain, so their well-known quotations are pre-filled.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where to start</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-foreground">
            <li>Open a text and skim its <strong>Overview</strong> tab.</li>
            <li>Browse a few starter cards in <strong>Passages &amp; evidence</strong> or <strong>Themes &amp; characters</strong>.</li>
            <li>Add or edit a card as you read — your own explanation matters more than ours.</li>
            <li>Once you&rsquo;ve got a few cards, try <Link href="/practice" className="text-primary hover:underline">Practice</Link>.</li>
            <li>When you&rsquo;ve written something, <Link href="/essays/new" className="text-primary hover:underline">submit it</Link> for feedback.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
