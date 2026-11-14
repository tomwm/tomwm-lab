"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteText } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

export function DeleteTextButton({
  textId,
  title,
  impact,
}: {
  textId: string;
  title: string;
  impact: { cards: number; sections: number };
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Typing the title is deliberate friction: this can wipe out two years of
  // notes, and a stray click on a confirm dialog shouldn't be enough.
  const confirmed = typed.trim().toLowerCase() === title.trim().toLowerCase();

  if (!open) {
    return (
      <button
        title={`Delete ${title}`}
        onClick={() => setOpen(true)}
        className="text-foreground-muted hover:text-danger shrink-0"
      >
        <Trash2 className="size-4" />
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-danger/30 bg-danger-bg/40 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-4 text-danger shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Delete {title} permanently?</p>
          <p className="text-foreground-muted mt-0.5">
            This also deletes{" "}
            <strong className="text-foreground">
              {impact.cards} card{impact.cards === 1 ? "" : "s"}
            </strong>{" "}
            and{" "}
            <strong className="text-foreground">
              {impact.sections} section{impact.sections === 1 ? "" : "s"}
            </strong>
            , with their connections, notes and practice history. It can&rsquo;t be undone.
          </p>
          <p className="text-foreground-muted mt-1 text-xs">
            Essays you&rsquo;ve written about it are kept.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="block text-xs text-foreground-muted mb-1">
          Type <strong className="text-foreground">{title}</strong> to confirm
        </span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          placeholder={title}
        />
      </label>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={!confirmed || pending}
          onClick={() =>
            startTransition(async () => {
              await deleteText(textId);
              setOpen(false);
              setTyped("");
              router.refresh();
            })
          }
        >
          {pending ? "Deleting…" : "Delete permanently"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
