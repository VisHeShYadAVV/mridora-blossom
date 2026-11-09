import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { ImageCropper } from "@/components/admin/media";
import {
  btn,
  btnDanger,
  btnOutline,
  errorText,
  Field,
  input,
  Message,
  Title,
  useAdmin,
} from "@/components/admin/ui";
import { deleteAsset, FOLDERS, replaceAsset, uploadAsset, type MediaAsset } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/media")({ component: Page });

const MAX_FILE_MB = 20;
const formatSize = (bytes: number) =>
  bytes > 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function Page() {
  const { can } = useAdmin();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [kind, setKind] = useState("");
  const [uploadFolder, setUploadFolder] = useState("general");
  const [tags, setTags] = useState("");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [crop, setCrop] = useState<MediaAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const replaceInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error: err } = await supabase!
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (err) return setError(errorText(err));
    return setAssets((data ?? []) as MediaAsset[]);
  };
  useEffect(() => void load(), []);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    setNotice("");
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const failures: string[] = [];
    let done = 0;
    for (const file of files) {
      try {
        if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`larger than ${MAX_FILE_MB} MB`);
        await uploadAsset(file, uploadFolder, tagList);
        done++;
      } catch (e) {
        failures.push(`${file.name}: ${errorText(e)}`);
      }
    }
    if (failures.length) setError(failures.join("\n"));
    if (done) setNotice(`Uploaded ${done} file${done === 1 ? "" : "s"}.`);
    await load();
    setBusy(false);
  };

  const saveDetails = async () => {
    if (!selected) return;
    const { error: err } = await supabase!
      .from("media_assets")
      .update({
        alt: selected.alt,
        tags: selected.tags,
        folder: selected.folder,
        name: selected.name,
      })
      .eq("id", selected.id);
    if (err) return setError(errorText(err));
    setNotice("Details saved.");
    return load();
  };
  const remove = async (asset: MediaAsset) => {
    if (!window.confirm(`Delete ${asset.name}? Any page still using it will show a broken image.`))
      return;
    try {
      await deleteAsset(asset);
      setSelected(null);
      setNotice("File deleted.");
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const replace = async (file: File | undefined) => {
    if (!file || !selected) return;
    try {
      await replaceAsset(selected, file);
      setNotice("File replaced. Browsers may show the old version for up to an hour.");
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  };

  const q = query.trim().toLowerCase();
  const visible = assets.filter(
    (a) =>
      (!folder || a.folder === folder) &&
      (!kind || a.kind === kind) &&
      (!q || a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q))),
  );

  return (
    <>
      <Title>Media Library</Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        {can("media", "edit") && (
          <section className="grid gap-3 border border-border bg-card p-4 md:grid-cols-3">
            <label className="block text-sm">
              Upload to folder
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className={input}
              >
                {FOLDERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <Field label="Tags (comma separated)" value={tags} onChange={setTags} />
            <label className="block text-sm">
              Files
              <input
                type="file"
                multiple
                disabled={busy}
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,application/pdf"
                onChange={(e) => {
                  void upload(e.target.files);
                  e.target.value = "";
                }}
                className={input}
              />
            </label>
            <p className="text-xs text-muted-foreground md:col-span-3">
              Photos are resized to at most 2400px and converted to WebP. Up to {MAX_FILE_MB} MB per
              file. These files are public; use Documents for private files.
            </p>
          </section>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            aria-label="Search media"
            placeholder="Search name or tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={input}
          />
          <select
            aria-label="Folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className={input}
          >
            <option value="">All folders</option>
            {FOLDERS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <select
            aria-label="Type"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={input}
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="pdf">PDFs</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {visible.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              aria-pressed={selected?.id === a.id}
              className={`border bg-card p-1 text-left ${selected?.id === a.id ? "border-gold" : "border-border"}`}
            >
              {a.kind === "image" ? (
                <img
                  src={a.url}
                  alt={a.alt}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <span className="flex aspect-square items-center justify-center bg-muted text-xs uppercase">
                  {a.kind}
                </span>
              )}
              <span className="mt-1 block truncate text-xs">{a.name}</span>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No files found.
            </p>
          )}
        </div>
        {selected && (
          <section className="space-y-3 border border-border bg-card p-4">
            <h2 className="text-xl text-primary">{selected.name}</h2>
            <p className="break-all font-mono text-xs">{selected.url}</p>
            <p className="text-xs text-muted-foreground">
              {selected.mime} · {formatSize(selected.size_bytes)}
            </p>
            {can("media", "edit") ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field
                    label="Name"
                    value={selected.name}
                    onChange={(v) => setSelected({ ...selected, name: v })}
                  />
                  <Field
                    label="Description (alt text)"
                    value={selected.alt}
                    onChange={(v) => setSelected({ ...selected, alt: v })}
                  />
                  <Field
                    label="Tags"
                    value={selected.tags.join(", ")}
                    onChange={(v) =>
                      setSelected({ ...selected, tags: v.split(",").map((t) => t.trim()) })
                    }
                  />
                  <label className="block text-sm">
                    Folder
                    <select
                      value={selected.folder}
                      onChange={(e) => setSelected({ ...selected, folder: e.target.value })}
                      className={input}
                    >
                      {FOLDERS.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void saveDetails()} className={btn}>
                    Save details
                  </button>
                  {selected.kind === "image" && (
                    <button type="button" onClick={() => setCrop(selected)} className={btnOutline}>
                      Crop
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => replaceInput.current?.click()}
                    className={btnOutline}
                  >
                    Replace file
                  </button>
                  <input
                    ref={replaceInput}
                    type="file"
                    hidden
                    aria-label="Replacement file"
                    onChange={(e) => {
                      void replace(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  {can("media", "delete") && (
                    <button
                      type="button"
                      onClick={() => void remove(selected)}
                      className={btnDanger}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>
      {crop && (
        <ImageCropper
          url={crop.url}
          name={crop.name}
          folder={crop.folder}
          onClose={() => setCrop(null)}
          onDone={() => {
            setCrop(null);
            setNotice("Cropped copy saved.");
            void load();
          }}
        />
      )}
    </>
  );
}
