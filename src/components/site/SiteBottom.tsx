import { Link } from "@tanstack/react-router";

/**
 * Deliberately minimal closing line — the spec forbids large repetitive
 * footers, so every page ends with its own CTA followed by this single row.
 */
export function SiteBottom() {
  return (
    <div className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>© {new Date().getFullYear()} MRIDORA · Ceramic Sourcing &amp; Merchant Exports · India</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="mailto:export@mridoraglobal.com" className="hover:text-foreground">
            export@mridoraglobal.com
          </a>
          <Link to="/request-quote" className="hover:text-foreground">
            Request Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
