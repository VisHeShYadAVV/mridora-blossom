import { notFound } from "@tanstack/react-router";

import { getPage, getProducts, getPublicDocuments } from "@/lib/data";
import { pageHead } from "@/lib/seo";
import type { CmsPage } from "@/lib/types";

export async function loadCmsPage(slug: string) {
  const page = await getPage(slug);
  if (!page) throw notFound();
  const types = new Set(page.sections.map((s) => s.type));
  const [products, documents] = await Promise.all([
    types.has("featuredProducts") ? getProducts() : [],
    types.has("documents") ? getPublicDocuments() : [],
  ]);
  return { page, products, documents };
}

export function cmsHead(page: CmsPage, path: string, defaultOg: string) {
  return pageHead({
    title: page.seoTitle || `${page.title} | MRIDORA`,
    description: page.seoDescription,
    path,
    canonical: page.canonical,
    noindex: page.noindex,
    image: page.ogImage || defaultOg,
  });
}
