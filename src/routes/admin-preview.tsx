import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Blocks } from "@/components/site/Blocks";
import { getProducts, getPublicDocuments } from "@/lib/data";
import { QuoteListProvider } from "@/lib/quote-list";
import type { Block, Product, PublicDocument } from "@/lib/types";

// Rendered inside the page builder's preview frame. It holds no data of its own: content arrives
// by postMessage, accepted only from the parent window on the same origin.
export const Route = createFileRoute("/admin-preview")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: Preview,
});

function Preview() {
  const [sections, setSections] = useState<Block[]>([]);
  const [css, setCss] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<PublicDocument[]>([]);

  useEffect(() => {
    void getProducts().then(setProducts);
    void getPublicDocuments().then(setDocuments);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const msg = event.data as { type?: string; sections?: Block[]; css?: string };
      if (msg.type !== "mridora-preview") return;
      if (msg.sections) setSections(msg.sections);
      if (typeof msg.css === "string") setCss(msg.css);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "mridora-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <QuoteListProvider>
      {css && <style>{css.replace(/<\/?style/gi, "")}</style>}
      <Blocks blocks={sections} ctx={{ products, documents }} />
    </QuoteListProvider>
  );
}
