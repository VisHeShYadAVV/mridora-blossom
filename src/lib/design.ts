import { defaultSettings } from "@/data/settings";
import type { DesignSettings } from "@/lib/types";

export const FONTS = {
  "Cormorant Garamond": {
    css: '"Cormorant Garamond", Georgia, serif',
    query: "Cormorant+Garamond:ital,wght@0,400..700;1,400..600",
  },
  "Playfair Display": {
    css: '"Playfair Display", Georgia, serif',
    query: "Playfair+Display:ital,wght@0,400..700;1,400..600",
  },
  "Libre Baskerville": {
    css: '"Libre Baskerville", Georgia, serif',
    query: "Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  },
  Lora: { css: "Lora, Georgia, serif", query: "Lora:ital,wght@0,400..700;1,400..600" },
  Jost: { css: "Jost, system-ui, sans-serif", query: "Jost:wght@300;400;500" },
  Inter: { css: "Inter, system-ui, sans-serif", query: "Inter:wght@300;400;500" },
  "Open Sans": { css: '"Open Sans", system-ui, sans-serif', query: "Open+Sans:wght@300;400;500" },
  Lato: { css: "Lato, system-ui, sans-serif", query: "Lato:wght@300;400;700" },
} as const;

export type FontName = keyof typeof FONTS;
const isFont = (name: string): name is FontName => name in FONTS;
const HEX = /^#[0-9a-fA-F]{6}$/;

export function fontsUrl(design: DesignSettings) {
  const names = [...new Set([design.headingFont, design.bodyFont])].filter(isFont);
  return `https://fonts.googleapis.com/css2?${names.map((n) => `family=${FONTS[n].query}`).join("&")}&display=swap`;
}

const safeUrl = (url: string) => (/^(https:\/\/|\/)[^"'()\\\s]*$/.test(url) ? url : "");

/**
 * Turns design settings into CSS variables. Only validated values reach the stylesheet,
 * so a bad setting can't break out of the style tag.
 */
export function designCss(design: DesignSettings) {
  const defaults = defaultSettings.design.colors;
  const vars: string[] = [];
  const color = (name: string, value: string, fallback: string) => {
    if (HEX.test(value) && value.toLowerCase() !== fallback) vars.push(`${name}:${value}`);
  };
  const c = design.colors;
  color("--navy", c.navy, defaults.navy);
  color("--primary", c.navy, defaults.navy);
  color("--navy-deep", c.navyDeep, defaults.navyDeep);
  color("--gold", c.gold, defaults.gold);
  color("--ring", c.gold, defaults.gold);
  color("--gold-soft", c.goldSoft, defaults.goldSoft);
  color("--background", c.background, defaults.background);
  color("--ivory", c.background, defaults.background);
  color("--stone", c.stone, defaults.stone);
  color("--secondary", c.stone, defaults.stone);
  color("--muted", c.stone, defaults.stone);
  color("--foreground", c.foreground, defaults.foreground);
  color("--card-foreground", c.foreground, defaults.foreground);
  color("--muted-foreground", c.muted, defaults.muted);
  color("--border", c.border, defaults.border);
  color("--input", c.border, defaults.border);
  if (isFont(design.headingFont)) vars.push(`--font-display:${FONTS[design.headingFont].css}`);
  if (isFont(design.bodyFont)) vars.push(`--font-sans:${FONTS[design.bodyFont].css}`);
  vars.push(
    `--btn-radius:${{ square: "0", rounded: "0.5rem", pill: "999px" }[design.buttonStyle] ?? "0"}`,
  );
  vars.push(
    `--section-y:${{ compact: "2.5rem", normal: "4rem", spacious: "6.5rem" }[design.sectionSpacing] ?? "4rem"}`,
  );
  vars.push(`--card-zoom:${design.cardHover === "none" ? "1" : "1.05"}`);
  const cols = (n: number, fallback: number) =>
    Number.isInteger(n) && n >= 1 && n <= 6 ? n : fallback;
  vars.push(`--grid-d:${cols(design.productCols.desktop, 3)}`);
  vars.push(`--grid-t:${cols(design.productCols.tablet, 2)}`);
  vars.push(`--grid-m:${cols(design.productCols.mobile, 1)}`);
  const image = safeUrl(design.bodyBackgroundImage);
  const body = image
    ? `body{background-image:url("${image}");background-size:cover;background-attachment:fixed}`
    : "";
  return `:root{${vars.join(";")}}${body}`;
}

const luminance = (hex: string) => {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

export function contrast(a: string, b: string) {
  if (!HEX.test(a) || !HEX.test(b)) return 21;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Readability problems to warn about before a colour scheme is saved. */
export function contrastWarnings(c: DesignSettings["colors"]) {
  const pairs: [string, string, string][] = [
    ["Text on page background", c.foreground, c.background],
    ["Secondary text on page background", c.muted, c.background],
    ["Text on buttons and navy sections", "#fbf9f3", c.navy],
    ["Gold accents on navy sections", c.goldSoft, c.navyDeep],
  ];
  return pairs
    .filter(([, a, b]) => contrast(a, b) < 4.5)
    .map(
      ([label, a, b]) =>
        `${label}: contrast ${contrast(a, b).toFixed(1)}:1, aim for at least 4.5:1.`,
    );
}
