import { Link } from "@tanstack/react-router";

export function CtaBand({
  eyebrow = "Next Step",
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body: string;
}) {
  return (
    <section className="bg-navy py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center lg:px-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h2 className="mt-5 text-navy-foreground text-[clamp(1.9rem,4vw,2.9rem)] leading-tight">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-navy-foreground/75">{body}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/request-quote" className="btn btn-gold w-full sm:w-auto">
            Request a Quote
          </Link>
          <a href="mailto:exports@mridora.com" className="btn btn-on-navy w-full sm:w-auto">
            Email Export Desk
          </a>
        </div>
      </div>
    </section>
  );
}
