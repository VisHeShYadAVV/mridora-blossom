import { useEffect, useState } from "react";
import logo from "@/assets/mridora-logo.png.asset.json";

const NAV = [
  { label: "Products", href: "#products" },
  { label: "Manufacturing", href: "#manufacturing" },
  { label: "Markets", href: "#markets" },
  { label: "Why MRIDORA", href: "#why" },
];

export function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? "bg-background/95 backdrop-blur border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <a href="#top" className="flex items-center" aria-label="MRIDORA home">
          <img
            src={logo.url}
            alt="MRIDORA ceramic exports"
            width={140}
            height={94}
            className={`h-11 w-auto object-contain transition-all duration-500 ${
              solid ? "" : "brightness-0 invert"
            }`}
          />
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm tracking-wide transition-colors ${
                solid
                  ? "text-foreground hover:text-primary"
                  : "text-espresso-foreground hover:text-primary-foreground"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#enquiry"
            className={`border px-6 py-3 text-sm tracking-wide transition-colors ${
              solid
                ? "border-foreground text-foreground hover:bg-foreground hover:text-background"
                : "border-espresso-foreground text-espresso-foreground hover:bg-espresso-foreground hover:text-espresso"
            }`}
          >
            Request Enquiry
          </a>
        </nav>

        <a
          href="#enquiry"
          className={`text-sm tracking-wide md:hidden ${
            solid ? "text-foreground" : "text-espresso-foreground"
          }`}
        >
          Enquiry
        </a>
      </div>
    </header>
  );
}
