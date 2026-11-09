import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import type { ReactNode } from "react";
import { FaWhatsapp } from "react-icons/fa6";

import { SmartLink } from "@/components/site/Blocks";
import { SOCIALS } from "@/lib/socials";

import { Logo } from "@/components/site/Logo";
import { ON_REQUEST } from "@/data/catalog";
import { emailUrl, whatsappUrl } from "@/lib/links";
import { useSite } from "@/lib/use-site";

const linkClass = "text-navy-foreground/75 transition-colors hover:text-gold-soft";

function Heading({ children }: { children: ReactNode }) {
  return <p className="eyebrow text-gold-soft">{children}</p>;
}

export function Footer() {
  const { settings, collections } = useSite();
  const { company, social, nav } = settings;
  const iconClass =
    "inline-flex h-9 w-9 items-center justify-center border border-navy-foreground/25";
  const registrations = [
    ["GSTIN", company.gstin],
    ["IEC Code", company.iec],
    ["LLPIN", company.llpin],
    ...(company.udyam ? [["Udyam Registration", company.udyam] as const] : []),
    ...(company.epch ? [["EPCH / RCMC Membership", company.epch] as const] : []),
  ];

  return (
    <footer className="bg-navy-deep text-sm text-navy-foreground">
      <div className="wrap grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr_1.2fr]">
        <div>
          <span className="inline-block bg-ivory p-2">
            <Logo className="w-28" />
          </span>
          <p className="mt-5 font-display text-lg italic text-gold-soft">{settings.tagline}</p>
          <p className="mt-3 leading-relaxed text-navy-foreground/75">
            {settings.brandDescription}
          </p>
        </div>

        <div>
          <Heading>{nav.quickHeading}</Heading>
          <ul className="mt-5 space-y-2.5">
            {nav.footerQuick.map((item) => (
              <li key={item.href}>
                <SmartLink href={item.href} className={linkClass}>
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Heading>{nav.collectionsHeading}</Heading>
          <ul className="mt-5 space-y-2.5">
            {collections.map((c) => (
              <li key={c.code}>
                <Link
                  to="/collections/$collection"
                  params={{ collection: c.slug }}
                  className={linkClass}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Heading>{nav.deskHeading}</Heading>
          <ul className="mt-5 space-y-3 break-words text-navy-foreground/75">
            <li>
              Export Enquiries:{" "}
              <a href={`mailto:${settings.exportEmail}`} className={linkClass}>
                {settings.exportEmail}
              </a>
            </li>
            <li>
              General Enquiries:{" "}
              <a href={`mailto:${settings.generalEmail}`} className={linkClass}>
                {settings.generalEmail}
              </a>
            </li>
            <li>
              <a
                href={whatsappUrl(settings)}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                WhatsApp Export Desk
              </a>
            </li>
            <li>
              Registered Office: {company.address || ON_REQUEST}, {company.country}
            </li>
            <li>
              <Link to="/request-a-quote" className={linkClass}>
                Business Enquiry Form
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <Heading>{nav.companyHeading}</Heading>
          <ul className="mt-5 space-y-2.5 text-navy-foreground/75">
            <li>{company.legalName}</li>
            {registrations.map(([label, value]) => (
              <li key={label}>
                {label}: {value || ON_REQUEST}
              </li>
            ))}
            <li>
              <SmartLink href="/quality-compliance" className={linkClass}>
                Quality & Documentation
              </SmartLink>
            </li>
            {nav.footerLegal.slice(0, 2).map((item) => (
              <li key={item.href}>
                <SmartLink href={item.href} className={linkClass}>
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="wrap flex flex-wrap gap-2 pb-10">
        {SOCIALS.map(({ key, label, Icon }) =>
          social[key] ? (
            <a
              key={key}
              href={social[key]}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className={`${iconClass} transition-colors hover:border-gold hover:text-gold-soft`}
            >
              <Icon aria-hidden />
            </a>
          ) : (
            <span
              key={key}
              title={`${label}: profile not yet available`}
              className={`${iconClass} opacity-30`}
            >
              <Icon aria-hidden />
              <span className="sr-only">{label} profile not yet available</span>
            </span>
          ),
        )}
        <a
          href={whatsappUrl(settings)}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className={`${iconClass} transition-colors hover:border-gold hover:text-gold-soft`}
        >
          <FaWhatsapp aria-hidden />
        </a>
        <a
          href={emailUrl(settings)}
          aria-label="Email"
          className={`${iconClass} transition-colors hover:border-gold hover:text-gold-soft`}
        >
          <Mail className="h-4 w-4" aria-hidden />
        </a>
      </div>

      <div className="border-t border-navy-foreground/15">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-navy-foreground/60">
          <p>© {new Date().getFullYear()} MRIDORA. All Rights Reserved.</p>
          <p className="flex flex-wrap gap-3">
            {nav.footerLegal.map((item, i) => (
              <span key={item.href} className="flex gap-3">
                {i > 0 && <span aria-hidden>|</span>}
                <SmartLink href={item.href} className="hover:text-gold-soft">
                  {item.label}
                </SmartLink>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
