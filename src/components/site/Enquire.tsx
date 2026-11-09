import { Link, useMatches } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

import { emailUrl, whatsappUrl } from "@/lib/links";
import { useSite } from "@/lib/use-site";

export const primaryButton =
  "btn-shape inline-flex items-center justify-center gap-2 bg-primary px-6 py-3.5 text-sm tracking-wide text-primary-foreground transition-colors hover:bg-navy-deep";
export const outlineButton =
  "btn-shape inline-flex items-center justify-center gap-2 border border-primary px-6 py-3.5 text-sm tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground";

/** The three enquiry actions required on every collection and product page. */
export function EnquiryButtons({ product }: { product?: { name: string; sku: string } }) {
  const { settings } = useSite();
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        to="/request-a-quote"
        search={product ? { sku: product.sku } : {}}
        className={primaryButton}
      >
        Request a Quote
      </Link>
      <a
        href={whatsappUrl(settings, product)}
        target="_blank"
        rel="noreferrer"
        className={outlineButton}
      >
        <FaWhatsapp aria-hidden /> WhatsApp Export Desk
      </a>
      <a href={emailUrl(settings, product)} className={outlineButton}>
        <Mail className="h-4 w-4" aria-hidden /> Email Export Desk
      </a>
    </div>
  );
}

export function FloatingWhatsApp() {
  const { settings } = useSite();
  // On a product page the message names that product.
  const product = useMatches({
    select: (matches) => {
      const match = matches.find((m) => m.routeId === "/_site/products/$slug");
      return (match?.loaderData as { product?: { name: string; sku: string } } | undefined)
        ?.product;
    },
  });
  if (!settings.showWhatsAppButton) return null;
  return (
    <a
      href={whatsappUrl(settings, product)}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp Export Desk"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-soft transition-transform hover:scale-105"
    >
      <FaWhatsapp aria-hidden />
    </a>
  );
}
