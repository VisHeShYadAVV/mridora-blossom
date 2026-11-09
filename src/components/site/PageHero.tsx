import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-navy py-16 text-navy-foreground lg:py-24">
      <div className="wrap">
        {eyebrow && <p className="eyebrow text-gold-soft">{eyebrow}</p>}
        <h1 className="mt-4 max-w-4xl text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08]">{title}</h1>
        {intro && (
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-navy-foreground/80">{intro}</p>
        )}
        {children}
      </div>
    </section>
  );
}

export function InfoGrid({ items }: { items: { title: string; copy: string }[] }) {
  return (
    <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="bg-card p-7">
          <h3 className="text-xl text-primary">{item.title}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">{item.copy}</p>
        </article>
      ))}
    </div>
  );
}
