import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState, type ReactNode } from "react";

import { EnquiryButtons } from "@/components/site/Enquire";
import { InfoGrid, PageHero } from "@/components/site/PageHero";
import { ProductCard } from "@/components/site/ProductCard";
import { ON_REQUEST } from "@/data/catalog";
import { list, str } from "@/lib/blocks";
import { supabase } from "@/lib/supabase";
import type { Block, Product, PublicDocument } from "@/lib/types";
import { useSite } from "@/lib/use-site";

export interface BlockContext {
  products: Product[];
  documents: PublicDocument[];
}

/** Links from the page builder may be internal paths or full addresses. */
export function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

const paragraphs = (text: string) => text.split(/\n\s*\n/).filter((p) => p.trim());
const sectionHeading = "text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] text-primary";

function Section({ tinted, children }: { tinted?: boolean; children: ReactNode }) {
  return (
    <section className={`section-y ${tinted ? "bg-stone" : ""}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border border-border bg-card text-left text-sm">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={`${label}-${i}`} className="border-t border-border">
              <th scope="row" className="px-4 py-3 font-normal text-muted-foreground">
                {label}
              </th>
              <td className="px-4 py-3">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentList({ documents }: { documents: PublicDocument[] }) {
  const [error, setError] = useState("");
  const open = async (doc: PublicDocument) => {
    setError("");
    const { data, error: err } = (await supabase?.storage
      .from("documents")
      .createSignedUrl(doc.filePath, 120)) ?? { data: null, error: null };
    if (err || !data)
      return setError("This document could not be opened. Please contact the export desk.");
    window.open(data.signedUrl, "_blank", "noopener");
    return undefined;
  };
  return (
    <>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {documents.map((doc) => (
          <li key={doc.id}>
            <button
              type="button"
              onClick={() => void open(doc)}
              className="flex w-full items-center gap-3 border border-border bg-card p-4 text-left transition-colors hover:border-gold"
            >
              <FileText className="h-5 w-5 shrink-0 text-gold" aria-hidden />
              <span>
                <span className="block text-primary">{doc.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {doc.docType}
                  {doc.expiryDate && ` · Valid until ${doc.expiryDate}`}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

function CompanyDetails({ heading }: { heading: string }) {
  const { settings } = useSite();
  const c = settings.company;
  const rows: [string, string][] = [
    ["Legal Company Name", c.legalName],
    ["Brand Name", settings.brandName],
    ["GSTIN", c.gstin || ON_REQUEST],
    ["Importer Exporter Code (IEC)", c.iec || ON_REQUEST],
    ["LLP Identification Number (LLPIN)", c.llpin || ON_REQUEST],
    ...(c.showPan && c.pan ? ([["PAN", c.pan]] as [string, string][]) : []),
    ...(c.udyam ? ([["Udyam Registration Number", c.udyam]] as [string, string][]) : []),
    ...(c.epch ? ([["RCMC / EPCH Membership", c.epch]] as [string, string][]) : []),
    ["Registered Office Address", c.address || ON_REQUEST],
    ["Country", c.country],
  ];
  return (
    <Section>
      {heading && <h2 className={sectionHeading}>{heading}</h2>}
      <Rows rows={rows} />
    </Section>
  );
}

function Collections({ heading }: { heading: string }) {
  const { collections } = useSite();
  return (
    <Section tinted>
      {heading && <h2 className={sectionHeading}>{heading}</h2>}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.code}
            to="/collections/$collection"
            params={{ collection: c.slug }}
            className="group block border border-border bg-card"
          >
            <span className="block aspect-[4/3] overflow-hidden bg-stone">
              {c.image && (
                <img
                  src={c.image}
                  alt={`${c.name} collection`}
                  loading="lazy"
                  className="card-zoom h-full w-full object-cover"
                />
              )}
            </span>
            <span className="block p-6">
              <span className="block font-display text-2xl text-primary">{c.name}</span>
              <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                {c.tagline}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function ContactDetails({ heading, text }: { heading: string; text: string }) {
  const { settings } = useSite();
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-2">
        <dl className="space-y-6">
          <div>
            <dt className="eyebrow text-muted-foreground">Export Enquiries</dt>
            <dd className="mt-1 text-lg">
              <a
                className="text-primary underline underline-offset-4"
                href={`mailto:${settings.exportEmail}`}
              >
                {settings.exportEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted-foreground">General Enquiries</dt>
            <dd className="mt-1 text-lg">
              <a
                className="text-primary underline underline-offset-4"
                href={`mailto:${settings.generalEmail}`}
              >
                {settings.generalEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted-foreground">Registered Office</dt>
            <dd className="mt-1 whitespace-pre-line text-lg">
              {settings.company.legalName}
              {"\n"}
              {settings.company.address || ON_REQUEST}
              {"\n"}
              {settings.company.country}
            </dd>
          </div>
        </dl>
        <div>
          {heading && <h2 className="text-3xl text-primary">{heading}</h2>}
          {text && <p className="mt-3 text-muted-foreground">{text}</p>}
          <div className="mt-6">
            <EnquiryButtons />
          </div>
        </div>
      </div>
    </Section>
  );
}

function BlockView({ block, ctx }: { block: Block; ctx: BlockContext }) {
  const d = block.data;
  switch (block.type) {
    case "hero": {
      const primary = str(d["primaryLabel"]);
      const secondary = str(d["secondaryLabel"]);
      return (
        <section className="relative overflow-hidden bg-navy-deep">
          {str(d["video"]) ? (
            <video
              src={str(d["video"])}
              poster={str(d["image"])}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
          ) : (
            str(d["image"]) && (
              <img
                src={str(d["image"])}
                alt=""
                width={1920}
                height={1280}
                className="absolute inset-0 h-full w-full object-cover opacity-45"
              />
            )
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/75 to-transparent" />
          <div className="wrap relative py-24 lg:py-40">
            {str(d["eyebrow"]) && (
              <p className="eyebrow animate-rise text-gold-soft">{str(d["eyebrow"])}</p>
            )}
            <h1 className="animate-rise mt-6 max-w-3xl text-[clamp(2.8rem,7vw,5.6rem)] leading-[1.02] text-navy-foreground">
              {str(d["title"])}
              {str(d["titleAccent"]) && (
                <span className="block italic text-gold-soft">{str(d["titleAccent"])}</span>
              )}
            </h1>
            {str(d["text"]) && (
              <p className="animate-rise mt-8 max-w-xl text-lg leading-relaxed text-navy-foreground/85">
                {str(d["text"])}
              </p>
            )}
            <div className="animate-rise mt-10 flex flex-wrap gap-3">
              {primary && (
                <SmartLink
                  href={str(d["primaryHref"]) || "/request-a-quote"}
                  className="btn-shape bg-gold px-7 py-4 text-sm tracking-wide text-navy-deep transition-colors hover:bg-gold-soft"
                >
                  {primary}
                </SmartLink>
              )}
              {secondary && (
                <SmartLink
                  href={str(d["secondaryHref"]) || "/collections"}
                  className="btn-shape border border-navy-foreground/50 px-7 py-4 text-sm tracking-wide text-navy-foreground transition-colors hover:border-gold-soft hover:text-gold-soft"
                >
                  {secondary}
                </SmartLink>
              )}
            </div>
          </div>
        </section>
      );
    }
    case "pageHero":
      return (
        <PageHero
          {...(str(d["eyebrow"]) ? { eyebrow: str(d["eyebrow"]) } : {})}
          title={str(d["title"])}
          {...(str(d["intro"]) ? { intro: str(d["intro"]) } : {})}
        >
          {str(d["buttonLabel"]) && (
            <SmartLink
              href={str(d["buttonHref"]) || "/request-a-quote"}
              className="btn-shape mt-8 inline-block bg-gold px-7 py-4 text-sm tracking-wide text-navy-deep hover:bg-gold-soft"
            >
              {str(d["buttonLabel"])}
            </SmartLink>
          )}
        </PageHero>
      );
    case "richText":
      return (
        <section className="py-[calc(var(--section-y)/2)]">
          <div className="wrap">
            <div className="max-w-3xl">
              {str(d["heading"]) && <h2 className="text-3xl text-primary">{str(d["heading"])}</h2>}
              {paragraphs(str(d["body"])).map((p, i) => (
                <p
                  key={i}
                  className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted-foreground"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      );
    case "imageText": {
      const left = str(d["imageSide"]) === "left";
      return (
        <Section>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className={left ? "lg:order-2" : ""}>
              <span className="gold-rule" />
              <h2 className={`mt-6 ${sectionHeading}`}>{str(d["heading"])}</h2>
              {paragraphs(str(d["body"])).map((p, i) => (
                <p key={i} className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {str(d["linkLabel"]) && (
                <SmartLink
                  href={str(d["linkHref"]) || "/"}
                  className="mt-6 inline-block text-primary underline underline-offset-4"
                >
                  {str(d["linkLabel"])}
                </SmartLink>
              )}
            </div>
            {str(d["image"]) && (
              <img
                src={str(d["image"])}
                alt={str(d["imageAlt"])}
                loading="lazy"
                className="aspect-[5/4] w-full object-cover shadow-soft"
              />
            )}
          </div>
        </Section>
      );
    }
    case "cards":
      return (
        <Section>
          {str(d["heading"]) && <h2 className="mb-6 text-3xl text-primary">{str(d["heading"])}</h2>}
          {str(d["notice"]) && (
            <p className="mb-8 max-w-3xl border-l-2 border-gold pl-4 text-muted-foreground">
              {str(d["notice"])}
            </p>
          )}
          <InfoGrid
            items={list(d["items"]).map((i) => ({ title: str(i["title"]), copy: str(i["copy"]) }))}
          />
        </Section>
      );
    case "steps":
      return (
        <Section>
          {str(d["heading"]) && <h2 className={sectionHeading}>{str(d["heading"])}</h2>}
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {list(d["items"]).map((step, i) => (
              <article key={i}>
                {str(step["image"]) && (
                  <img
                    src={str(step["image"])}
                    alt={str(step["alt"])}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <h3 className="mt-5 text-2xl text-primary">
                  <span className="mr-2 text-gold">{String(i + 1).padStart(2, "0")}</span>
                  {str(step["title"])}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{str(step["copy"])}</p>
              </article>
            ))}
          </div>
        </Section>
      );
    case "table":
      return (
        <Section>
          {str(d["heading"]) && <h2 className="text-3xl text-primary">{str(d["heading"])}</h2>}
          <Rows
            rows={list(d["rows"]).map((r): [string, string] => [str(r["label"]), str(r["value"])])}
          />
        </Section>
      );
    case "companyDetails":
      return <CompanyDetails heading={str(d["heading"])} />;
    case "collections":
      return <Collections heading={str(d["heading"])} />;
    case "featuredProducts": {
      const mode = str(d["mode"]);
      // Samples are placeholders, so they never get promoted on a marketing section.
      const items = ctx.products
        .filter((p) => !p.isSample && (mode === "new" ? p.newArrival : p.featured))
        .slice(0, 6);
      if (items.length === 0) return null;
      return (
        <Section>
          {str(d["heading"]) && <h2 className={sectionHeading}>{str(d["heading"])}</h2>}
          <div className="product-grid mt-10">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      );
    }
    case "quote":
      if (!str(d["text"])) return null;
      return (
        <section className="bg-navy py-16">
          <div className="wrap max-w-4xl">
            <p className="font-display text-[clamp(1.5rem,3vw,2.2rem)] italic leading-snug text-navy-foreground">
              &ldquo;{str(d["text"])}&rdquo;
            </p>
            {str(d["author"]) && <p className="eyebrow mt-4 text-gold-soft">{str(d["author"])}</p>}
          </div>
        </section>
      );
    case "cta":
      return (
        <Section tinted={Boolean(str(d["heading"]))}>
          {str(d["heading"]) && (
            <h2 className="max-w-3xl text-[clamp(2rem,4vw,3rem)] leading-[1.1] text-primary">
              {str(d["heading"])}
            </h2>
          )}
          {str(d["text"]) && (
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{str(d["text"])}</p>
          )}
          <div className={str(d["heading"]) || str(d["text"]) ? "mt-8" : ""}>
            <EnquiryButtons />
          </div>
        </Section>
      );
    case "contactDetails":
      return <ContactDetails heading={str(d["heading"])} text={str(d["text"])} />;
    case "documents": {
      const type = str(d["docType"]).toLowerCase();
      const docs = ctx.documents.filter((doc) => !type || doc.docType.toLowerCase() === type);
      if (docs.length === 0) return null;
      return (
        <Section>
          {str(d["heading"]) && <h2 className="text-3xl text-primary">{str(d["heading"])}</h2>}
          <DocumentList documents={docs} />
        </Section>
      );
    }
    case "video":
      if (!str(d["url"])) return null;
      return (
        <Section>
          {str(d["heading"]) && <h2 className={`mb-6 ${sectionHeading}`}>{str(d["heading"])}</h2>}
          <video
            src={str(d["url"])}
            poster={str(d["poster"])}
            controls
            preload="metadata"
            className="w-full"
          />
        </Section>
      );
    default:
      return null;
  }
}

export function Blocks({ blocks, ctx }: { blocks: Block[]; ctx: BlockContext }) {
  return (
    <>
      {blocks
        .filter((b) => !b.hidden)
        .map((b) => (
          <BlockView key={b.id} block={b} ctx={ctx} />
        ))}
    </>
  );
}
