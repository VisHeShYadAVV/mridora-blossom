import { Link } from "@tanstack/react-router";

const LINKS = [
  { label: "Collections", to: "/collections" },
  { label: "Products", to: "/products" },
  { label: "OEM & Private Label", to: "/oem-private-label" },
  { label: "Quality & Export", to: "/quality-export" },
  { label: "About", to: "/about" },
  { label: "Request Export Quote", to: "/request-quote" },
] as const;

/**
 * Compact footer — intentionally minimal so it never dominates a page.
 */
export function SiteBottom() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        <div>
          <p className="font-display text-lg tracking-wide">MRIDORA</p>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground">
            Fine Ceramics &amp; Tableware Export
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground lg:max-w-xl lg:justify-end">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground lg:items-end">
          <a href="mailto:export@mridoraglobal.com" className="hover:text-foreground">
            export@mridoraglobal.com
          </a>
          <a href="mailto:info@mridoraglobal.com" className="hover:text-foreground">
            info@mridoraglobal.com
          </a>
          <p className="mt-2 text-xs">© {new Date().getFullYear()} MRIDORA</p>
        </div>
      </div>
    </footer>
  );
}
