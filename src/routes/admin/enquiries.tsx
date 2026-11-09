import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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
import { downloadCsv, toCsv } from "@/lib/csv";
import { rfqFromRow } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { RFQ_STATUSES, type Rfq, type RfqStatus } from "@/lib/types";

export const Route = createFileRoute("/admin/enquiries")({ component: Page });

const ACTIVITY_KINDS = ["note", "email", "call", "whatsapp", "meeting", "quotation"];

interface Activity {
  id: string;
  at: string;
  kind: string;
  body: string;
  author_email: string;
}

function Timeline({ rfqId, canEdit }: { rfqId: string; canEdit: boolean }) {
  const { email } = useAdmin();
  const [items, setItems] = useState<Activity[]>([]);
  const [kind, setKind] = useState("note");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    const { data, error: err } = await supabase!
      .from("rfq_activity")
      .select("*")
      .eq("rfq_id", rfqId)
      .order("at", { ascending: false });
    if (err) return setError(errorText(err));
    return setItems((data ?? []) as Activity[]);
  };
  useEffect(() => void load(), [rfqId]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = async () => {
    if (!body.trim()) return undefined;
    const { error: err } = await supabase!
      .from("rfq_activity")
      .insert({ rfq_id: rfqId, kind, body: body.trim(), author_email: email });
    if (err) return setError(errorText(err));
    setBody("");
    return load();
  };
  return (
    <div className="space-y-2 lg:col-span-2">
      <h3 className="text-lg text-primary">Communication history</h3>
      <Message kind="error">{error}</Message>
      {canEdit && (
        <div className="grid gap-2 md:grid-cols-[10rem_1fr_auto]">
          <select
            aria-label="Activity type"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={`${input} mt-0 capitalize`}
          >
            {ACTIVITY_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <input
            aria-label="Activity details"
            placeholder="What happened?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${input} mt-0`}
          />
          <button type="button" onClick={() => void add()} className={btnOutline}>
            Add to history
          </button>
        </div>
      )}
      <ul className="divide-y divide-border text-sm">
        {items.map((a) => (
          <li key={a.id} className="py-2">
            <span className="text-xs text-muted-foreground">
              {new Date(a.at).toLocaleString()} · <span className="capitalize">{a.kind}</span>
              {a.author_email && ` · ${a.author_email}`}
            </span>
            <p className="whitespace-pre-wrap">{a.body}</p>
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-2 text-xs text-muted-foreground">Nothing recorded yet.</li>
        )}
      </ul>
    </div>
  );
}

interface EmailSettings {
  recipients: string;
  ackEnabled: boolean;
  ackSubject: string;
  ackBody: string;
}
const DEFAULT_EMAIL: EmailSettings = {
  recipients: "",
  ackEnabled: true,
  ackSubject: "We received your enquiry | MRIDORA",
  ackBody:
    "Thank you for contacting MRIDORA. The export desk has received your enquiry and will reply by email.",
};

function EmailSettingsCard() {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<EmailSettings>(DEFAULT_EMAIL);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    void supabase!
      .from("private_settings")
      .select("value")
      .eq("key", "email")
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(errorText(err));
        if (data) setV({ ...DEFAULT_EMAIL, ...(data.value as Partial<EmailSettings>) });
      });
  }, []);
  const save = async () => {
    setError("");
    setNotice("");
    const bad = v.recipients
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r && !/^\S+@\S+\.\S+$/.test(r));
    if (bad.length) return setError(`Not a valid email address: ${bad.join(", ")}`);
    const { error: err } = await supabase!
      .from("private_settings")
      .upsert({ key: "email", value: v });
    if (err) return setError(errorText(err));
    return setNotice(
      "Saved. These take effect once enquiry emails are set up (see supabase/README.md).",
    );
  };
  return (
    <section className="border border-border bg-card p-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="text-xl text-primary"
      >
        Enquiry email settings
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <Message kind="error">{error}</Message>
          <Message kind="ok">{notice}</Message>
          <Field
            label="Notification recipients (comma separated)"
            value={v.recipients}
            onChange={(x) => setV({ ...v, recipients: x })}
            hint="Leave empty to use the export desk address."
          />
          <Check
            label="Send buyers an acknowledgement email"
            checked={v.ackEnabled}
            onChange={(x) => setV({ ...v, ackEnabled: x })}
          />
          <Field
            label="Acknowledgement subject"
            value={v.ackSubject}
            onChange={(x) => setV({ ...v, ackSubject: x })}
          />
          <Area
            label="Acknowledgement message"
            rows={4}
            value={v.ackBody}
            onChange={(x) => setV({ ...v, ackBody: x })}
          />
          <button type="button" onClick={() => void save()} className={btn}>
            Save email settings
          </button>
        </div>
      )}
    </section>
  );
}

function Page() {
  const { can } = useAdmin();
  const canEdit = can("enquiries", "edit");
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [collection, setCollection] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    void (async () => {
      const rows: unknown[] = [];
      for (let start = 0; ; start += 1000) {
        const { data, error: err } = await supabase!
          .from("rfqs")
          .select("*")
          .order("created_at", { ascending: false })
          .range(start, start + 999);
        if (err) {
          setError(errorText(err));
          break;
        }
        rows.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      setRfqs(rows.map(rfqFromRow));
      setLoading(false);
    })();
  }, []);

  const countries = useMemo(() => [...new Set(rfqs.map((r) => r.country))].sort(), [rfqs]);
  const collections = useMemo(
    () =>
      [
        ...new Set(
          rfqs.flatMap((r) => r.items.map((i) => i.sku.split("-")[1] ?? "").filter(Boolean)),
        ),
      ].sort(),
    [rfqs],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rfqs.filter((r) => {
      const day = r.createdAt.slice(0, 10);
      return (
        (!q ||
          [r.company, r.email, r.quoteReference, ...r.items.flatMap((i) => [i.name, i.sku])].some(
            (v) => v.toLowerCase().includes(q),
          )) &&
        (!status || r.status === status) &&
        (!country || r.country === country) &&
        (!collection || r.items.some((i) => i.sku.split("-")[1] === collection)) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
  }, [rfqs, query, status, country, collection, from, to]);

  const patch = (r: Rfq) => setRfqs((cur) => cur.map((x) => (x.id === r.id ? r : x)));

  const save = async (r: Rfq) => {
    setError("");
    setNotice("");
    const { error: err } = await supabase!
      .from("rfqs")
      .update({
        status: r.status,
        internal_notes: r.internalNotes,
        quote_reference: r.quoteReference,
        follow_up_date: r.followUpDate || null,
      })
      .eq("id", r.id);
    if (err) return setError(errorText(err));
    return setNotice(`Saved enquiry from ${r.company}.`);
  };

  const openAttachment = async (path: string) => {
    // Short-lived link: the bucket is private.
    const { data, error: err } = await supabase!.storage
      .from("rfq-attachments")
      .createSignedUrl(path, 60, { download: true });
    if (err || !data) return setError(errorText(err));
    window.location.href = data.signedUrl;
    return undefined;
  };

  const exportCsv = () => {
    const headers = [
      "Date",
      "Status",
      "Company",
      "Country",
      "Email",
      "Phone",
      "Products",
      "Material",
      "Colour/Finish",
      "Customization",
      "Packaging",
      "Destination",
      "Incoterm",
      "Message",
      "Quote Reference",
      "Follow-up",
      "Internal Notes",
    ];
    const rows = visible.map((r) => [
      r.createdAt,
      r.status,
      r.company,
      r.country,
      r.email,
      r.phone,
      r.items.map((i) => `${i.name}${i.sku ? ` [${i.sku}]` : ""}: ${i.quantity}`).join("; "),
      r.material,
      r.colourFinish,
      r.customization,
      r.packaging,
      r.destination,
      r.incoterm,
      r.message,
      r.quoteReference,
      r.followUpDate ?? "",
      r.internalNotes,
    ]);
    downloadCsv("mridora-enquiries.csv", toCsv(headers, rows));
  };

  return (
    <>
      <Title
        actions={
          can("enquiries", "export") ? (
            <button onClick={exportCsv} className={btnOutline}>
              Export CSV
            </button>
          ) : null
        }
      >
        Enquiries
      </Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        {canEdit && <EmailSettingsCard />}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <input
            aria-label="Search"
            placeholder="Company, email, SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={input}
          />
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${input} capitalize`}
          >
            <option value="">All statuses</option>
            {RFQ_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={input}
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Collection code"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className={input}
          >
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            aria-label="From date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={input}
          />
          <input
            aria-label="To date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={input}
          />
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          {loading ? "Loading…" : `${visible.length} enquiries`}
        </p>
        {visible.map((r) => (
          <article key={r.id} className="border border-border bg-card">
            <button
              onClick={() => setOpen(open === r.id ? "" : r.id)}
              aria-expanded={open === r.id}
              className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left"
            >
              <span>
                <span className="font-medium">{r.company}</span>{" "}
                <span className="text-sm text-muted-foreground">
                  · {r.country} · {r.items.length} products
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="mr-3 bg-accent px-2 py-1 capitalize text-accent-foreground">
                  {r.status}
                </span>
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </button>
            {open === r.id && (
              <div className="grid gap-6 border-t border-border p-4 lg:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p>
                    Email:{" "}
                    <a className="underline" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>
                  </p>
                  <p>Phone: {r.phone || "Not given"}</p>
                  <ul className="list-disc pl-5">
                    {r.items.map((i) => (
                      <li key={i.sku || i.name}>
                        {i.name} {i.sku && <span className="font-mono text-xs">{i.sku}</span>}:{" "}
                        {i.quantity || "quantity not given"}
                      </li>
                    ))}
                  </ul>
                  {(
                    [
                      ["Material", r.material],
                      ["Colour / Finish", r.colourFinish],
                      ["Customization", r.customization],
                      ["Packaging", r.packaging],
                      ["Destination", r.destination],
                      ["Incoterm", r.incoterm],
                      ["Message", r.message],
                    ] as const
                  )
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <p key={k} className="whitespace-pre-wrap">
                        <span className="text-muted-foreground">{k}:</span> {v}
                      </p>
                    ))}
                  {r.attachmentPath && (
                    <button
                      onClick={() => void openAttachment(r.attachmentPath!)}
                      className={btnOutline}
                    >
                      Download attachment
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm">
                    Status
                    <select
                      value={r.status}
                      onChange={(e) => patch({ ...r, status: e.target.value as RfqStatus })}
                      className={`${input} capitalize`}
                    >
                      {RFQ_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Quotation reference"
                    value={r.quoteReference}
                    onChange={(v) => patch({ ...r, quoteReference: v })}
                  />
                  <Field
                    label="Follow-up date"
                    type="date"
                    value={r.followUpDate ?? ""}
                    onChange={(v) => patch({ ...r, followUpDate: v || null })}
                  />
                  <Area
                    label="Internal notes"
                    rows={5}
                    value={r.internalNotes}
                    onChange={(v) => patch({ ...r, internalNotes: v })}
                  />
                  <button onClick={() => void save(r)} className={btn}>
                    Save
                  </button>
                </div>
                <Timeline rfqId={r.id} canEdit={canEdit} />
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
