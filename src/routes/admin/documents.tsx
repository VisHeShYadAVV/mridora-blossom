import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  btn,
  btnDanger,
  btnOutline,
  Check,
  errorText,
  Field,
  input,
  Message,
  Title,
  useAdmin,
} from "@/components/admin/ui";
import { clearDataCache } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/documents")({ component: Page });

const TYPES = [
  "Quality Certificate",
  "Product Test Report",
  "Company Profile",
  "PDF Catalogue",
  "Technical Specification",
  "Registration Certificate",
  "Other",
];
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_MB = 25;

interface Doc {
  id: string;
  title: string;
  doc_type: string;
  file_path: string;
  file_name: string;
  product_sku: string | null;
  expiry_date: string | null;
  is_public: boolean;
  status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  notes: string;
}

export function expiryState(date: string | null) {
  if (!date) return null;
  const days = Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: `Expired ${date}`, urgent: true };
  if (days <= 30) return { label: `Expires in ${days} day${days === 1 ? "" : "s"}`, urgent: true };
  return { label: `Expires ${date}`, urgent: false };
}

function Page() {
  const { can } = useAdmin();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(TYPES[0]!);
  const [sku, setSku] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const { data, error: err } = await supabase!
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) return setError(errorText(err));
    return setDocs((data ?? []) as Doc[]);
  };
  useEffect(() => void load(), []);

  const upload = async () => {
    setError("");
    setNotice("");
    if (!file || !title.trim()) return setError("Add a title and choose a file.");
    if (!ALLOWED.includes(file.type)) return setError("Upload a PDF, JPG, PNG or WebP file.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`The file is larger than ${MAX_MB} MB.`);
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${crypto.randomUUID()}.${ext}`;
      const up = await supabase!.storage.from("documents").upload(path, file);
      if (up.error) throw up.error;
      const { error: err } = await supabase!.from("documents").insert({
        title: title.trim(),
        doc_type: type,
        file_path: path,
        file_name: file.name,
        product_sku: sku.trim() || null,
        expiry_date: expiry || null,
        is_public: isPublic,
      });
      if (err) {
        // Don't leave an orphaned file behind if the record fails.
        await supabase!.storage.from("documents").remove([path]);
        throw err;
      }
      setTitle("");
      setSku("");
      setExpiry("");
      setIsPublic(false);
      setFile(null);
      setFileKey((k) => k + 1);
      setNotice("Uploaded. It stays hidden until it is approved.");
      await load();
    } catch (e) {
      setError(errorText(e));
    }
    return setBusy(false);
  };

  const update = async (doc: Doc, patch: Partial<Doc>, done: string) => {
    setError("");
    setNotice("");
    const { error: err } = await supabase!.from("documents").update(patch).eq("id", doc.id);
    if (err) return setError(errorText(err));
    clearDataCache();
    setNotice(done);
    return load();
  };
  const open = async (doc: Doc) => {
    const { data, error: err } = await supabase!.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 120);
    if (err || !data) return setError(errorText(err));
    window.open(data.signedUrl, "_blank", "noopener");
    return undefined;
  };
  const remove = async (doc: Doc) => {
    if (!window.confirm(`Delete ${doc.title}?`)) return undefined;
    const del = await supabase!.from("documents").delete().eq("id", doc.id);
    if (del.error) return setError(errorText(del.error));
    const file2 = await supabase!.storage.from("documents").remove([doc.file_path]);
    if (file2.error)
      setError(`The record was deleted, but the file was not: ${file2.error.message}`);
    clearDataCache();
    return load();
  };

  return (
    <>
      <Title>Compliance & Company Documents</Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        {can("documents", "edit") && (
          <section className="grid gap-3 border border-border bg-card p-4 md:grid-cols-3">
            <Field label="Title" value={title} onChange={setTitle} />
            <label className="block text-sm">
              Type
              <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <Field label="Product SKU (optional)" value={sku} onChange={setSku} />
            <Field label="Expiry date (optional)" type="date" value={expiry} onChange={setExpiry} />
            <label className="block text-sm">
              File (PDF or image, up to {MAX_MB} MB)
              <input
                key={fileKey}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={input}
              />
            </label>
            <div className="flex items-end">
              <Check
                label="Show on the public website once approved"
                checked={isPublic}
                onChange={setIsPublic}
              />
            </div>
            <div className="md:col-span-3">
              <button type="button" disabled={busy} onClick={() => void upload()} className={btn}>
                {busy ? "Uploading…" : "Upload document"}
              </button>
            </div>
          </section>
        )}
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-normal">Document</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal">Expiry</th>
                <th className="p-3 font-normal">Visibility</th>
                <th className="p-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => {
                const exp = expiryState(d.expiry_date);
                return (
                  <tr key={d.id} className="border-t border-border">
                    <td className="p-3">
                      {d.title}
                      <span className="block text-xs text-muted-foreground">
                        {d.doc_type}
                        {d.product_sku && ` · ${d.product_sku}`}
                      </span>
                    </td>
                    <td className="p-3 capitalize">{d.status}</td>
                    <td
                      className={`p-3 text-xs ${exp?.urgent ? "font-medium text-destructive" : ""}`}
                    >
                      {exp?.label ?? "None"}
                    </td>
                    <td className="p-3 text-xs">
                      {d.is_public ? "Public once approved" : "Staff only"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void open(d)} className={btnOutline}>
                          View
                        </button>
                        {can("documents", "publish") && d.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() =>
                              void update(d, { status: "approved" }, `Approved ${d.title}.`)
                            }
                            className={btn}
                          >
                            Approve
                          </button>
                        )}
                        {can("documents", "publish") && d.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() =>
                              void update(d, { status: "rejected" }, `Rejected ${d.title}.`)
                            }
                            className={btnOutline}
                          >
                            Reject
                          </button>
                        )}
                        {can("documents", "edit") && (
                          <button
                            type="button"
                            onClick={() =>
                              void update(d, { is_public: !d.is_public }, "Visibility updated.")
                            }
                            className={btnOutline}
                          >
                            {d.is_public ? "Make staff only" : "Make public"}
                          </button>
                        )}
                        {can("documents", "delete") && (
                          <button
                            type="button"
                            onClick={() => void remove(d)}
                            className={btnDanger}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No documents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
