import { supabase } from "@/lib/supabase";

export interface MediaAsset {
  id: string;
  path: string;
  url: string;
  name: string;
  folder: string;
  tags: string[];
  kind: string;
  mime: string;
  size_bytes: number;
  alt: string;
  created_at: string;
}

export const FOLDERS = [
  "general",
  "products",
  "collections",
  "branding",
  "videos",
  "catalogues",
  "specifications",
];
const MAX_EDGE = 2400;
const RASTER = new Set(["image/jpeg", "image/png", "image/webp"]);

const kindOf = (mime: string) =>
  mime.startsWith("image/")
    ? "image"
    : mime.startsWith("video/")
      ? "video"
      : mime === "application/pdf"
        ? "pdf"
        : "file";

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process the image."))),
      type,
      quality,
    ),
  );
}

/** Shrinks oversized photos and converts them to WebP. PNGs stay PNG only if WebP isn't smaller. */
export async function optimizeImage(file: File): Promise<File> {
  if (!RASTER.has(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await canvasToBlob(canvas, "image/webp", 0.86);
  // Browsers without WebP encoding silently return PNG; keep whichever is genuinely better.
  if (blob.type !== "image/webp" || (blob.size >= file.size && scale === 1)) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

export interface CropOptions {
  aspect: number;
  zoom: number;
  /** 0–1, where the crop window sits within the spare image area. */
  x: number;
  y: number;
}

export async function cropImage(url: string, name: string, o: CropOptions): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load the image to crop.");
  const bitmap = await createImageBitmap(await res.blob());
  const fit = Math.min(bitmap.width, bitmap.height * o.aspect);
  const w = fit / o.zoom;
  const h = w / o.aspect;
  const sx = (bitmap.width - w) * o.x;
  const sy = (bitmap.height - h) * o.y;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, w, h, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await canvasToBlob(canvas, "image/webp", 0.88);
  return new File([blob], name.replace(/\.[^.]+$/, "") + "-cropped.webp", { type: blob.type });
}

export async function uploadAsset(
  file: File,
  folder: string,
  tags: string[] = [],
): Promise<MediaAsset> {
  const prepared = file.type.startsWith("image/") ? await optimizeImage(file) : file;
  const ext = prepared.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase!.storage.from("media").upload(path, prepared, { cacheControl: "3600" });
  if (up.error) throw up.error;
  const url = supabase!.storage.from("media").getPublicUrl(path).data.publicUrl;
  const { data, error } = await supabase!
    .from("media_assets")
    .insert({
      path,
      url,
      name: file.name,
      folder,
      tags,
      kind: kindOf(prepared.type),
      mime: prepared.type,
      size_bytes: prepared.size,
    })
    .select()
    .single();
  if (error) throw error;
  return data as MediaAsset;
}

/** Swaps the file behind an asset, so every page using its address shows the new version. */
export async function replaceAsset(asset: MediaAsset, file: File) {
  if (file.type !== asset.mime && !(asset.kind === "image" && file.type.startsWith("image/"))) {
    throw new Error("Replace with a file of the same kind.");
  }
  const { error } = await supabase!.storage.from("media").upload(asset.path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: asset.mime === "image/webp" ? file.type : asset.mime,
  });
  if (error) throw error;
  const update = await supabase!
    .from("media_assets")
    .update({ size_bytes: file.size, name: file.name })
    .eq("id", asset.id);
  if (update.error) throw update.error;
}

export async function deleteAsset(asset: MediaAsset) {
  const removed = await supabase!.storage.from("media").remove([asset.path]);
  if (removed.error) throw removed.error;
  const { error } = await supabase!.from("media_assets").delete().eq("id", asset.id);
  if (error) throw error;
}
