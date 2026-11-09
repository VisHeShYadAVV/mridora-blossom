import { defaultSettings } from "@/data/settings";

let siteUrl = defaultSettings.siteUrl;
/** Follows the domain configured in the admin panel. Ignored unless it is a plain https origin. */
export function setSiteUrl(url: string) {
  if (/^https:\/\/[a-z0-9.-]+$/i.test(url)) siteUrl = url;
}

export const absoluteUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${siteUrl}${path}`;

export function pageHead(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  canonical?: string;
  noindex?: boolean;
}) {
  const url = absoluteUrl(opts.canonical || opts.path);
  const meta: Record<string, string>[] = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
  ];
  if (opts.image) meta.push({ property: "og:image", content: absoluteUrl(opts.image) });
  if (opts.noindex) meta.push({ name: "robots", content: "noindex" });
  return { meta, links: [{ rel: "canonical", href: url }] };
}

export const jsonLd = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replace(/</g, "\\u003c"),
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});
