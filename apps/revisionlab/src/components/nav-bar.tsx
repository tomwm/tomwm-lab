"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, LayoutGrid, PenLine, RotateCcw, Settings, HelpCircle } from "lucide-react";

// Threads (/tags) is deliberately not here: it's occasional discovery, not part
// of the daily read → card → retrieve → write loop. It's reached by clicking a
// tag on a card, where the thought actually occurs.
const links = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/practice", label: "Practice", icon: RotateCcw },
  { href: "/essays", label: "Essays", icon: PenLine },
  { href: "/about", label: "Guide", icon: HelpCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif font-semibold text-foreground shrink-0">
          <BookOpen className="size-5 text-primary" />
          RevisionLab
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap",
                  active ? "bg-surface-muted text-foreground" : "text-foreground-muted hover:bg-surface-muted"
                )}
              >
                <l.icon className="size-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
