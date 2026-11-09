import { ON_REQUEST, TO_CONFIRM } from "@/data/catalog";
import { productFromRow } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { SPEC_FIELDS, type Product, type Specs } from "@/lib/types";

export async function loadAllProducts(): Promise<Product[]> {
  const rows: unknown[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase!
      .from("products")
      .select("*")
      .order("sku")
      .range(from, from + size - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return rows.map(productFromRow);
}

export function blankProduct(subcategoryId: string): Product {
  const specs = Object.fromEntries(SPEC_FIELDS.map(([k]) => [k, ON_REQUEST])) as Specs;
  specs.origin = "India";
  specs.material = TO_CONFIRM;
  specs.finish = TO_CONFIRM;
  specs.foodContact = TO_CONFIRM;
  return {
    id: "",
    sku: "",
    slug: "",
    name: "",
    subcategoryId,
    status: "draft",
    featured: false,
    newArrival: false,
    isSample: false,
    sortOrder: 0,
    overview: "",
    images: [],
    imageAlts: [],
    material: TO_CONFIRM,
    finish: TO_CONFIRM,
    colours: [],
    customizable: false,
    capacityMl: null,
    maxDimensionCm: null,
    specs,
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
}
