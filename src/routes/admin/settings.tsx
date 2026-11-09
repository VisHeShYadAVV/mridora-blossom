import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import {
  Area,
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
import { clearDataCache, settingsFromRows, settingsToRows } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Area as PermArea } from "@/lib/permissions";
import type { RfqFieldKey, SiteSettings, SpecTemplate } from "@/lib/types";

export const Route = createFileRoute("/admin/settings")({ component: Page });

type Section = "general" | "content" | "forms" | "catalogue";
const AREA: Record<Section, PermArea> = {
  general: "company",
  content: "pages",
  forms: "enquiries",
  catalogue: "catalogue",
};
const LOCKED: RfqFieldKey[] = ["company", "country", "email"];

const splitList = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function Page() {
  const { can } = useAdmin();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void supabase!
      .from("site_settings")
      .select("key, value")
      .then(({ data, error: err }) => {
        if (err) setError(errorText(err));
        setS(settingsFromRows(data ?? []));
      });
  }, []);
  if (!s)
    return error ? (
      <Message kind="error">{error}</Message>
    ) : (
      <p className="text-muted-foreground">Loading…</p>
    );

  const save = async (section: Section) => {
    setError("");
    setNotice("");
    if (section === "general") {
      if (Object.values(s.social).some((u) => u && !/^https:\/\//.test(u)))
        return setError("Social links must start with https://");
      if (!/^https:\/\/[a-z0-9.-]+$/i.test(s.siteUrl))
        return setError(
          "The website address must look like https://www.example.com with nothing after the domain.",
        );
      if (s.whatsappNumber && !/^\+?[0-9 ]{8,16}$/.test(s.whatsappNumber))
        return setError("Enter the WhatsApp number with country code, digits only.");
      if (!/^\S+@\S+\.\S+$/.test(s.exportEmail) || !/^\S+@\S+\.\S+$/.test(s.generalEmail))
        return setError("Enter valid email addresses.");
    }
    if (section === "forms" && !(s.forms.maxUploadMb > 0 && s.forms.maxUploadMb <= 10))
      return setError(
        "The upload limit must be between 1 and 10 MB, the limit set on file storage.",
      );
    const { error: err } = await supabase!
      .from("site_settings")
      .upsert({ key: section, value: settingsToRows(s)[section] });
    if (err) return setError(errorText(err));
    clearDataCache();
    return setNotice("Saved. The live site updates within about a minute.");
  };

  const Card = ({
    title,
    section,
    children,
  }: {
    title: string;
    section: Section;
    children: ReactNode;
  }) => {
    if (!can(AREA[section], "edit")) return null;
    return (
      <section className="space-y-4 border border-border bg-card p-5">
        <h2 className="text-xl text-primary">{title}</h2>
        {children}
        <button type="button" onClick={() => void save(section)} className={btn}>
          Save {title.toLowerCase()}
        </button>
      </section>
    );
  };
  const company = (patch: Partial<SiteSettings["company"]>) =>
    setS({ ...s, company: { ...s.company, ...patch } });
  const social = (patch: Partial<SiteSettings["social"]>) =>
    setS({ ...s, social: { ...s.social, ...patch } });
  const forms = (patch: Partial<SiteSettings["forms"]>) =>
    setS({ ...s, forms: { ...s.forms, ...patch } });
  const catalogue = (patch: Partial<SiteSettings["catalogue"]>) =>
    setS({ ...s, catalogue: { ...s.catalogue, ...patch } });
  const setField = (
    key: RfqFieldKey,
    patch: Partial<SiteSettings["forms"]["fields"][RfqFieldKey]>,
  ) => forms({ fields: { ...s.forms.fields, [key]: { ...s.forms.fields[key], ...patch } } });
  const setTemplate = (i: number, patch: Partial<SpecTemplate>) =>
    catalogue({
      templates: s.catalogue.templates.map((t, k) => (k === i ? { ...t, ...patch } : t)),
    });

  // Cards are called as functions, not rendered as components, so inputs keep focus while typing.
  return (
    <>
      <Title>Website Settings</Title>
      <div className="space-y-5">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        <p className="text-sm text-muted-foreground">
          Page text and the homepage are edited under Pages. Colours, menus and the footer are under
          Design & Navigation.
        </p>
        {Card({
          title: "Brand & announcement",
          section: "content",
          children: (
            <>
              <Field
                label="Tagline"
                value={s.tagline}
                onChange={(v) => setS({ ...s, tagline: v })}
              />
              <Area
                label="Brand description"
                value={s.brandDescription}
                onChange={(v) => setS({ ...s, brandDescription: v })}
              />
              <Check
                label="Show announcement bar"
                checked={s.announcement.enabled}
                onChange={(v) => setS({ ...s, announcement: { ...s.announcement, enabled: v } })}
              />
              <Field
                label="Announcement text"
                value={s.announcement.text}
                onChange={(v) => setS({ ...s, announcement: { ...s.announcement, text: v } })}
              />
              <Field
                label="Announcement link"
                value={s.announcement.link}
                onChange={(v) => setS({ ...s, announcement: { ...s.announcement, link: v } })}
              />
            </>
          ),
        })}
        {Card({
          title: "Contact & company",
          section: "general",
          children: (
            <>
              <Field
                label="Website address"
                value={s.siteUrl}
                onChange={(v) => setS({ ...s, siteUrl: v.trim() })}
                hint="Used in canonical links and the sitemap. Pointing the domain itself is done with your hosting provider."
              />
              <Field
                label="Export enquiries email"
                type="email"
                value={s.exportEmail}
                onChange={(v) => setS({ ...s, exportEmail: v })}
              />
              <Field
                label="General enquiries email"
                type="email"
                value={s.generalEmail}
                onChange={(v) => setS({ ...s, generalEmail: v })}
              />
              <Field
                label="WhatsApp number"
                value={s.whatsappNumber}
                onChange={(v) => setS({ ...s, whatsappNumber: v })}
                hint="Country code and digits only. WhatsApp buttons cannot reach your desk until this is set."
              />
              <Area
                label="WhatsApp prefilled message"
                value={s.whatsappMessage}
                onChange={(v) => setS({ ...s, whatsappMessage: v })}
              />
              <div className="flex flex-wrap gap-5">
                <Check
                  label="Show floating WhatsApp button"
                  checked={s.showWhatsAppButton}
                  onChange={(v) => setS({ ...s, showWhatsAppButton: v })}
                />
                <Check
                  label="Show social icons in header"
                  checked={s.showSocialInHeader}
                  onChange={(v) => setS({ ...s, showSocialInHeader: v })}
                />
                <Check
                  label="Show email icon in header"
                  checked={s.showEmailInHeader}
                  onChange={(v) => setS({ ...s, showEmailInHeader: v })}
                />
              </div>
              <h3 className="pt-3 text-lg text-primary">Social links</h3>
              <p className="text-xs text-muted-foreground">
                An icon is only active when its link is filled in. Clear a link to disable it.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="LinkedIn URL"
                  value={s.social.linkedin}
                  onChange={(v) => social({ linkedin: v })}
                />
                <Field
                  label="Instagram URL"
                  value={s.social.instagram}
                  onChange={(v) => social({ instagram: v })}
                />
                <Field
                  label="Facebook URL"
                  value={s.social.facebook}
                  onChange={(v) => social({ facebook: v })}
                />
                <Field
                  label="YouTube URL"
                  value={s.social.youtube}
                  onChange={(v) => social({ youtube: v })}
                />
                <Field
                  label="Pinterest URL"
                  value={s.social.pinterest}
                  onChange={(v) => social({ pinterest: v })}
                />
                <Field
                  label="X (Twitter) URL"
                  value={s.social.x}
                  onChange={(v) => social({ x: v })}
                />
              </div>
              <h3 className="pt-3 text-lg text-primary">Company registration</h3>
              <p className="text-xs text-muted-foreground">
                Everything in this section is public. Enter only verified numbers approved for
                display.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Legal company name"
                  value={s.company.legalName}
                  onChange={(v) => company({ legalName: v })}
                />
                <Field
                  label="GSTIN"
                  value={s.company.gstin}
                  onChange={(v) => company({ gstin: v })}
                />
                <Field label="IEC" value={s.company.iec} onChange={(v) => company({ iec: v })} />
                <Field
                  label="LLPIN"
                  value={s.company.llpin}
                  onChange={(v) => company({ llpin: v })}
                />
                <Field
                  label="Udyam registration (if applicable)"
                  value={s.company.udyam}
                  onChange={(v) => company({ udyam: v })}
                />
                <Field
                  label="RCMC / EPCH membership (if obtained)"
                  value={s.company.epch}
                  onChange={(v) => company({ epch: v })}
                />
                <Field
                  label="PAN"
                  value={s.company.pan}
                  onChange={(v) => company({ pan: v })}
                  hint="Publicly readable even when not displayed. Enter only if approved for publication."
                />
                <Field
                  label="Country"
                  value={s.company.country}
                  onChange={(v) => company({ country: v })}
                />
              </div>
              <Check
                label="Display PAN"
                checked={s.company.showPan}
                onChange={(v) => company({ showPan: v })}
              />
              <Area
                label="Registered office address"
                value={s.company.address}
                onChange={(v) => company({ address: v })}
              />
            </>
          ),
        })}
        {Card({
          title: "Quote form",
          section: "forms",
          children: (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="p-2 font-normal">Field label</th>
                      <th className="p-2 font-normal">Show</th>
                      <th className="p-2 font-normal">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(s.forms.fields) as RfqFieldKey[]).map((key) => {
                      const locked = LOCKED.includes(key);
                      return (
                        <tr key={key} className="border-t border-border">
                          <td className="p-2">
                            <input
                              aria-label={`Label for ${key}`}
                              value={s.forms.fields[key].label}
                              onChange={(e) => setField(key, { label: e.target.value })}
                              className={`${input} mt-0`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="checkbox"
                              aria-label={`Show ${key}`}
                              disabled={locked}
                              checked={s.forms.fields[key].visible}
                              onChange={(e) => setField(key, { visible: e.target.checked })}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="checkbox"
                              aria-label={`Require ${key}`}
                              disabled={locked}
                              checked={s.forms.fields[key].required}
                              onChange={(e) => setField(key, { required: e.target.checked })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Company, country and email are always required so that every enquiry can be
                answered.
              </p>
              <Field
                label="Success heading"
                value={s.forms.successTitle}
                onChange={(v) => forms({ successTitle: v })}
              />
              <Area
                label="Success message"
                value={s.forms.successText}
                onChange={(v) => forms({ successText: v })}
              />
              <Field
                label="Attachment limit (MB)"
                type="number"
                value={String(s.forms.maxUploadMb)}
                onChange={(v) => forms({ maxUploadMb: Number(v) })}
              />
            </>
          ),
        })}
        {Card({
          title: "Catalogue options",
          section: "catalogue",
          children: (
            <>
              <Field
                label="Materials (comma separated)"
                value={s.catalogue.materials.join(", ")}
                onChange={(v) => catalogue({ materials: splitList(v) })}
                hint="Offered as suggestions when editing products."
              />
              <Field
                label="Finishes (comma separated)"
                value={s.catalogue.finishes.join(", ")}
                onChange={(v) => catalogue({ finishes: splitList(v) })}
              />
              <Field
                label="Colours (comma separated)"
                value={s.catalogue.colours.join(", ")}
                onChange={(v) => catalogue({ colours: splitList(v) })}
              />
              <h3 className="pt-3 text-lg text-primary">Specification templates</h3>
              <p className="text-xs text-muted-foreground">
                Extra specification rows that can be added to a product in one click.
              </p>
              {s.catalogue.templates.map((t, i) => (
                <div key={i} className="grid items-end gap-2 md:grid-cols-[1fr_2fr_auto]">
                  <Field
                    label="Template name"
                    value={t.name}
                    onChange={(v) => setTemplate(i, { name: v })}
                  />
                  <Field
                    label="Rows (comma separated)"
                    value={t.fields.join(", ")}
                    onChange={(v) => setTemplate(i, { fields: splitList(v) })}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      catalogue({ templates: s.catalogue.templates.filter((_, k) => k !== i) })
                    }
                    className={btnOutline}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  catalogue({
                    templates: [...s.catalogue.templates, { name: "New template", fields: [] }],
                  })
                }
                className={btnOutline}
              >
                Add template
              </button>
            </>
          ),
        })}
      </div>
    </>
  );
}
