import logo from "@/assets/mridora-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="bg-espresso py-16 text-espresso-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-3 lg:px-10">
        <div>
          <img
            src={logo.url}
            alt="MRIDORA"
            width={140}
            height={94}
            loading="lazy"
            className="h-12 w-auto object-contain brightness-0 invert"
          />
          <p className="mt-6 max-w-xs leading-relaxed text-espresso-foreground/60">
            Premium ceramic tableware from Khurja, India — exported to homes, hotels and restaurants
            worldwide.
          </p>
        </div>

        <div>
          <p className="eyebrow text-primary">Explore</p>
          <ul className="mt-6 space-y-3 text-espresso-foreground/70">
            <li>
              <a href="#products" className="hover:text-espresso-foreground">
                Products
              </a>
            </li>
            <li>
              <a href="#manufacturing" className="hover:text-espresso-foreground">
                Manufacturing
              </a>
            </li>
            <li>
              <a href="#markets" className="hover:text-espresso-foreground">
                Markets
              </a>
            </li>
            <li>
              <a href="#why" className="hover:text-espresso-foreground">
                Why MRIDORA
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-primary">Contact</p>
          <ul className="mt-6 space-y-3 text-espresso-foreground/70">
            <li>Khurja, Uttar Pradesh, India</li>
            <li>
              <a href="mailto:exports@mridora.com" className="hover:text-espresso-foreground">
                exports@mridora.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-7xl px-6 lg:px-10">
        <p className="border-t border-espresso-foreground/15 pt-8 text-sm text-espresso-foreground/50">
          © {new Date().getFullYear()} MRIDORA. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
