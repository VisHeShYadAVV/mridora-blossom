// Shared data model for the public site and the admin panel.
// The same shapes are stored in Supabase (see supabase/migrations) and in the
// static fallback data under src/data, so the site works with or without a database.

export type ProductStatus = "draft" | "active" | "archived";

export interface Collection {
  /** Two-letter SKU collection code, e.g. "TW". Primary key. */
  code: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  image: string;
  sortOrder: number;
  published: boolean;
}

export interface Subcategory {
  /** "<collection code>-<subcategory code>", e.g. "TW-DP". Primary key. */
  id: string;
  collectionCode: string;
  /** Two-letter SKU subcategory code, e.g. "DP". */
  code: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  published: boolean;
}

/** Keys of the technical specification table shown on every product page. */
export const SPEC_FIELDS = [
  ["dimensions", "Dimensions (L × W × H, cm)"],
  ["diameter", "Diameter (cm)"],
  ["capacity", "Capacity"],
  ["weight", "Unit Weight"],
  ["material", "Material"],
  ["finish", "Surface Finish"],
  ["colours", "Available Colours"],
  ["moq", "Minimum Order Quantity"],
  ["leadTime", "Production Lead Time"],
  ["foodContact", "Food Contact Suitability"],
  ["testing", "Testing & Documentation"],
  ["customization", "Customization Level"],
  ["oem", "OEM Development"],
  ["privateLabel", "Private Labelling"],
  ["packaging", "Export Packaging"],
  ["origin", "Country of Origin"],
] as const;

export type SpecKey = (typeof SPEC_FIELDS)[number][0];
export type Specs = Partial<Record<SpecKey, string>>;

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  subcategoryId: string;
  status: ProductStatus;
  featured: boolean;
  newArrival: boolean;
  /** Sample listings are placeholders until verified product data is entered. */
  isSample: boolean;
  sortOrder: number;
  overview: string;
  images: string[];
  imageAlts: string[];
  /** Filterable attributes. */
  material: string;
  finish: string;
  colours: string[];
  customizable: boolean;
  capacityMl: number | null;
  maxDimensionCm: number | null;
  specs: Specs;
  customizationInfo: string;
  packagingInfo: string;
  relatedSkus: string[];
  specSheetUrl: string;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  /** Extra specification rows, usually added from a template. */
  customSpecs: { label: string; value: string }[];
  /** When set, a draft goes live automatically at this time. */
  publishAt: string | null;
}

export interface SocialLinks {
  linkedin: string;
  instagram: string;
  facebook: string;
  youtube: string;
  pinterest: string;
  x: string;
}

export interface CompanyInfo {
  legalName: string;
  gstin: string;
  iec: string;
  llpin: string;
  pan: string;
  showPan: boolean;
  udyam: string;
  epch: string;
  address: string;
  country: string;
}

export interface NavItem {
  label: string;
  href: string;
  /** Opens the collections mega menu. */
  mega?: boolean;
}

export interface DesignSettings {
  colors: {
    navy: string;
    navyDeep: string;
    gold: string;
    goldSoft: string;
    background: string;
    stone: string;
    foreground: string;
    muted: string;
    border: string;
  };
  headingFont: string;
  bodyFont: string;
  buttonStyle: "square" | "rounded" | "pill";
  sectionSpacing: "compact" | "normal" | "spacious";
  cardHover: "zoom" | "none";
  productCols: { desktop: number; tablet: number; mobile: number };
  headerLayout: "left" | "centered";
  logoUrl: string;
  faviconUrl: string;
  bodyBackgroundImage: string;
}

export interface FormFieldConfig {
  label: string;
  visible: boolean;
  required: boolean;
}

export type RfqFieldKey =
  | "company"
  | "country"
  | "email"
  | "phone"
  | "material"
  | "colourFinish"
  | "customization"
  | "packaging"
  | "destination"
  | "incoterm"
  | "message"
  | "attachment";

export interface SpecTemplate {
  name: string;
  fields: string[];
}

export interface SiteSettings {
  siteUrl: string;
  brandName: string;
  tagline: string;
  brandDescription: string;
  exportEmail: string;
  generalEmail: string;
  whatsappNumber: string;
  whatsappMessage: string;
  showWhatsAppButton: boolean;
  showEmailInHeader: boolean;
  showSocialInHeader: boolean;
  announcement: { enabled: boolean; text: string; link: string };
  social: SocialLinks;
  company: CompanyInfo;
  analytics: { gaMeasurementId: string; searchConsoleVerification: string };
  seo: {
    robotsTxt: string;
    defaultOgImage: string;
    schemaOrganization: boolean;
    schemaProduct: boolean;
    schemaBreadcrumbs: boolean;
    sitemapProducts: boolean;
  };
  design: DesignSettings;
  nav: {
    header: NavItem[];
    footerQuick: NavItem[];
    footerLegal: NavItem[];
    quickHeading: string;
    collectionsHeading: string;
    deskHeading: string;
    companyHeading: string;
  };
  forms: {
    fields: Record<RfqFieldKey, FormFieldConfig>;
    successTitle: string;
    successText: string;
    maxUploadMb: number;
  };
  technical: {
    maintenance: boolean;
    maintenanceMessage: string;
    notFoundTitle: string;
    notFoundText: string;
    cookieBanner: boolean;
    cookieText: string;
    sessionTimeoutMinutes: number;
  };
  catalogue: {
    materials: string[];
    finishes: string[];
    colours: string[];
    templates: SpecTemplate[];
  };
}

export type BlockType =
  | "hero"
  | "pageHero"
  | "richText"
  | "imageText"
  | "cards"
  | "steps"
  | "table"
  | "companyDetails"
  | "collections"
  | "featuredProducts"
  | "quote"
  | "cta"
  | "contactDetails"
  | "documents"
  | "video";

export interface Block {
  id: string;
  type: BlockType;
  hidden?: boolean;
  data: Record<string, unknown>;
}

export interface CmsPage {
  slug: string;
  title: string;
  published: boolean;
  sections: Block[];
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  ogImage: string;
  noindex: boolean;
}

export interface PublicDocument {
  id: string;
  title: string;
  docType: string;
  filePath: string;
  fileName: string;
  productSku: string | null;
  expiryDate: string | null;
}

export interface Redirect {
  from: string;
  to: string;
  code: number;
}

export type RfqStatus = "new" | "reviewing" | "quoted" | "negotiating" | "won" | "lost" | "closed";

export const RFQ_STATUSES: RfqStatus[] = [
  "new",
  "reviewing",
  "quoted",
  "negotiating",
  "won",
  "lost",
  "closed",
];

export interface RfqItem {
  sku: string;
  name: string;
  quantity: string;
}

export interface Rfq {
  id: string;
  createdAt: string;
  status: RfqStatus;
  company: string;
  contactName: string;
  country: string;
  email: string;
  phone: string;
  items: RfqItem[];
  material: string;
  colourFinish: string;
  customization: string;
  packaging: string;
  destination: string;
  incoterm: string;
  message: string;
  attachmentPath: string | null;
  internalNotes: string;
  quoteReference: string;
  followUpDate: string | null;
}

export type StaffRole =
  | "super_admin"
  | "website_admin"
  | "product_manager"
  | "content_editor"
  | "seo_manager"
  | "sales_manager";

export const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "super_admin", label: "Super Administrator" },
  { value: "website_admin", label: "Website Administrator" },
  { value: "product_manager", label: "Product Manager" },
  { value: "content_editor", label: "Content Editor" },
  { value: "seo_manager", label: "Marketing / SEO Manager" },
  { value: "sales_manager", label: "Sales / Enquiry Manager" },
];
