import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splitz — Split trip costs with friends",
  description: "No sign-up needed. Share a code, split costs fairly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-[var(--accent)]">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="var(--accent)" />
                <text x="5" y="21" fontSize="16" fill="white" fontWeight="bold">S/</text>
              </svg>
              Splitz
            </a>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
