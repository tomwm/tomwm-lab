import { getTexts, getTextDeletionImpact } from "@/lib/queries";
import { getAiProvider } from "@/lib/ai/provider";
import { TextComponentPicker } from "@/components/text-component-picker";
import { AddTextForm } from "@/components/add-text-form";
import { DeleteTextButton } from "@/components/delete-text-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, XCircle } from "lucide-react";

export default async function SettingsPage() {
  const texts = await getTexts();
  const provider = getAiProvider();
  const impacts = await Promise.all(texts.map((t) => getTextDeletionImpact(t.id)));

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-foreground-muted">Course configuration, AI marking status, and backups.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground-muted">
            Provisional qualification: <strong>OCR English Literature H472</strong> (exams expected summer 2028). The full text
            list, poetry selections and comparative topic have not been confirmed by OCR yet — verify against the live
            specification before treating any assignment below as final.
          </p>
          {texts.map((t, i) => (
            <div key={t.id} className="py-2 border-t border-border first:border-t-0 first:pt-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-sm">{t.title}</span>
                <div className="flex items-center gap-3">
                  <TextComponentPicker textId={t.id} value={t.assessmentComponent} note={t.assessmentComponentNote} />
                  <DeleteTextButton textId={t.id} title={t.title} impact={impacts[i]} />
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-border">
            <AddTextForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI marking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm flex items-center gap-2">
            {provider.configured ? (
              <>
                <CheckCircle2 className="size-4 text-success" /> Configured — using {provider.modelName}
              </>
            ) : (
              <>
                <XCircle className="size-4 text-warning" /> Not configured — essay feedback will be clearly labelled as demonstration only
              </>
            )}
          </p>
          <p className="text-xs text-foreground-muted">
            Set <code className="bg-surface-muted px-1 rounded">ANTHROPIC_API_KEY</code> (or <code className="bg-surface-muted px-1 rounded">OPENAI_API_KEY</code> with{" "}
            <code className="bg-surface-muted px-1 rounded">AI_PROVIDER=openai</code>) as an environment variable on the server. Keys are never sent to the browser.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-muted mb-3">Download everything — texts, cards, connections, essays and feedback — as a single JSON file.</p>
          {/* Plain <a> so the browser downloads rather than client-navigating —
              which also means basePath isn't added for us. */}
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/export`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Download className="size-4" /> Download backup
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
