import type { SiteSettings } from "@/lib/types";

interface ProductRef {
  name: string;
  sku: string;
}

export function whatsappUrl(settings: SiteSettings, product?: ProductRef) {
  const text = product
    ? `${settings.whatsappMessage}\n\nProduct: ${product.name}\nSKU: ${product.sku}`
    : settings.whatsappMessage;
  const number = settings.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function emailUrl(settings: SiteSettings, product?: ProductRef) {
  const subject = product
    ? `Export enquiry: ${product.name} (${product.sku})`
    : "Export enquiry: MRIDORA ceramics";
  return `mailto:${settings.exportEmail}?subject=${encodeURIComponent(subject)}`;
}
