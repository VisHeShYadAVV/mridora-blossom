// Default page content. The site shows these until a page is published from the admin panel.
import type { Block, BlockType, CmsPage } from "@/lib/types";

let counter = 0;
const block = (type: BlockType, data: Block["data"]): Block => ({
  id: `d${++counter}`,
  type,
  data,
});

const page = (
  slug: string,
  title: string,
  seoTitle: string,
  seoDescription: string,
  sections: Block[],
): CmsPage => ({
  slug,
  title,
  published: true,
  sections,
  seoTitle,
  seoDescription,
  canonical: "",
  ogImage: "",
  noindex: false,
});

const legal = (slug: string, title: string, description: string, parts: [string, string][]) =>
  page(slug, title, `${title} | MRIDORA`, description, [
    block("pageHero", { title }),
    ...parts.map(([heading, body]) => block("richText", { heading, body })),
  ]);

const INTRO_TITLE = "A sourcing partner rooted in Khurja's ceramic tradition";
const INTRO_BODY =
  "Khurja, India has been known for generations as a centre of ceramic craftsmanship. MRIDORA connects Indian ceramics with international buyers, coordinating product sourcing, development, quality checks, packaging and export documentation.";

export const defaultPages: CmsPage[] = [
  page(
    "home",
    "Home",
    "MRIDORA | Ceramic Tableware Exporter India & Sourcing Partner",
    "MRIDORA is an Indian ceramic export and sourcing company supplying tableware, hotelware, serveware, decorative ceramics and terracotta to international B2B buyers.",
    [
      block("hero", {
        eyebrow: "Indian Ceramic Export & Sourcing",
        title: "Crafted from Earth,",
        titleAccent: "Designed for the World.",
        text: "Ceramic tableware, hotelware, serveware, decorative ceramics and terracotta, sourced from India for international wholesale and hospitality buyers.",
        image: "/images/hero-table.jpg",
        video: "",
        primaryLabel: "Request a Quote",
        primaryHref: "/request-a-quote",
        secondaryLabel: "Explore Collections",
        secondaryHref: "/collections",
      }),
      block("imageText", {
        heading: INTRO_TITLE,
        body: INTRO_BODY,
        image: "/images/heritage-potter.jpg",
        imageAlt: "Craftsperson shaping clay on a potter's wheel",
        linkLabel: "About MRIDORA",
        linkHref: "/about",
        imageSide: "right",
      }),
      block("collections", { heading: "Five Product Collections" }),
      block("featuredProducts", { heading: "Featured Products", mode: "featured" }),
      block("quote", {
        text: "Our mission is to carry Khurja's ceramic legacy to tables around the world.",
        author: "Nishu Yadav, Founder · MRIDORA",
      }),
      block("steps", {
        heading: "How MRIDORA Works With Buyers",
        items: [
          {
            title: "Product Development",
            copy: "Requirements, references and samples are coordinated with suitable production partners.",
            image: "/images/process-design.jpg",
            alt: "Designers reviewing ceramic sketches and prototypes",
          },
          {
            title: "Sourcing",
            copy: "Products are sourced from Indian ceramic producers according to the agreed specification.",
            image: "/images/process-production.jpg",
            alt: "Artisan working in a ceramic workshop",
          },
          {
            title: "Quality Checks",
            copy: "Agreed inspections cover dimensions, glaze and surface finish before shipment.",
            image: "/images/process-quality.jpg",
            alt: "Inspector checking a finished ceramic plate",
          },
          {
            title: "Export & Packing",
            copy: "Protective packing, loading coordination and shipment documents are arranged per order.",
            image: "/images/process-shipping.jpg",
            alt: "Ceramic plates being packed for export",
          },
        ],
      }),
      block("cta", {
        heading: "Request an export quotation",
        text: "Serving importers, wholesalers, distributors, hospitality businesses, retailers and private-label buyers. Tell us what you need and where it is going.",
      }),
    ],
  ),
  page(
    "about",
    "About MRIDORA",
    "About MRIDORA | Indian Ceramic Export & Sourcing Company",
    "MRIDORA LLP is an India-based ceramic export and sourcing company serving importers, wholesalers, distributors and hospitality buyers worldwide.",
    [
      block("pageHero", {
        eyebrow: "About MRIDORA",
        title: "Crafted from Earth, Designed for the World.",
        intro:
          "MRIDORA is an India-based ceramic export and sourcing company serving importers, wholesalers, distributors, hospitality businesses, retailers and private-label buyers worldwide.",
      }),
      block("richText", {
        heading: INTRO_TITLE,
        body: `${INTRO_BODY}\n\nMRIDORA is an export and sourcing company, not a manufacturer. We work with producers in India and act as the point of contact for international buyers.`,
      }),
      block("cards", {
        heading: "What We Do",
        items: [
          {
            title: "Sourcing",
            copy: "We source ceramic and terracotta products from Indian producers to match each buyer's requirement.",
          },
          {
            title: "Development Coordination",
            copy: "We coordinate samples, custom shapes, finishes and private-label requests with production partners.",
          },
          {
            title: "Quality Coordination",
            copy: "We arrange agreed inspection and, where applicable, product-specific testing before shipment.",
          },
          {
            title: "Export Handling",
            copy: "We coordinate packing, loading and shipment documents for FOB and CIF quotations.",
          },
        ],
      }),
      block("cta", { heading: "", text: "" }),
    ],
  ),
  page(
    "customization-oem",
    "Customization & OEM",
    "Customization, OEM & Private Label Ceramics India | MRIDORA",
    "Custom ceramic tableware sourcing from India: shapes, glazes, logo and decal printing, private labelling, samples and export packaging, subject to feasibility.",
    [
      block("pageHero", {
        eyebrow: "Customization & OEM",
        title: "Customization, OEM & Private Label Development",
        intro:
          "Customization depends on production feasibility, minimum order quantity, technical requirements and commercial agreement.",
        buttonLabel: "Discuss Your Custom Project",
        buttonHref: "/request-a-quote",
      }),
      block("cards", {
        heading: "",
        items: [
          {
            title: "Custom Shapes & Dimensions",
            copy: "Share drawings or reference pieces for shapes and sizes to be assessed for production.",
          },
          {
            title: "Custom Glaze Colours",
            copy: "Request glaze colours against a reference for sampling and approval.",
          },
          {
            title: "Surface Finishes",
            copy: "Discuss glossy, matte, reactive glaze, unglazed or other finishes by product and material.",
          },
          {
            title: "Logo Printing",
            copy: "Apply a company or hospitality logo, with the method confirmed per product.",
          },
          {
            title: "Decal / Transfer Printing",
            copy: "Use decal or transfer artwork for patterns, borders and brand marks.",
          },
          {
            title: "Private Labelling",
            copy: "Source products under your own brand, including labelling and packaging details.",
          },
          {
            title: "Custom Product Development",
            copy: "Develop a new product from a brief, with requirements reviewed before sampling.",
          },
          {
            title: "Sample & Prototype Development",
            copy: "Request samples or prototypes for approval before bulk production.",
          },
          {
            title: "Packaging Customization",
            copy: "Specify inner packs, retail boxes and branded packaging.",
          },
          {
            title: "Export Carton Customization",
            copy: "Specify carton marks, labels and pack quantities for your supply chain.",
          },
          {
            title: "Buyer-Specific Collections",
            copy: "Build a range of coordinated products for one buyer or brand.",
          },
        ],
      }),
      block("cta", {
        heading: "Discuss Your Custom Project",
        text: "Send your references and requirements to the export desk.",
      }),
    ],
  ),
  page(
    "quality-compliance",
    "Quality & Compliance",
    "Quality, Compliance & Export Documentation | MRIDORA",
    "How MRIDORA approaches ceramic quality inspection, product-specific food-contact testing, export documents and company registration details.",
    [
      block("pageHero", {
        eyebrow: "Quality & Compliance",
        title: "Quality, Compliance & Export Documentation",
        intro:
          "What can be arranged, what has been completed, and what depends on the product and destination.",
      }),
      block("cards", {
        heading: "Quality & Testing",
        notice:
          "The items below describe capabilities that can be arranged, not completed tests or certifications. Not all products are certified, FDA-approved, EU-certified or tested. Ask for the documents available for a specific product.",
        items: [
          {
            title: "Product Quality Inspection",
            copy: "Products can be inspected against the specification agreed for the order.",
          },
          {
            title: "Dimensions & Tolerance Checks",
            copy: "Sizes and tolerances can be checked against approved samples or drawings.",
          },
          {
            title: "Glaze & Surface Finish Inspection",
            copy: "Glaze and finish can be reviewed for visible defects and consistency.",
          },
          {
            title: "Food-Contact Testing",
            copy: "Can be arranged where applicable, for the specific product and destination.",
          },
          {
            title: "Lead & Cadmium Migration Testing",
            copy: "Can be arranged where applicable through a testing laboratory. Results apply only to the tested product.",
          },
          {
            title: "EU Food-Contact Requirements",
            copy: "Relevant requirements are reviewed with the buyer for shipments to EU markets.",
          },
          {
            title: "USA FDA-Related Requirements",
            copy: "Relevant requirements are reviewed with the buyer for US shipments, where applicable.",
          },
          {
            title: "Breakage Prevention & Packaging Checks",
            copy: "Packing methods can be reviewed to reduce the risk of transit damage.",
          },
          {
            title: "Pre-Shipment Quality Inspection",
            copy: "Inspection before dispatch can be arranged as agreed for the order.",
          },
        ],
      }),
      block("table", {
        heading: "Export Documentation",
        rows: [
          { label: "Commercial Invoice", value: "Available as Applicable" },
          { label: "Packing List", value: "Available as Applicable" },
          { label: "Proforma Invoice", value: "Available as Applicable" },
          { label: "Shipping Bill", value: "Subject to Shipment and Destination Requirements" },
          {
            label: "Bill of Lading / Air Waybill",
            value: "Subject to Shipment and Destination Requirements",
          },
          {
            label: "Certificate of Origin",
            value: "Subject to Shipment and Destination Requirements",
          },
          { label: "Insurance Certificate", value: "Available as Applicable" },
          { label: "Product-specific Test Reports", value: "Where Available" },
          {
            label: "Other destination-specific documentation",
            value: "Subject to Shipment and Destination Requirements",
          },
        ],
      }),
      block("companyDetails", { heading: "Company Registration & Export Credentials" }),
      block("documents", { heading: "Downloads", docType: "" }),
      block("cta", { heading: "", text: "" }),
    ],
  ),
  page(
    "export-capabilities",
    "Export Capabilities",
    "Export Capabilities & Packaging | Ceramic Sourcing India | MRIDORA",
    "MRIDORA coordinates ceramic sourcing, quality control, export packaging, container loading, documentation and FOB or CIF quotations from India.",
    [
      block("pageHero", {
        eyebrow: "Export Capabilities",
        title: "Export Sourcing, Packaging & Logistics Coordination",
        intro:
          "MRIDORA is an Indian ceramic export and sourcing company. We coordinate sourcing and export for buyers and work with producers in India.",
      }),
      block("cards", {
        heading: "",
        items: [
          {
            title: "Export-Oriented Product Sourcing",
            copy: "Ceramic and terracotta products sourced from India for international buyers.",
          },
          {
            title: "Product Development Coordination",
            copy: "Samples and custom requests coordinated with production partners.",
          },
          {
            title: "Quality Control Procedures",
            copy: "Inspection steps agreed per order and carried out before dispatch.",
          },
          {
            title: "Protective Inner Packaging",
            copy: "Inner packing selected to suit the product's shape and fragility.",
          },
          {
            title: "Export-Grade Master Cartons",
            copy: "Master cartons specified for international transit.",
          },
          {
            title: "Carton Dividers and Cushioning",
            copy: "Dividers and cushioning used to separate and protect pieces.",
          },
          {
            title: "Palletization Options",
            copy: "Palletized shipment available on request, depending on the order.",
          },
          {
            title: "ISPM-15-Compliant Wooden Packaging",
            copy: "Arranged where applicable, when wooden packaging is used.",
          },
          {
            title: "Container Loading Coordination",
            copy: "Loading coordinated for the agreed shipment plan.",
          },
          {
            title: "Documentation Support",
            copy: "Shipment documents prepared as applicable to the order and destination.",
          },
          {
            title: "FOB and CIF Quotation Options",
            copy: "Quotations can be requested on FOB or CIF terms.",
          },
          {
            title: "International Buyer Communication",
            copy: "One export desk for enquiries, samples, updates and documents.",
          },
        ],
      }),
      block("cta", { heading: "", text: "" }),
    ],
  ),
  page(
    "contact",
    "Contact Us",
    "Contact the MRIDORA Export Desk",
    "Contact MRIDORA for ceramic export enquiries by email, WhatsApp or the request a quote form.",
    [
      block("pageHero", {
        eyebrow: "Contact Us",
        title: "Talk to the Export Desk",
        intro: "For product details, samples and quotations, use the option that suits you best.",
      }),
      block("contactDetails", {
        heading: "Start an enquiry",
        text: "Have products in mind? The quote form lets you list several at once.",
      }),
    ],
  ),
  legal(
    "privacy-policy",
    "Privacy Policy",
    "How MRIDORA handles information submitted through this website.",
    [
      [
        "Information we collect",
        "When you send an enquiry we receive the company, contact, product and shipping details you enter, along with any file you upload.",
      ],
      [
        "How we use it",
        "We use this information to respond to your enquiry, prepare quotations and manage our business relationship with you.",
      ],
      [
        "Sharing",
        "We may share enquiry details with production, testing and logistics partners where needed to respond to your request. We do not sell your information.",
      ],
      [
        "Your choices",
        "To ask about, correct or delete your information, contact info@mridoraglobal.com.",
      ],
    ],
  ),
  legal("terms", "Terms & Conditions", "Terms for using the MRIDORA website.", [
    [
      "Website content",
      "This website is a product catalogue for business enquiries. Products are not sold through this website and no price is offered by any page.",
    ],
    [
      "Product information",
      "Specifications may change and are confirmed in writing for each order. Images may differ from supplied goods, and sample listings are illustrative.",
    ],
    [
      "Quotations and orders",
      "An enquiry does not create a contract. Terms of supply are set in the quotation and commercial agreement for each order.",
    ],
    ["Contact", "Questions about these terms can be sent to info@mridoraglobal.com."],
  ]),
  legal(
    "cookie-policy",
    "Cookie Policy",
    "How the MRIDORA website uses cookies and browser storage.",
    [
      [
        "Browser storage",
        "Your quote list and your cookie choice are saved in your own browser. The quote list is not sent to us until you submit an enquiry.",
      ],
      [
        "Analytics",
        "If you accept analytics, we record pages viewed, how you arrived and your approximate country, using a random ID that lasts for your visit. If Google Analytics is enabled, it may also set cookies.",
      ],
      [
        "Managing cookies",
        "You can clear or block cookies and site data in your browser settings. The quote list may not persist if you do.",
      ],
    ],
  ),
];

/** Starting point for a page targeting one export market. Contains no claims to verify later. */
export const marketLandingTemplate = (market: string): Block[] => [
  block("pageHero", {
    eyebrow: "Export Market",
    title: `Ceramic Sourcing from India for ${market}`,
    intro: `MRIDORA supplies ceramic tableware, hotelware, serveware and terracotta from India to buyers in ${market}, on enquiry.`,
  }),
  block("richText", {
    heading: `Sourcing for ${market} buyers`,
    body: "Describe the products, documents and shipping terms relevant to this market. Only state what you can verify.",
  }),
  block("collections", { heading: "Collections" }),
  block("cta", {
    heading: "Request a quotation",
    text: "Share your products, quantities and destination.",
  }),
];
