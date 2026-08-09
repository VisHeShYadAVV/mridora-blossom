import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useInquiry } from "@/lib/inquiry";

const NAV = [
  { label: "Collections", to: "/collections" },
  { label: "Products", to: "/products" },
  { label: "OEM & Private Label", to: "/oem-private-label" },
  { label: "Quality & Export", to: "/quality-export" },
  { label: "About", to: "/about" },
] as const;

export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, openInquiry } = useInquiry();

  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const inverted = onHome && !solid && !open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        inverted ? "bg-transparent" : "border-b border-border bg-background/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center" aria-label="MRIDORA GLOBAL home">
          <img
            src="/mridora-logo.png"
            alt="MRIDORA GLOBAL"
            width={140}
            height={94}
            className={`h-10 w-auto object-contain transition-all duration-500 ${
              inverted ? "brightness-0 invert" : ""
            }`}
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm tracking-wide transition-colors ${
                inverted
                  ? "text-navy-foreground/85 hover:text-navy-foreground"
                  : "text-foreground hover:text-primary"
              }`}
              activeProps={{ className: "underline decoration-gold underline-offset-8" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openInquiry}
            className={`hidden min-h-12 items-center gap-2 border px-4 text-xs uppercase tracking-[0.16em] transition-colors sm:inline-flex ${
              inverted
                ? "border-navy-foreground/50 text-navy-foreground hover:bg-navy-foreground hover:text-navy"
                : "border-input text-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
            aria-label={`Open inquiry list, ${count} items`}
          >
            Inquiry
            <span className="inline-flex h-5 min-w-5 items-center justify-center bg-gold px-1 text-[11px] text-accent-foreground">
              {count}
            </span>
          </button>

          <Link
            to="/request-quote"
            className={`hidden min-h-12 items-center px-5 text-xs uppercase tracking-[0.16em] transition-colors md:inline-flex ${
              inverted
                ? "bg-navy-foreground text-navy hover:bg-navy-foreground/90"
                : "bg-primary text-primary-foreground hover:bg-navy"
            }`}
          >
            Request Quote
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className={`inline-flex h-12 w-12 items-center justify-center lg:hidden ${
              inverted ? "text-navy-foreground" : "text-foreground"
            }`}
          >
            <span className="relative block h-4 w-6">
              <span
                className={`absolute left-0 h-px w-6 bg-current transition-transform duration-300 ${
                  open ? "top-2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-2 h-px w-6 bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-6 bg-current transition-transform duration-300 ${
                  open ? "top-2 -rotate-45" : "top-4"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-h-12 items-center border-b border-border/60 text-base text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openInquiry();
              }}
              className="flex min-h-12 items-center border-b border-border/60 text-left text-base text-foreground"
            >
              Inquiry List ({count})
            </button>
            <Link to="/request-quote" className="btn btn-primary mt-4">
              Request Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
