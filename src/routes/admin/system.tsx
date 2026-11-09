import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  Area,
  btn,
  btnOutline,
  Check,
  errorText,
  Field,
  Message,
  Title,
  useAdmin,
} from "@/components/admin/ui";
import { clearDataCache, settingsFromRows, settingsToRows } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/lib/types";

export const Route = createFileRoute("/admin/system")({ component: Page });

// Restored in this order so that references (e.g. products to subcategories) resolve.
const TABLES: [string, string][] = [
  ["site_settings", "key"],
  ["collections", "code"],
  ["subcategories", "id"],
  ["products", "sku"],
  ["page_drafts", "slug"],
  ["section_templates", "id"],
  ["redirects", "id"],
];
const EXPORT_ONLY = ["rfqs", "rfq_activity", "documents", "media_assets"];

async function fetchAll(table: string) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase!
      .from(table)
      .select("*")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

function Page() {
  const { can } = useAdmin();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canEdit = can("technical", "edit");

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
  const t = s.technical;
  const set = (patch: Partial<SiteSettings["technical"]>) =>
    setS({ ...s, technical: { ...t, ...patch } });

  const save = async () => {
    setError("");
    setNotice("");
    if (!(t.sessionTimeoutMinutes >= 5 && t.sessionTimeoutMinutes <= 480))
      return setError("Session timeout must be between 5 and 480 minutes.");
    if (
      t.maintenance &&
      !window.confirm("Turn on maintenance mode? Visitors won't be able to see the website.")
    )
      return undefined;
    const { error: err } = await supabase!
      .from("site_settings")
      .upsert({ key: "technical", value: settingsToRows(s).technical });
    if (err) return setError(errorText(err));
    clearDataCache();
    return setNotice("Saved. The live site updates within about a minute.");
  };

  const backup = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const out: Record<string, unknown> = { createdAt: new Date().toISOString(), version: 1 };
      for (const table of [...TABLES.map(([name]) => name), ...EXPORT_ONLY]) {
        try {
          out[table] = await fetchAll(table);
        } catch {
          // Tables this account can't read are left out; the note below says so.
          out[table] = null;
        }
      }
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(out, null, 1)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `mridora-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(
        "Backup downloaded. It contains buyer data, so store it securely. Uploaded files aren't included.",
      );
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setNotice("");
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(await file.text()) as Record<string, unknown>;
      if (data["version"] !== 1) throw new Error("wrong version");
    } catch {
      return setError("This isn't a valid MRIDORA backup file.");
    }
    if (
      !window.confirm(
        `Restore settings, catalogue and page drafts from the backup made ${String(data["createdAt"])}? Matching records will be overwritten. Enquiries are not changed.`,
      )
    )
      return undefined;
    setBusy(true);
    try {
      const done: string[] = [];
      for (const [table, key] of TABLES) {
        const rows = data[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        for (let i = 0; i < rows.length; i += 500) {
          const { error: err } = await supabase!
            .from(table)
            .upsert(rows.slice(i, i + 500), { onConflict: key });
          if (err) throw new Error(`${table}: ${err.message}`);
        }
        done.push(`${table} (${rows.length})`);
      }
      clearDataCache();
      setNotice(
        `Restored ${done.join(", ")}. Publish restored page drafts from Pages to make them live.`,
      );
    } catch (e) {
      setError(`Restore stopped partway: ${errorText(e)}`);
    }
    return setBusy(false);
  };

  return (
    <>
      <Title>System</Title>
      <div className="max-w-3xl space-y-5">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        <section className="space-y-4 border border-border bg-card p-5">
          <h2 className="text-xl text-primary">Website behaviour</h2>
          <Check
            label="Maintenance mode (visitors see the message below; the admin panel keeps working)"
            checked={t.maintenance}
            disabled={!canEdit}
            onChange={(v) => set({ maintenance: v })}
          />
          <Area
            label="Maintenance message"
            value={t.maintenanceMessage}
            disabled={!canEdit}
            onChange={(v) => set({ maintenanceMessage: v })}
          />
          <Field
            label="404 page heading"
            value={t.notFoundTitle}
            disabled={!canEdit}
            onChange={(v) => set({ notFoundTitle: v })}
          />
          <Area
            label="404 page text"
            value={t.notFoundText}
            disabled={!canEdit}
            onChange={(v) => set({ notFoundText: v })}
          />
          <Check
            label="Ask for cookie consent before running analytics"
            checked={t.cookieBanner}
            disabled={!canEdit}
            onChange={(v) => set({ cookieBanner: v })}
          />
          <Area
            label="Cookie message"
            value={t.cookieText}
            disabled={!canEdit}
            onChange={(v) => set({ cookieText: v })}
          />
          <Field
            label="Admin session timeout (minutes of inactivity)"
            type="number"
            value={String(t.sessionTimeoutMinutes)}
            disabled={!canEdit}
            onChange={(v) => set({ sessionTimeoutMinutes: Number(v) })}
          />
          {canEdit && (
            <button type="button" onClick={() => void save()} className={btn}>
              Save
            </button>
          )}
        </section>
        <section className="space-y-3 border border-border bg-card p-5">
          <h2 className="text-xl text-primary">Backup & data export</h2>
          <p className="text-sm text-muted-foreground">
            Downloads your settings, catalogue, pages, redirects and enquiries as one file. Uploaded
            images and documents stay in file storage and aren't included. Scheduled automatic
            backups are a feature of your Supabase plan.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void backup()} className={btn}>
              {busy ? "Working…" : "Download backup"}
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className={btnOutline}
                >
                  Restore from backup
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  aria-label="Backup file"
                  onChange={(e) => {
                    void restore(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        </section>
        <section className="space-y-2 border border-border bg-card p-5">
          <h2 className="text-xl text-primary">Cache</h2>
          <p className="text-sm text-muted-foreground">
            Website content refreshes automatically within about 30 seconds of a change. Replaced
            media files can stay in browser caches for up to an hour.
          </p>
        </section>
      </div>
    </>
  );
}
