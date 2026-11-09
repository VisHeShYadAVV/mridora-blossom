import { defaultCollections, defaultProducts, defaultSubcategories } from "@/data/catalog";
import { defaultPages } from "@/data/pages";
import { defaultSettings } from "@/data/settings";
import { setSiteUrl } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import type {
  CmsPage,
  Collection,
  Product,
  PublicDocument,
  Redirect,
  Rfq,
  SiteSettings,
  Subcategory,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const collectionFromRow = (r: any): Collection => ({
  code: r.code,
  slug: r.slug,
  name: r.name,
  tagline: r.tagline ?? "",
  description: r.description ?? "",
  seoTitle: r.seo_title ?? "",
  seoDescription: r.seo_description ?? "",
  image: r.image ?? "",
  sortOrder: r.sort_order ?? 0,
  published: r.published,
});
export const collectionToRow = (c: Collection) => ({
  code: c.code,
  slug: c.slug,
  name: c.name,
  tagline: c.tagline,
  description: c.description,
  seo_title: c.seoTitle,
  seo_description: c.seoDescription,
  image: c.image,
  sort_order: c.sortOrder,
  published: c.published,
});
export const subcategoryFromRow = (r: any): Subcategory => ({
  id: r.id,
  collectionCode: r.collection_code,
  code: r.code,
  slug: r.slug,
  name: r.name,
  description: r.description ?? "",
  seoTitle: r.seo_title ?? "",
  seoDescription: r.seo_description ?? "",
  sortOrder: r.sort_order ?? 0,
  published: r.published,
});
export const subcategoryToRow = (s: Subcategory) => ({
  id: s.id,
  collection_code: s.collectionCode,
  code: s.code,
  slug: s.slug,
  name: s.name,
  description: s.description,
  seo_title: s.seoTitle,
  seo_description: s.seoDescription,
  sort_order: s.sortOrder,
  published: s.published,
});
export const productFromRow = (r: any): Product => ({
  canonical: "",
  customSpecs: [],
  ...r.data,
  publishAt: r.publish_at ?? null,
  id: r.id,
  sku: r.sku,
  slug: r.slug,
  name: r.name,
  subcategoryId: r.subcategory_id,
  status: r.status,
  featured: r.featured,
  newArrival: r.new_arrival,
  isSample: r.is_sample,
  sortOrder: r.sort_order,
});
export const productToRow = (p: Product) => {
  const {
    id: _id,
    sku,
    slug,
    name,
    subcategoryId,
    status,
    featured,
    newArrival,
    isSample,
    sortOrder,
    publishAt,
    ...data
  } = p;
  return {
    sku,
    slug,
    name,
    subcategory_id: subcategoryId,
    status,
    featured,
    new_arrival: newArrival,
    is_sample: isSample,
    sort_order: sortOrder,
    publish_at: publishAt,
    data,
  };
};
export const rfqFromRow = (r: any): Rfq => ({
  id: r.id,
  createdAt: r.created_at,
  status: r.status,
  company: r.company,
  contactName: r.contact_name ?? "",
  country: r.country,
  email: r.email,
  phone: r.phone ?? "",
  items: r.items ?? [],
  material: r.material ?? "",
  colourFinish: r.colour_finish ?? "",
  customization: r.customization ?? "",
  packaging: r.packaging ?? "",
  destination: r.destination ?? "",
  incoterm: r.incoterm ?? "",
  message: r.message ?? "",
  attachmentPath: r.attachment_path,
  internalNotes: r.internal_notes ?? "",
  quoteReference: r.quote_reference ?? "",
  followUpDate: r.follow_up_date,
});
export const pageFromRow = (r: any): CmsPage => ({
  slug: r.slug,
  title: r.title,
  published: r.published ?? true,
  sections: r.sections ?? [],
  seoTitle: r.seo_title ?? "",
  seoDescription: r.seo_description ?? "",
  canonical: r.canonical ?? "",
  ogImage: r.og_image ?? "",
  noindex: r.noindex ?? false,
});
export const pageToDraftRow = (p: CmsPage) => ({
  slug: p.slug,
  title: p.title,
  sections: p.sections,
  seo_title: p.seoTitle,
  seo_description: p.seoDescription,
  canonical: p.canonical,
  og_image: p.ogImage,
  noindex: p.noindex,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface SiteData {
  settings: SiteSettings;
  collections: Collection[];
  subcategories: Subcategory[];
  redirects: Redirect[];
}

type SettingsInput = { [K in keyof SiteSettings]?: Partial<SiteSettings[K]> };

export const mergeSettings = (value: SettingsInput | null | undefined): SiteSettings => {
  const d = defaultSettings;
  return {
    ...d,
    ...(value as Partial<SiteSettings>),
    announcement: { ...d.announcement, ...value?.announcement },
    social: { ...d.social, ...value?.social },
    company: { ...d.company, ...value?.company },
    analytics: { ...d.analytics, ...value?.analytics },
    seo: { ...d.seo, ...value?.seo },
    design: {
      ...d.design,
      ...value?.design,
      colors: { ...d.design.colors, ...value?.design?.colors },
      productCols: { ...d.design.productCols, ...value?.design?.productCols },
    },
    nav: { ...d.nav, ...value?.nav },
    forms: {
      ...d.forms,
      ...value?.forms,
      fields: { ...d.forms.fields, ...value?.forms?.fields },
    },
    technical: { ...d.technical, ...value?.technical },
    catalogue: { ...d.catalogue, ...value?.catalogue },
  };
};

/** Settings are split into rows so access can differ by section (see the migrations). */
export function settingsFromRows(rows: { key: string; value: SettingsInput }[]): SiteSettings {
  return mergeSettings(Object.assign({}, ...rows.map((r) => r.value)) as SettingsInput);
}

export function settingsToRows(s: SiteSettings) {
  const {
    tagline,
    brandDescription,
    announcement,
    analytics,
    seo,
    design,
    nav,
    forms,
    technical,
    catalogue,
    ...general
  } = s;
  return {
    general,
    content: { tagline, brandDescription, announcement },
    seo: { analytics, seo },
    design: { design },
    nav: { nav },
    forms: { forms },
    technical: { technical },
    catalogue: { catalogue },
  };
}

// Resolved values only: a pending promise must not be shared across server requests.
const TTL_MS = 30_000;
let siteCache: { at: number; value: SiteData } | null = null;
let productCache: { at: number; value: Product[] } | null = null;
let pageCache: { at: number; value: CmsPage[] } | null = null;
let documentCache: { at: number; value: PublicDocument[] } | null = null;

export function clearDataCache() {
  siteCache = null;
  productCache = null;
  pageCache = null;
  documentCache = null;
}

const staticSiteData = (): SiteData => ({
  settings: defaultSettings,
  collections: defaultCollections,
  subcategories: defaultSubcategories,
  redirects: [],
});

export async function getSiteData(): Promise<SiteData> {
  if (!supabase) return staticSiteData();
  if (siteCache && Date.now() - siteCache.at < TTL_MS) return siteCache.value;
  // Publishes anything scheduled that has fallen due. Failure must not take the site down.
  const tick = await supabase.rpc("run_due_publications");
  if (tick.error) console.error("Scheduled publishing failed", tick.error);
  const [settings, collections, subcategories, redirects] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("collections").select("*").eq("published", true).order("sort_order"),
    supabase.from("subcategories").select("*").eq("published", true).order("sort_order"),
    supabase.from("redirects").select("from_path, to_path, code").eq("active", true),
  ]);
  const error = settings.error ?? collections.error ?? subcategories.error ?? redirects.error;
  if (error) {
    // Serve the last good copy rather than failing every page on a database blip.
    console.error("Failed to load site data", error);
    return siteCache?.value ?? { ...staticSiteData(), collections: [], subcategories: [] };
  }
  const value: SiteData = {
    settings: settingsFromRows(settings.data ?? []),
    collections: (collections.data ?? []).map(collectionFromRow),
    subcategories: (subcategories.data ?? []).map(subcategoryFromRow),
    redirects: (redirects.data ?? []).map((r) => ({
      from: r.from_path,
      to: r.to_path,
      code: r.code,
    })),
  };
  setSiteUrl(value.settings.siteUrl);
  siteCache = { at: Date.now(), value };
  return value;
}

/** Live pages, with defaults for any page never published from the admin panel. */
export async function getPages(): Promise<CmsPage[]> {
  if (!supabase) return defaultPages;
  if (pageCache && Date.now() - pageCache.at < TTL_MS) return pageCache.value;
  const { data, error } = await supabase.from("pages").select("*");
  if (error) {
    console.error("Failed to load pages", error);
    return pageCache?.value ?? defaultPages;
  }
  const live = (data ?? []).map(pageFromRow);
  const slugs = new Set(live.map((p) => p.slug));
  const value = [...live, ...defaultPages.filter((p) => !slugs.has(p.slug))];
  pageCache = { at: Date.now(), value };
  return value;
}

export async function getPage(slug: string): Promise<CmsPage | null> {
  const page = (await getPages()).find((p) => p.slug === slug);
  return page?.published ? page : null;
}

/** Row-level security returns only approved, public, unexpired documents to visitors. */
export async function getPublicDocuments(): Promise<PublicDocument[]> {
  if (!supabase) return [];
  if (documentCache && Date.now() - documentCache.at < TTL_MS) return documentCache.value;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, doc_type, file_path, file_name, product_sku, expiry_date")
    .eq("status", "approved")
    .eq("is_public", true)
    .or(`expiry_date.is.null,expiry_date.gte.${today}`)
    .order("title");
  if (error) {
    console.error("Failed to load documents", error);
    return documentCache?.value ?? [];
  }
  const value = (data ?? []).map((d) => ({
    id: d.id as string,
    title: d.title as string,
    docType: d.doc_type as string,
    filePath: d.file_path as string,
    fileName: d.file_name as string,
    productSku: d.product_sku as string | null,
    expiryDate: d.expiry_date as string | null,
  }));
  documentCache = { at: Date.now(), value };
  return value;
}

export async function getProducts(): Promise<Product[]> {
  if (!supabase) return defaultProducts.filter((p) => p.status === "active");
  if (productCache && Date.now() - productCache.at < TTL_MS) return productCache.value;
  const rows: unknown[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("sort_order")
      .order("sku")
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("Failed to load products", error);
      return productCache?.value ?? [];
    }
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  const value = rows.map(productFromRow);
  productCache = { at: Date.now(), value };
  return value;
}

export type RfqSubmission = Pick<
  Rfq,
  | "company"
  | "country"
  | "email"
  | "phone"
  | "items"
  | "material"
  | "colourFinish"
  | "customization"
  | "packaging"
  | "destination"
  | "incoterm"
  | "message"
>;

/** Stores an enquiry. Anonymous visitors may insert but never read, so no row is returned. */
export async function submitRfq(rfq: RfqSubmission, file: File | null) {
  if (!supabase) throw new Error("Supabase is not configured");
  let attachmentPath: string | null = null;
  if (file) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("rfq-attachments").upload(path, file);
    if (error) throw error;
    attachmentPath = path;
  }
  const { error } = await supabase.from("rfqs").insert({
    company: rfq.company,
    country: rfq.country,
    email: rfq.email,
    phone: rfq.phone,
    items: rfq.items,
    material: rfq.material,
    colour_finish: rfq.colourFinish,
    customization: rfq.customization,
    packaging: rfq.packaging,
    destination: rfq.destination,
    incoterm: rfq.incoterm,
    message: rfq.message,
    attachment_path: attachmentPath,
  });
  if (error) throw error;
}
