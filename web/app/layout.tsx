import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "My-Tensor | Digital Garden",
    template: "%s | My-Tensor",
  },
  description:
    "Mon jardin numérique d'expérimentations en Machine Learning, Data Science et développement web.",
  keywords: ["machine learning", "data science", "bitcoin", "prediction", "next.js", "supabase"],
  authors: [{ name: "Yannick" }],
  openGraph: {
    title: "My-Tensor | Digital Garden",
    description: "Expérimentations ML & Data Science",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight transition-colors hover:text-accent"
            >
              <span className="text-xl">🧠</span>
              <span>My-Tensor</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/projects/btc-oracle"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                BTC Oracle
              </Link>
              <a
                href="https://github.com/yannick3575/my-tensor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        {/* Main content */}
        {children}
      </body>
    </html>
  );
}
