import { createFileRoute, Outlet } from "@tanstack/react-router";

import { CookieConsent } from "@/components/site/CookieConsent";
import { FloatingWhatsApp } from "@/components/site/Enquire";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { QuoteListProvider } from "@/lib/quote-list";

export const Route = createFileRoute("/_site")({ component: SiteLayout });

function SiteLayout() {
  return (
    <QuoteListProvider>
      <div className="relative bg-background">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
        <FloatingWhatsApp />
        <CookieConsent />
      </div>
    </QuoteListProvider>
  );
}
