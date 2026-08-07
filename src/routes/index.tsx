import { createFileRoute } from "@tanstack/react-router";

import { Collections } from "@/components/site/Collections";
import { Enquiry } from "@/components/site/Enquiry";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Heritage } from "@/components/site/Heritage";
import { Hero } from "@/components/site/Hero";
import { Manufacturing } from "@/components/site/Manufacturing";
import { Markets } from "@/components/site/Markets";
import { Quality } from "@/components/site/Quality";
import { Quote } from "@/components/site/Quote";
import { WhyMridora } from "@/components/site/WhyMridora";

const title = "MRIDORA — Premium Khurja Ceramic Tableware Exporters";
const description =
  "MRIDORA exports premium Khurja ceramic dinnerware, decorative and custom ceramics to hotels, restaurants and importers across the Gulf, Europe, North America and Asia Pacific.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-background">
      <Header />
      <main>
        <Hero />
        <Heritage />
        <Quote />
        <Collections />
        <Manufacturing />
        <Quality />
        <WhyMridora />
        <Markets />
        <Enquiry />
      </main>
      <Footer />
    </div>
  );
}
