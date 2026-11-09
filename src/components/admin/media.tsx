import { useEffect, useState } from "react";

import { btn, btnOutline, errorText, input, Message, useAdmin } from "@/components/admin/ui";
import { cropImage, uploadAsset, type MediaAsset } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export function MediaPicker({
  kind,
  folder,
  onPick,
  onClose,
}: {
  kind: "image" | "video" | "pdf";
  folder: string;
  onPick: (url: string, asset: MediaAsset) => void;
  onClose: () => void;
}) {
  const { can } = useAdmin();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase!
      .from("media_assets")
      .select("*")
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error: err }) => {
        if (err) setError(errorText(err));
        setAssets((data ?? []) as MediaAsset[]);
      });
  }, [kind]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const asset = await uploadAsset(file, folder);
      onPick(asset.url, asset);
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };
  const q = query.trim().toLowerCase();
  const visible = assets.filter(
    (a) =>
      !q || a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)),
  );
  return (
    <div
      role="dialog"
      aria-label="Media library"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl text-primary">Choose a file</h2>
          <button type="button" onClick={onClose} className={btnOutline}>
            Close
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            aria-label="Search media"
            placeholder="Search name or tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={input}
          />
          {can("media", "edit") && (
            <input
              aria-label="Upload new file"
              type="file"
              disabled={busy}
              accept={
                kind === "image"
                  ? "image/jpeg,image/png,image/webp,image/avif"
                  : kind === "video"
                    ? "video/mp4"
                    : "application/pdf"
              }
              onChange={(e) => void upload(e.target.files?.[0])}
              className={input}
            />
          )}
        </div>
        <div className="mt-3">
          <Message kind="error">{error}</Message>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {visible.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.url, a)}
              className="border border-border p-1 text-left hover:border-gold"
            >
              {a.kind === "image" ? (
                <img
                  src={a.url}
                  alt=""
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
      </div>
    </div>
  );
}

/** An image, video or PDF field that takes an address or a pick from the media library. */
export function MediaField({
  label,
  value,
  onChange,
  kind = "image",
  folder = "general",
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "video" | "pdf";
  folder?: string;
  hint?: string;
}) {
  const { can } = useAdmin();
  const [open, setOpen] = useState(false);
  return (
    <div className="text-sm">
      <label className="block">
        {label}
        <input value={value} onChange={(e) => onChange(e.target.value)} className={input} />
      </label>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex items-center gap-3">
        {kind === "image" && value && <img src={value} alt="" className="h-14 w-20 object-cover" />}
        {can("media", "read") && (
          <button type="button" onClick={() => setOpen(true)} className={btnOutline}>
            Media library
          </button>
        )}
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-xs underline">
            Clear
          </button>
        )}
      </div>
      {open && (
        <MediaPicker
          kind={kind}
          folder={folder}
          onClose={() => setOpen(false)}
          onPick={(url) => {
            onChange(url);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

const ASPECTS = [
  ["Square", 1],
  ["4:3", 4 / 3],
  ["3:2", 3 / 2],
  ["16:9", 16 / 9],
] as const;

export function ImageCropper({
  url,
  name,
  folder,
  onDone,
  onClose,
}: {
  url: string;
  name: string;
  folder: string;
  onDone: (asset: MediaAsset) => void;
  onClose: () => void;
}) {
  const [aspect, setAspect] = useState<number>(1);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.5);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    setBusy(true);
    setError("");
    try {
      const file = await cropImage(url, name, { aspect, zoom, x, y });
      onDone(await uploadAsset(file, folder));
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };
  return (
    <div
      role="dialog"
      aria-label="Crop image"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-card p-5">
        <h2 className="text-2xl text-primary">Crop image</h2>
        <div className="mt-4 overflow-hidden bg-muted" style={{ aspectRatio: aspect }}>
          <img
            src={url}
            alt="Crop preview"
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${x * 100}% ${y * 100}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${x * 100}% ${y * 100}%`,
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {ASPECTS.map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => setAspect(value)}
              aria-pressed={aspect === value}
              className={`${btnOutline} ${aspect === value ? "border-primary" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        {(
          [
            ["Zoom", zoom, setZoom, 1, 3, 0.05],
            ["Left to right", x, setX, 0, 1, 0.01],
            ["Top to bottom", y, setY, 0, 1, 0.01],
          ] as const
        ).map(([label, value, set, min, max, step]) => (
          <label key={label} className="mt-3 block text-sm">
            {label}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        ))}
        <div className="mt-3">
          <Message kind="error">{error}</Message>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The cropped image is saved as a new file. The original is kept.
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={busy} onClick={() => void apply()} className={btn}>
            {busy ? "Saving…" : "Save crop"}
          </button>
          <button type="button" onClick={onClose} className={btnOutline}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
