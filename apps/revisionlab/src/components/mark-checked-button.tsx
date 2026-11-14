"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCard } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function MarkCheckedButton({ cardId }: { cardId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await updateCard(cardId, { confidence: "solid", editSummary: "Marked as checked from the needs-checking list" });
          router.refresh();
        })
      }
    >
      <CheckCircle2 className="size-4" /> Mark as checked
    </Button>
  );
}
