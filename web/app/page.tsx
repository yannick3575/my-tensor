import Link from "next/link";

// Données des projets (extensible pour futurs projets)
const projects = [
  {
    slug: "btc-oracle",
    title: "BTC Oracle",
    emoji: "🔮",
    description:
      "Prédiction du cours Bitcoin à J+1 via régression linéaire. Un premier pas dans le ML appliqué à la finance.",
    tags: ["Python", "ML", "Supabase"],
    status: "live" as const,
  },
  {
    slug: null,
    title: "Coming Soon",
    emoji: "🚧",
    description:
      "Prochain projet en préparation. Peut-être du NLP, de la computer vision, ou autre chose...",
    tags: ["???"],
    status: "soon" as const,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Mon jardin numérique
            <span className="block text-accent">d&apos;expérimentations ML</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Un espace personnel pour explorer le Machine Learning, la Data
            Science et le développement web. Apprendre en construisant.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="#projects"
              className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:scale-105"
            >
              Explorer les projets
            </a>
            <a
              href="https://github.com/yannick3575/my-tensor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-8 text-sm font-medium transition-all hover:bg-muted hover:scale-105"
            >
              Voir sur GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="border-t border-border bg-muted/30 px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
            Projets
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </div>
      </section>

      {/* Stack Section */}
      <section className="border-t border-border px-4 py-12">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="mb-6 text-lg font-medium text-muted-foreground">
            Stack technique
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { name: "Next.js 16", icon: "⚡" },
              { name: "TypeScript", icon: "📘" },
              { name: "Tailwind CSS", icon: "🎨" },
              { name: "Supabase", icon: "💾" },
              { name: "Python", icon: "🐍" },
              { name: "scikit-learn", icon: "🤖" },
            ].map((tech) => (
              <span
                key={tech.name}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm"
              >
                <span>{tech.icon}</span>
                <span>{tech.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="container mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          <p>
            Built with curiosity by{" "}
            <a
              href="https://github.com/yannick3575"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-accent"
            >
              Yannick
            </a>
          </p>
          <p className="mt-2">My-Tensor © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

// Composant Card pour les projets
function ProjectCard({
  slug,
  title,
  emoji,
  description,
  tags,
  status,
}: {
  slug: string | null;
  title: string;
  emoji: string;
  description: string;
  tags: string[];
  status: "live" | "soon";
}) {
  const baseClassName = `group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all ${
    slug
      ? "cursor-pointer hover:border-accent hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1"
      : "opacity-60"
  }`;

  if (slug) {
    return (
      <Link href={`/projects/${slug}`} className={baseClassName}>
        <CardContent title={title} emoji={emoji} description={description} tags={tags} status={status} slug={slug} />
      </Link>
    );
  }

  return (
    <div className={baseClassName}>
      <CardContent title={title} emoji={emoji} description={description} tags={tags} status={status} slug={slug} />
    </div>
  );
}

function CardContent({
  title,
  emoji,
  description,
  tags,
  status,
  slug,
}: {
  title: string;
  emoji: string;
  description: string;
  tags: string[];
  status: "live" | "soon";
  slug: string | null;
}) {
  return (
    <>
      {/* Status badge */}
      <span
        className={`absolute right-4 top-4 rounded-full px-2 py-1 text-xs font-medium ${
          status === "live"
            ? "bg-accent/10 text-accent"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {status === "live" ? "Live" : "Soon"}
      </span>

      {/* Emoji */}
      <span className="mb-4 text-4xl">{emoji}</span>

      {/* Title */}
      <h3 className="mb-2 text-xl font-semibold tracking-tight group-hover:text-accent transition-colors">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm text-muted-foreground">{description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Arrow indicator for clickable cards */}
      {slug && (
        <span className="absolute bottom-6 right-6 text-muted-foreground transition-all group-hover:text-accent group-hover:translate-x-1">
          →
        </span>
      )}
    </>
  );
}
