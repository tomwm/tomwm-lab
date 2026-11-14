import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "RevisionLab",
  description: "English Literature revision workspace — OCR H472",
};

// Every page reads her own, constantly changing data. Without this, pages with
// no dynamic params (the dashboard, essays list, settings…) were prerendered at
// build time — frozen at deploy, and served as static HTML.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
