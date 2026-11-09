// Default catalogue. Used when Supabase is not configured, and as the starter
// data the admin panel can import into an empty database.
import type { Collection, Product, Subcategory } from "@/lib/types";

const COLLECTIONS: {
  code: string;
  slug: string;
  name: string;
  tagline: string;
  image: string;
  subs: [code: string, name: string][];
}[] = [
  {
    code: "TW",
    slug: "tableware",
    name: "Tableware",
    tagline: "Everyday and occasion dining for wholesale and retail buyers",
    image: "/images/collection-dinnerware.jpg",
    subs: [
      ["BS", "Breakfast Sets"],
      ["MT", "Mugs & Tumblers"],
      ["CS", "Cup & Saucer Sets"],
      ["DS", "Dinner Sets"],
      ["PS", "Pasta & Soup Bowls"],
      ["BK", "Bowls & Katoris"],
      ["SD", "Side & Dessert Plates"],
      ["DP", "Dinner Plates"],
    ],
  },
  {
    code: "HW",
    slug: "hotelware-horeca",
    name: "Hotelware (HORECA)",
    tagline: "Ceramics sourced for hotels, restaurants and catering",
    image: "/images/collection-custom.jpg",
    subs: [
      ["PD", "Professional Dinner Sets"],
      ["MC", "Hotel Mugs & Cups"],
      ["RC", "Ramekins & Condiment Bowls"],
      ["BC", "Buffet & Catering Serveware"],
      ["HB", "Hotel Bowls"],
      ["RP", "Restaurant Plates"],
    ],
  },
  {
    code: "SW",
    slug: "serveware",
    name: "Serveware",
    tagline: "Serving pieces for the table, buffet and gifting",
    image: "/images/hero-table.jpg",
    subs: [
      ["TC", "Tea & Coffee Serving Sets"],
      ["DI", "Dessert & Ice Cream Bowls"],
      ["DB", "Dip & Sauce Bowls"],
      ["SA", "Snack & Appetizer Sets"],
      ["SB", "Serving Bowls"],
      ["ST", "Serving Trays"],
      ["SP", "Serving Platters"],
    ],
  },
  {
    code: "DC",
    slug: "decorative-ceramics",
    name: "Decorative Ceramics",
    tagline: "Vases, planters and decor for interiors and outdoor spaces",
    image: "/images/collection-decorative.jpg",
    subs: [
      ["HD", "Home Décor"],
      ["DB", "Decorative Bowls"],
      ["FS", "Figurines & Sculptures"],
      ["PL", "Planters"],
      ["BP", "Bonsai Planters"],
      ["OP", "Outdoor Planters"],
      ["IP", "Indoor Planters"],
      ["DV", "Decorative Vases"],
    ],
  },
  {
    code: "TC",
    slug: "terracotta",
    name: "Terracotta",
    tagline: "Traditional Indian terracotta for table, kitchen and garden",
    image: "/images/heritage-potter.jpg",
    subs: [
      ["TD", "Terracotta Decorative Items"],
      ["BP", "Terracotta Bonsai Pots"],
      ["TP", "Terracotta Planters"],
      ["CC", "Terracotta Cooking & Catering Sets"],
      ["ST", "Terracotta Serving Trays"],
      ["TB", "Terracotta Bowls"],
      ["MT", "Terracotta Mugs & Tumblers"],
      ["KL", "Terracotta Cups & Kulhads"],
      ["DW", "Terracotta Dinnerware"],
    ],
  },
];

export const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildSku = (collectionCode: string, subCode: string, sequence: number) =>
  `MRD-${collectionCode}-${subCode}-${String(sequence).padStart(4, "0")}`;

export const defaultCollections: Collection[] = COLLECTIONS.map((c, i) => ({
  code: c.code,
  slug: c.slug,
  name: c.name,
  tagline: c.tagline,
  description: `${c.tagline}. MRIDORA sources ${c.name.toLowerCase()} from India for importers, wholesalers, distributors and hospitality buyers, with quotations prepared per enquiry.`,
  seoTitle: `${c.name} Exporter India | MRIDORA`,
  seoDescription: `Source ${c.name.toLowerCase()} from India through MRIDORA, a ceramic export and sourcing company. Browse the range and request an export quotation.`,
  image: c.image,
  sortOrder: i,
  published: true,
}));

export const defaultSubcategories: Subcategory[] = COLLECTIONS.flatMap((c) =>
  c.subs.map(([code, name], i) => ({
    id: `${c.code}-${code}`,
    collectionCode: c.code,
    code,
    slug: slugify(name),
    name,
    description: `${name} in the MRIDORA ${c.name} collection, available for bulk export enquiries. Specifications, MOQ and lead times are confirmed per product and order.`,
    seoTitle: `${name} Exporter India | ${c.name} | MRIDORA`,
    seoDescription: `Bulk ${name.toLowerCase()} for international buyers, sourced from India by MRIDORA. View listings and request an export quotation.`,
    sortOrder: i,
    published: true,
  })),
);

export const ON_REQUEST = "Available on Request";
export const TO_CONFIRM = "To Be Confirmed";

// Placeholder listings only. Every value that would need verification is left
// as "Available on Request" / "To Be Confirmed"; nothing here is a real spec.
export const defaultProducts: Product[] = COLLECTIONS.flatMap((c) =>
  c.subs.flatMap(([code, name]) =>
    (["A", "B"] as const).map((style, i): Product => {
      const sku = buildSku(c.code, code, i + 1);
      const productName = `Sample ${name} – Style ${style}`;
      const material = c.code === "TC" ? "Terracotta" : TO_CONFIRM;
      return {
        id: sku,
        sku,
        slug: slugify(`${productName} ${sku}`),
        name: productName,
        subcategoryId: `${c.code}-${code}`,
        status: "active",
        featured: i === 0 && code === c.subs[0]?.[0],
        newArrival: false,
        isSample: true,
        sortOrder: i,
        overview: `This is a sample listing that shows how ${name.toLowerCase()} will appear in the MRIDORA catalogue. Verified product details will replace it. Contact the export desk for current availability and specifications.`,
        images: [c.image],
        imageAlts: [`Illustrative ${c.name.toLowerCase()} image for a sample listing`],
        material,
        finish: TO_CONFIRM,
        colours: [],
        customizable: false,
        capacityMl: null,
        maxDimensionCm: null,
        specs: {
          dimensions: ON_REQUEST,
          diameter: ON_REQUEST,
          capacity: ON_REQUEST,
          weight: ON_REQUEST,
          material,
          finish: TO_CONFIRM,
          colours: ON_REQUEST,
          moq: ON_REQUEST,
          leadTime: ON_REQUEST,
          foodContact: TO_CONFIRM,
          testing: ON_REQUEST,
          customization: ON_REQUEST,
          oem: "Subject to feasibility",
          privateLabel: ON_REQUEST,
          packaging: ON_REQUEST,
          origin: "India",
        },
        customizationInfo:
          "Customization depends on production feasibility, minimum order quantity, technical requirements and commercial agreement.",
        packagingInfo: "Packaging is confirmed per order and destination.",
        relatedSkus: [],
        specSheetUrl: "",
        seoTitle: "",
        seoDescription: "",
        canonical: "",
        customSpecs: [],
        publishAt: null,
      };
    }),
  ),
);
