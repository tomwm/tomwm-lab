"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCard } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteCardButton({ cardId, textSlug }: { cardId: string; textSlug: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this card? This also removes its connections and review history.")) return;
        startTransition(async () => {
          await deleteCard(cardId);
          router.push(`/texts/${textSlug}`);
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" /> Delete card
    </Button>
  );
}
