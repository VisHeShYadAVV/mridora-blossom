import type { BlockType } from "@/lib/types";

export type FieldKind = "text" | "textarea" | "image" | "video" | "select" | "list";

export interface BlockField {
  key: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  options?: { value: string; label: string }[];
  itemFields?: BlockField[];
}

const t = (key: string, label: string, hint?: string): BlockField => ({
  key,
  label,
  kind: "text",
  ...(hint ? { hint } : {}),
});
const area = (key: string, label: string, hint?: string): BlockField => ({
  key,
  label,
  kind: "textarea",
  ...(hint ? { hint } : {}),
});

export const BLOCKS: Record<
  BlockType,
  { label: string; fields: BlockField[]; defaults: Record<string, unknown> }
> = {
  hero: {
    label: "Hero banner",
    fields: [
      t("eyebrow", "Small heading"),
      t("title", "Title"),
      t("titleAccent", "Title, second line"),
      area("text", "Text"),
      { key: "image", label: "Background image", kind: "image" },
      { key: "video", label: "Background video (optional)", kind: "video" },
      t("primaryLabel", "Main button text"),
      t("primaryHref", "Main button link"),
      t("secondaryLabel", "Second button text"),
      t("secondaryHref", "Second button link"),
    ],
    defaults: { title: "New banner", image: "/images/hero-table.jpg" },
  },
  pageHero: {
    label: "Page heading",
    fields: [
      t("eyebrow", "Small heading"),
      t("title", "Title"),
      area("intro", "Introduction"),
      t("buttonLabel", "Button text"),
      t("buttonHref", "Button link"),
    ],
    defaults: { title: "New page heading" },
  },
  richText: {
    label: "Text",
    fields: [
      t("heading", "Heading"),
      area("body", "Text", "Leave a blank line between paragraphs."),
    ],
    defaults: { heading: "New section", body: "" },
  },
  imageText: {
    label: "Image and text",
    fields: [
      t("heading", "Heading"),
      area("body", "Text"),
      { key: "image", label: "Image", kind: "image" },
      t("imageAlt", "Image description"),
      t("linkLabel", "Link text"),
      t("linkHref", "Link address"),
      {
        key: "imageSide",
        label: "Image position",
        kind: "select",
        options: [
          { value: "right", label: "Right" },
          { value: "left", label: "Left" },
        ],
      },
    ],
    defaults: { heading: "New section", imageSide: "right" },
  },
  cards: {
    label: "Information cards",
    fields: [
      t("heading", "Heading"),
      area("notice", "Highlighted notice"),
      {
        key: "items",
        label: "Cards",
        kind: "list",
        itemFields: [t("title", "Title"), area("copy", "Text")],
      },
    ],
    defaults: { heading: "New section", items: [{ title: "Card title", copy: "" }] },
  },
  steps: {
    label: "Numbered steps",
    fields: [
      t("heading", "Heading"),
      {
        key: "items",
        label: "Steps",
        kind: "list",
        itemFields: [
          t("title", "Title"),
          area("copy", "Text"),
          { key: "image", label: "Image", kind: "image" },
          t("alt", "Image description"),
        ],
      },
    ],
    defaults: { heading: "New section", items: [{ title: "Step", copy: "" }] },
  },
  table: {
    label: "Table",
    fields: [
      t("heading", "Heading"),
      {
        key: "rows",
        label: "Rows",
        kind: "list",
        itemFields: [t("label", "Label"), t("value", "Value")],
      },
    ],
    defaults: { heading: "New table", rows: [{ label: "", value: "" }] },
  },
  companyDetails: {
    label: "Company registration details",
    fields: [t("heading", "Heading", "The details come from Website Settings.")],
    defaults: { heading: "Company Registration & Export Credentials" },
  },
  collections: {
    label: "Collections showcase",
    fields: [t("heading", "Heading")],
    defaults: { heading: "Collections" },
  },
  featuredProducts: {
    label: "Featured products",
    fields: [
      t("heading", "Heading", "Hidden until real products are marked. Samples are never shown."),
      {
        key: "mode",
        label: "Show",
        kind: "select",
        options: [
          { value: "featured", label: "Featured products" },
          { value: "new", label: "New arrivals" },
        ],
      },
    ],
    defaults: { heading: "Featured Products", mode: "featured" },
  },
  quote: {
    label: "Quote",
    fields: [area("text", "Quote"), t("author", "Attribution")],
    defaults: { text: "", author: "" },
  },
  cta: {
    label: "Enquiry buttons",
    fields: [t("heading", "Heading"), area("text", "Text")],
    defaults: { heading: "Request a quotation", text: "" },
  },
  contactDetails: {
    label: "Contact details",
    fields: [t("heading", "Heading"), area("text", "Text")],
    defaults: { heading: "Start an enquiry", text: "" },
  },
  documents: {
    label: "Downloadable documents",
    fields: [
      t("heading", "Heading", "Shows only approved, public, unexpired documents."),
      t("docType", "Only this document type (optional)"),
    ],
    defaults: { heading: "Downloads", docType: "" },
  },
  video: {
    label: "Video",
    fields: [
      t("heading", "Heading"),
      { key: "url", label: "Video file", kind: "video" },
      { key: "poster", label: "Cover image", kind: "image" },
    ],
    defaults: { heading: "", url: "" },
  },
};

export const str = (value: unknown) => (typeof value === "string" ? value : "");
export const list = (value: unknown) =>
  (Array.isArray(value) ? value : []) as Record<string, unknown>[];
export const newBlockId = () => crypto.randomUUID();
