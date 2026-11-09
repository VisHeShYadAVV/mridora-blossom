import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { MediaField } from "@/components/admin/media";
import {
  btn,
  btnOutline,
  Check,
  errorText,
  Field,
  input,
  Message,
  Title,
  useAdmin,
} from "@/components/admin/ui";
import { defaultPages } from "@/data/pages";
import { defaultSettings } from "@/data/settings";
import { clearDataCache, settingsFromRows, settingsToRows } from "@/lib/data";
import { contrastWarnings, designCss, FONTS } from "@/lib/design";
import { supabase } from "@/lib/supabase";
import type { DesignSettings, NavItem, SiteSettings } from "@/lib/types";

export const Route = createFileRoute("/admin/design")({ component: Page });

const COLOURS: [keyof DesignSettings["colors"], string][] = [
  ["navy", "Primary (navy)"],
  ["navyDeep", "Dark sections"],
  ["gold", "Accent (gold)"],
  ["goldSoft", "Light accent"],
  ["background", "Page background"],
  ["stone", "Tinted sections"],
  ["foreground", "Main text"],
  ["muted", "Secondary text"],
  ["border", "Borders"],
];
const WIDTHS = { Desktop: "100%", Tablet: "768px", Mobile: "390px" } as const;
type Device = keyof typeof WIDTHS;

function NavEditor({
  title,
  items,
  onChange,
  allowMega,
}: {
  title: string;
  items: NavItem[];
  onChange: (v: NavItem[]) => void;
  allowMega?: boolean;
}) {
  const set = (i: number, patch: Partial<NavItem>) =>
    onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: number) => {
    const next = [...items];
    const [it] = next.splice(i, 1);
    next.splice(i + dir, 0, it!);
    onChange(next);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-lg text-primary">{title}</legend>
      {items.map((item, i) => (
        <div key={i} className="grid items-end gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Field label="Label" value={item.label} onChange={(v) => set(i, { label: v })} />
          <Field label="Link" value={item.href} onChange={(v) => set(i, { href: v })} />
          <div className="flex flex-wrap items-center gap-1 pb-0.5">
            {allowMega && (
              <Check
                label="Mega menu"
                checked={Boolean(item.mega)}
                onChange={(v) => set(i, { mega: v })}
              />
            )}
            <button
              type="button"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              className={btnOutline}
            >
              Up
            </button>
            <button
              type="button"
              disabled={i === items.length - 1}
              onClick={() => move(i, 1)}
              className={btnOutline}
            >
              Down
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, k) => k !== i))}
              className={btnOutline}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { label: "New link", href: "/" }])}
        className={btnOutline}
      >
        Add link
      </button>
    </fieldset>
  );
}

function Page() {
  const { can } = useAdmin();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [device, setDevice] = useState<Device>("Desktop");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const canEdit = can("design", "edit");

  useEffect(() => {
    void supabase!
      .from("site_settings")
      .select("key, value")
      .then(({ data, error: err }) => {
        if (err) setError(errorText(err));
        setS(settingsFromRows(data ?? []));
      });
  }, []);

  const design = s?.design;
  const postToPreview = useCallback(() => {
    if (!design) return;
    const home = defaultPages.find((p) => p.slug === "home")!;
    frame.current?.contentWindow?.postMessage(
      { type: "mridora-preview", sections: home.sections, css: designCss(design) },
      window.location.origin,
    );
  }, [design]);
  useEffect(() => postToPreview(), [postToPreview]);
  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (
        e.origin === window.location.origin &&
        e.source === frame.current?.contentWindow &&
        (e.data as { type?: string }).type === "mridora-preview-ready"
      )
        postToPreview();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [postToPreview]);

  if (!s)
    return error ? (
      <Message kind="error">{error}</Message>
    ) : (
      <p className="text-muted-foreground">Loading…</p>
    );
  const d = s.design;
  const setD = (patch: Partial<DesignSettings>) => setS({ ...s, design: { ...d, ...patch } });
  const nav = (patch: Partial<SiteSettings["nav"]>) => setS({ ...s, nav: { ...s.nav, ...patch } });
  const warnings = contrastWarnings(d.colors);

  const save = async () => {
    setError("");
    setNotice("");
    const bad = COLOURS.filter(([k]) => !/^#[0-9a-fA-F]{6}$/.test(d.colors[k]));
    if (bad.length)
      return setError(`Enter a colour like #1a2a52 for: ${bad.map(([, l]) => l).join(", ")}.`);
    const rows = settingsToRows(s);
    const { error: err } = await supabase!.from("site_settings").upsert([
      { key: "design", value: rows.design },
      { key: "nav", value: rows.nav },
    ]);
    if (err) return setError(errorText(err));
    clearDataCache();
    return setNotice("Saved. The live site updates within about a minute.");
  };

  return (
    <>
      <Title
        actions={
          canEdit ? (
            <>
              <button
                type="button"
                onClick={() => setD(defaultSettings.design)}
                className={btnOutline}
              >
                Reset to MRIDORA default
              </button>
              <button type="button" onClick={() => void save()} className={btn}>
                Save & publish
              </button>
            </>
          ) : null
        }
      >
        Design & Navigation
      </Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        {warnings.length > 0 && (
          <div role="status" className="border border-gold bg-accent p-3 text-sm">
            <p className="font-medium">These colours may be hard to read:</p>
            <ul className="mt-1 list-disc pl-5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <section className="space-y-3 border border-border bg-card p-4">
              <h2 className="text-xl text-primary">Colours</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {COLOURS.map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    {label}
                    <span className="mt-1 flex gap-2">
                      <input
                        type="color"
                        aria-label={`${label} picker`}
                        value={/^#[0-9a-fA-F]{6}$/.test(d.colors[key]) ? d.colors[key] : "#000000"}
                        onChange={(e) => setD({ colors: { ...d.colors, [key]: e.target.value } })}
                        className="h-9 w-10 border border-input bg-card"
                      />
                      <input
                        value={d.colors[key]}
                        onChange={(e) => setD({ colors: { ...d.colors, [key]: e.target.value } })}
                        className="w-full border border-input bg-card px-2 font-mono text-xs"
                      />
                    </span>
                  </label>
                ))}
              </div>
            </section>
            <section className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2">
              <h2 className="text-xl text-primary sm:col-span-2">Typography & style</h2>
              {(
                [
                  ["Heading font", "headingFont"],
                  ["Body font", "bodyFont"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} className="block text-sm">
                  {label}
                  <select
                    value={d[key]}
                    onChange={(e) => setD({ [key]: e.target.value })}
                    className={input}
                  >
                    {Object.keys(FONTS).map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="block text-sm">
                Buttons
                <select
                  value={d.buttonStyle}
                  onChange={(e) =>
                    setD({ buttonStyle: e.target.value as DesignSettings["buttonStyle"] })
                  }
                  className={input}
                >
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                </select>
              </label>
              <label className="block text-sm">
                Section spacing
                <select
                  value={d.sectionSpacing}
                  onChange={(e) =>
                    setD({ sectionSpacing: e.target.value as DesignSettings["sectionSpacing"] })
                  }
                  className={input}
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Spacious</option>
                </select>
              </label>
              <label className="block text-sm">
                Image hover effect
                <select
                  value={d.cardHover}
                  onChange={(e) =>
                    setD({ cardHover: e.target.value as DesignSettings["cardHover"] })
                  }
                  className={input}
                >
                  <option value="zoom">Zoom</option>
                  <option value="none">None</option>
                </select>
              </label>
              <label className="block text-sm">
                Header layout
                <select
                  value={d.headerLayout}
                  onChange={(e) =>
                    setD({ headerLayout: e.target.value as DesignSettings["headerLayout"] })
                  }
                  className={input}
                >
                  <option value="left">Logo left</option>
                  <option value="centered">Logo centred above menu</option>
                </select>
              </label>
              {(
                [
                  ["Product columns, desktop", "desktop"],
                  ["Product columns, tablet", "tablet"],
                  ["Product columns, mobile", "mobile"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} className="block text-sm">
                  {label}
                  <select
                    value={d.productCols[key]}
                    onChange={(e) =>
                      setD({ productCols: { ...d.productCols, [key]: Number(e.target.value) } })
                    }
                    className={input}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              ))}
            </section>
            <section className="space-y-3 border border-border bg-card p-4">
              <h2 className="text-xl text-primary">Logo & images</h2>
              <MediaField
                label="Logo"
                value={d.logoUrl}
                onChange={(v) => setD({ logoUrl: v })}
                folder="branding"
                hint="Leave empty to use the original MRIDORA logo."
              />
              <MediaField
                label="Favicon"
                value={d.faviconUrl}
                onChange={(v) => setD({ faviconUrl: v })}
                folder="branding"
              />
              <MediaField
                label="Page background image"
                value={d.bodyBackgroundImage}
                onChange={(v) => setD({ bodyBackgroundImage: v })}
                folder="branding"
              />
            </section>
            <section className="space-y-4 border border-border bg-card p-4">
              <h2 className="text-xl text-primary">Menus & footer</h2>
              <NavEditor
                title="Header menu"
                items={s.nav.header}
                onChange={(v) => nav({ header: v })}
                allowMega
              />
              <NavEditor
                title="Footer quick links"
                items={s.nav.footerQuick}
                onChange={(v) => nav({ footerQuick: v })}
              />
              <NavEditor
                title="Footer legal links"
                items={s.nav.footerLegal}
                onChange={(v) => nav({ footerLegal: v })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Footer heading: links"
                  value={s.nav.quickHeading}
                  onChange={(v) => nav({ quickHeading: v })}
                />
                <Field
                  label="Footer heading: collections"
                  value={s.nav.collectionsHeading}
                  onChange={(v) => nav({ collectionsHeading: v })}
                />
                <Field
                  label="Footer heading: export desk"
                  value={s.nav.deskHeading}
                  onChange={(v) => nav({ deskHeading: v })}
                />
                <Field
                  label="Footer heading: company"
                  value={s.nav.companyHeading}
                  onChange={(v) => nav({ companyHeading: v })}
                />
              </div>
            </section>
          </div>
          <section className="min-w-0 self-start border border-border bg-card p-4 xl:sticky xl:top-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl text-primary">Live preview</h2>
              <div className="flex gap-1" role="group" aria-label="Preview size">
                {(Object.keys(WIDTHS) as Device[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={device === w}
                    onClick={() => setDevice(w)}
                    className={`${btnOutline} ${device === w ? "border-primary" : ""}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Colours, spacing and buttons update as you edit. Fonts and the header appear after
              saving.
            </p>
            <div className="mt-3 overflow-x-auto bg-stone">
              <iframe
                ref={frame}
                src="/admin-preview"
                title="Design preview"
                onLoad={postToPreview}
                className="mx-auto block h-[calc(100vh-7rem)] border-0 bg-background"
                style={{
                  width: WIDTHS[device],
                  maxWidth: device === "Desktop" ? "100%" : undefined,
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
