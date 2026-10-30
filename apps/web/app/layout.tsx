import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Kasauti — Voice Agent Quality & Compliance Testing in India",
  description: "Test it like gold before you dial. Benchmark your voice agents against TRAI-style rules, regional languages (Hindi, Hinglish, Kannada, Indian English), and auto-patch prompts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-white selection:text-black">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-900 py-6 text-center text-xs font-mono text-zinc-500">
          <p>
            Kasauti &copy; {new Date().getFullYear()} &bull; Test it like gold before you dial.
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            Testing simulation tool for Indian Telecommunications. Not formal legal advice.
          </p>
        </footer>
      </body>
    </html>
  );
}
