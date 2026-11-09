import { Link } from "@tanstack/react-router";
import { ChevronDown, ListChecks, Mail, Menu, X } from "lucide-react";
import { useState } from "react";

import { SmartLink } from "@/components/site/Blocks";
import { Logo } from "@/components/site/Logo";
import { useQuoteList } from "@/lib/quote-list";
import { SOCIALS } from "@/lib/socials";
import { useSite } from "@/lib/use-site";

export function Header() {
  const { settings, collections, subcategories } = useSite();
  const { items } = useQuoteList();
  const [open, setOpen] = useState(false);
  const [megaKey, setMegaKey] = useState(0);
  const close = () => setOpen(false);
  // Re-keying drops hover/focus state so the mega menu closes after a click.
  const closeMega = () => setMegaKey((k) => k + 1);
  const linkClass = "text-[13px] tracking-wide text-foreground transition-colors hover:text-gold";
  const centered = settings.design.headerLayout === "centered";
  const socials = settings.showSocialInHeader
    ? SOCIALS.filter(({ key }) => settings.social[key])
    : [];

  const nav = (
    <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary">
      {settings.nav.header.map((item) =>
        item.mega ? (
          <div key={megaKey} className="group">
            <Link
              to={item.href}
              onClick={closeMega}
              className={`${linkClass} inline-flex h-20 items-center gap-1`}
            >
              {item.label} <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <div className="invisible absolute inset-x-0 top-full border-b border-border bg-background opacity-0 shadow-soft transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="wrap grid grid-cols-5 gap-8 py-10">
                {collections.map((c) => (
                  <div key={c.code}>
                    <Link
                      to="/collections/$collection"
                      params={{ collection: c.slug }}
                      onClick={closeMega}
                      className="font-display text-xl text-primary hover:text-gold"
                    >
                      {c.name}
                    </Link>
                    <span className="gold-rule mt-3 w-8" />
                    <ul className="mt-4 space-y-2">
                      {subcategories
                        .filter((s) => s.collectionCode === c.code)
                        .map((s) => (
                          <li key={s.id}>
                            <Link
                              to="/collections/$collection/$subcategory"
                              params={{ collection: c.slug, subcategory: s.slug }}
                              onClick={closeMega}
                              className="text-sm text-muted-foreground hover:text-primary"
                            >
                              {s.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <SmartLink key={item.href} href={item.href} className={linkClass}>
            {item.label}
          </SmartLink>
        ),
      )}
      {socials.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={settings.social[key]}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={linkClass}
        >
          <Icon aria-hidden />
        </a>
      ))}
      {settings.showEmailInHeader && (
        <a href={`mailto:${settings.exportEmail}`} aria-label="Email" className={linkClass}>
          <Mail className="h-4 w-4" aria-hidden />
        </a>
      )}
      <Link
        to="/request-a-quote"
        className="btn-shape inline-flex items-center gap-2 bg-primary px-4 py-3 text-[13px] tracking-wide text-primary-foreground transition-colors hover:bg-navy-deep"
      >
        Request a Quote
        {items.length > 0 && (
          <span
            className="bg-gold px-1.5 text-xs text-navy-deep"
            aria-label={`${items.length} products in quote list`}
          >
            {items.length}
          </span>
        )}
      </Link>
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      {settings.announcement.enabled && settings.announcement.text && (
        <p className="bg-navy px-4 py-2 text-center text-xs tracking-wide text-navy-foreground">
          {settings.announcement.link ? (
            <SmartLink
              href={settings.announcement.link}
              className="underline-offset-2 hover:underline"
            >
              {settings.announcement.text}
            </SmartLink>
          ) : (
            settings.announcement.text
          )}
        </p>
      )}
      <div
        className={`wrap flex items-center justify-between gap-4 ${centered ? "h-20 xl:h-auto xl:flex-col xl:gap-0 xl:pt-3" : "h-20"}`}
      >
        <Link to="/" aria-label="MRIDORA home" className="shrink-0">
          <Logo className="w-28" />
        </Link>
        {nav}

        <div className="flex items-center gap-4 xl:hidden">
          <Link
            to="/request-a-quote"
            className="inline-flex items-center gap-1 text-sm text-primary"
          >
            <ListChecks className="h-4 w-4" aria-hidden /> Quote
            {items.length > 0 && ` (${items.length})`}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="p-1"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-background xl:hidden"
          aria-label="Mobile"
        >
          <div
            className="wrap space-y-1 py-4"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) close();
            }}
          >
            {settings.nav.header.map((item) => (
              <div key={item.href}>
                <SmartLink href={item.href} className="block py-2">
                  {item.label}
                </SmartLink>
                {item.mega &&
                  collections.map((c) => (
                    <details key={c.code} className="pl-3">
                      <summary className="cursor-pointer py-2 text-primary">{c.name}</summary>
                      <ul className="pb-2 pl-3">
                        <li>
                          <Link
                            to="/collections/$collection"
                            params={{ collection: c.slug }}
                            className="block py-1.5 text-sm font-medium"
                          >
                            All {c.name}
                          </Link>
                        </li>
                        {subcategories
                          .filter((s) => s.collectionCode === c.code)
                          .map((s) => (
                            <li key={s.id}>
                              <Link
                                to="/collections/$collection/$subcategory"
                                params={{ collection: c.slug, subcategory: s.slug }}
                                className="block py-1.5 text-sm text-muted-foreground"
                              >
                                {s.name}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </details>
                  ))}
              </div>
            ))}
            <Link to="/request-a-quote" className="block py-2 text-primary">
              Request a Quote
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
