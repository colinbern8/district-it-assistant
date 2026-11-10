import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "District IT Help",
  description: "Step-by-step help for common Chromebook problems.",
};

/** Wraps every page: shared header, main content area, and privacy footer. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="bg-blue-800 text-white">
          <div className="mx-auto max-w-2xl px-4 py-4">
            <Link
              href="/"
              className="text-xl font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              District IT Help
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <p className="mx-auto max-w-2xl px-4 py-4 text-sm text-slate-600">
            This tool will never ask for your password or personal information.
          </p>
        </footer>
      </body>
    </html>
  );
}
