import { useSite } from "@/lib/use-site";

// The default logo file has a large white canvas. It is cropped with CSS only; the artwork is
// untouched. A logo uploaded in the admin panel is shown whole.
export function Logo({ className = "" }: { className?: string }) {
  const { settings } = useSite();
  if (settings.design.logoUrl) {
    return (
      <span className={`block ${className}`}>
        <img
          src={settings.design.logoUrl}
          alt={settings.brandName}
          className="h-auto w-full object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      style={{ aspectRatio: "315 / 155" }}
    >
      <img
        src="/mridora-logo.png"
        alt={settings.brandName}
        width={600}
        height={400}
        className="absolute max-w-none"
        style={{ width: "190.5%", left: "-44.4%", top: "-64.5%" }}
      />
    </span>
  );
}
