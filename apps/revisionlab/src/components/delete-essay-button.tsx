"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEssay } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteEssayButton({
  essayId,
  laterRevisions,
}: {
  essayId: string;
  /** Attempts made after this one in the same revision chain — kept, not deleted. */
  laterRevisions: number;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const message =
    laterRevisions > 0
      ? `Delete this attempt and its feedback? Your ${laterRevisions} later revision${
          laterRevisions === 1 ? " is" : "s are"
        } kept. This can't be undone.`
      : "Delete this essay and its feedback? This can't be undone.";

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(message)) return;
        startTransition(async () => {
          await deleteEssay(essayId);
          router.push("/essays");
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" /> {pending ? "Deleting…" : "Delete essay"}
    </Button>
  );
}
