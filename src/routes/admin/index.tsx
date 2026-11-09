import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { btn, errorText, Message, Title, useAdmin } from "@/components/admin/ui";
import { defaultCollections, defaultProducts, defaultSubcategories } from "@/data/catalog";
import { clearDataCache, collectionToRow, productToRow, subcategoryToRow } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { RFQ_STATUSES } from "@/lib/types";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const count = async (table: string, filter?: [string, string]) => {
  let q = supabase!.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count: n, error } = await q;
  if (error) throw error;
  return n ?? 0;
};

function Dashboard() {
  const { can } = useAdmin();
  const canCatalogue = can("catalogue", "edit");
  const canEnquiries = can("enquiries", "read");
  const canDocuments = can("documents", "read");
  const [alerts, setAlerts] = useState<string[]>([]);
  const [stats, setStats] = useState<[string, number][] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  const load = async () => {
    try {
      const out: [string, number][] = [];
      const all = await count("products");
      setTotal(all);
      out.push(
        ["Products", all],
        ["Active", await count("products", ["status", "active"])],
        ["Drafts", await count("products", ["status", "draft"])],
      );
      if (canEnquiries) {
        out.push(["Enquiries", await count("rfqs")]);
        for (const s of RFQ_STATUSES.slice(0, 3))
          out.push([`Enquiries: ${s}`, await count("rfqs", ["status", s])]);
      }
      setStats(out);
      const notes: string[] = [];
      if (canDocuments) {
        const soon = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
        const docs = await supabase!
          .from("documents")
          .select("title, expiry_date, status")
          .or(`status.eq.pending,expiry_date.lte.${soon}`);
        const today = new Date().toISOString().slice(0, 10);
        for (const d of docs.data ?? []) {
          if (d.expiry_date && d.expiry_date < today)
            notes.push(`Document expired: ${d.title} (${d.expiry_date})`);
          else if (d.expiry_date && d.expiry_date <= soon)
            notes.push(`Document expiring soon: ${d.title} (${d.expiry_date})`);
          if (d.status === "pending") notes.push(`Document awaiting approval: ${d.title}`);
        }
      }
      if (canEnquiries) {
        const today = new Date().toISOString().slice(0, 10);
        const due = await supabase!
          .from("rfqs")
          .select("company, follow_up_date")
          .lte("follow_up_date", today)
          .not("status", "in", "(won,lost,closed)");
        for (const r of due.data ?? [])
          notes.push(`Follow-up due: ${r.company} (${r.follow_up_date})`);
      }
      setAlerts(notes);
    } catch (e) {
      setError(errorText(e));
    }
  };
  useEffect(() => void load(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const importStarter = async () => {
    setBusy(true);
    setError("");
    try {
      const a = await supabase!
        .from("collections")
        .upsert(defaultCollections.map(collectionToRow), {
          onConflict: "code",
          ignoreDuplicates: true,
        });
      if (a.error) throw a.error;
      const b = await supabase!
        .from("subcategories")
        .upsert(defaultSubcategories.map(subcategoryToRow), {
          onConflict: "id",
          ignoreDuplicates: true,
        });
      if (b.error) throw b.error;
      const c = await supabase!
        .from("products")
        .upsert(defaultProducts.map(productToRow), { onConflict: "sku", ignoreDuplicates: true });
      if (c.error) throw c.error;
      clearDataCache();
      setNotice("Starter catalogue imported.");
      await load();
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };

  return (
    <>
      <Title>Dashboard</Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        {alerts.length > 0 && (
          <ul className="list-disc space-y-1 border border-gold bg-accent p-4 pl-8 text-sm">
            {alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        {canCatalogue && total === 0 && (
          <div className="border border-gold bg-card p-5">
            <h2 className="text-xl text-primary">The catalogue is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Import the 5 collections, 38 subcategories and marked sample listings. The public
              catalogue stays empty until you do.
            </p>
            <button disabled={busy} onClick={() => void importStarter()} className={`${btn} mt-4`}>
              {busy ? "Importing…" : "Import starter catalogue"}
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats?.map(([label, value]) => (
            <div key={label} className="border border-border bg-card p-5">
              <p className="text-xs capitalize tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-4xl text-primary">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Figures are counted live from the database. Visitor analytics are not shown here; connect
          Google Analytics under Website Settings and view them there.
        </p>
      </div>
    </>
  );
}
