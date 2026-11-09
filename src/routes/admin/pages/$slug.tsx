import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { History } from "@/components/admin/History";
import { MediaField } from "@/components/admin/media";
import { SeoPreview, seoIssues } from "@/components/admin/SeoPreview";
import {
  Area,
  btn,
  btnDanger,
  btnOutline,
  Check,
  errorText,
  Field,
  input,
  Message,
  useAdmin,
} from "@/components/admin/ui";
import { defaultPages } from "@/data/pages";
import { BLOCKS, list, newBlockId, str, type BlockField } from "@/lib/blocks";
import { clearDataCache, pageFromRow, pageToDraftRow } from "@/lib/data";
import { designCss } from "@/lib/design";
import { absoluteUrl } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import type { Block, BlockType, CmsPage } from "@/lib/types";
import { useSite } from "@/lib/use-site";

export const Route = createFileRoute("/admin/pages/$slug")({ component: Editor });

const WIDTHS = { Desktop: "100%", Tablet: "768px", Mobile: "390px" } as const;
type Device = keyof typeof WIDTHS;

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: BlockField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
      return (
        <Field
          label={field.label}
          value={str(value)}
          onChange={onChange}
          {...(field.hint ? { hint: field.hint } : {})}
        />
      );
    case "textarea":
      return (
        <Area
          label={field.label}
          value={str(value)}
          onChange={onChange}
          {...(field.hint ? { hint: field.hint } : {})}
        />
      );
    case "image":
      return <MediaField label={field.label} value={str(value)} onChange={onChange} />;
    case "video":
      return (
        <MediaField
          label={field.label}
          value={str(value)}
          onChange={onChange}
          kind="video"
          folder="videos"
        />
      );
    case "select":
      return (
        <label className="block text-sm">
          {field.label}
          <select value={str(value)} onChange={(e) => onChange(e.target.value)} className={input}>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "list": {
      const items = list(value);
      const set = (next: Record<string, unknown>[]) => onChange(next);
      const move = (i: number, dir: number) => {
        const next = [...items];
        const [item] = next.splice(i, 1);
        next.splice(i + dir, 0, item!);
        set(next);
      };
      return (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{field.label}</legend>
          {items.map((item, i) => (
            <div key={i} className="space-y-3 border border-border p-3">
              {field.itemFields?.map((sub) => (
                <FieldEditor
                  key={sub.key}
                  field={sub}
                  value={item[sub.key]}
                  onChange={(v) =>
                    set(items.map((it, k) => (k === i ? { ...it, [sub.key]: v } : it)))
                  }
                />
              ))}
              <div className="flex flex-wrap gap-2">
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
                  onClick={() => set(items.filter((_, k) => k !== i))}
                  className={btnDanger}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => set([...items, {}])} className={btnOutline}>
            Add item
          </button>
        </fieldset>
      );
    }
    default:
      return null;
  }
}

interface Template {
  id: string;
  name: string;
  section: Block;
}

const blockSummary = (b: Block) =>
  str(b.data["heading"]) || str(b.data["title"]) || str(b.data["text"]).slice(0, 40);

function Editor() {
  const { slug } = Route.useParams();
  const { can } = useAdmin();
  const { settings } = useSite();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [publishAt, setPublishAt] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState("");
  const [device, setDevice] = useState<Device>("Desktop");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newType, setNewType] = useState<string>("richText");
  const [scheduleAt, setScheduleAt] = useState("");
  const [saveCount, setSaveCount] = useState(0);
  const dragIndex = useRef<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const canEdit = can("pages", "edit");
  const canPublish = can("pages", "publish");

  useEffect(() => {
    void (async () => {
      const [draft, live, tpl] = await Promise.all([
        supabase!.from("page_drafts").select("*").eq("slug", slug).maybeSingle(),
        supabase!.from("pages").select("*").eq("slug", slug).maybeSingle(),
        supabase!.from("section_templates").select("*").order("name"),
      ]);
      const err = draft.error ?? live.error;
      if (err) return setError(errorText(err));
      setTemplates((tpl.data ?? []) as Template[]);
      setIsLive(Boolean(live.data?.published));
      setPublishAt((draft.data?.publish_at as string | null) ?? null);
      const fallback = defaultPages.find((p) => p.slug === slug);
      const source = draft.data
        ? pageFromRow(draft.data)
        : live.data?.published
          ? pageFromRow(live.data)
          : (fallback ?? null);
      if (!source) return setError("Page not found.");
      return setPage(source);
    })();
  }, [slug]);

  const css = designCss(settings.design);
  const postToPreview = useCallback(() => {
    if (!page) return;
    frame.current?.contentWindow?.postMessage(
      { type: "mridora-preview", sections: page.sections, css },
      window.location.origin,
    );
  }, [page, css]);

  useEffect(() => {
    postToPreview();
  }, [postToPreview]);
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

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!page)
    return error ? (
      <Message kind="error">{error}</Message>
    ) : (
      <p className="text-muted-foreground">Loading…</p>
    );

  const update = (patch: Partial<CmsPage>) => {
    setPage({ ...page, ...patch });
    setDirty(true);
  };
  const setSections = (sections: Block[]) => update({ sections });
  const patchBlock = (id: string, patch: Partial<Block>) =>
    setSections(page.sections.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= page.sections.length) return;
    const next = [...page.sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setSections(next);
  };
  const duplicateBlock = (i: number) => {
    const next = [...page.sections];
    next.splice(i + 1, 0, { ...structuredClone(page.sections[i]!), id: newBlockId() });
    setSections(next);
  };
  const addBlock = () => {
    const tpl = templates.find((t) => t.id === newType);
    const block: Block = tpl
      ? { ...structuredClone(tpl.section), id: newBlockId() }
      : {
          id: newBlockId(),
          type: newType as BlockType,
          data: structuredClone(BLOCKS[newType as BlockType].defaults),
        };
    setSections([...page.sections, block]);
    setOpen(block.id);
  };
  const saveTemplate = async (block: Block) => {
    const name = window.prompt("Name for this reusable section")?.trim();
    if (!name) return;
    const { data, error: err } = await supabase!
      .from("section_templates")
      .insert({ name, section: block })
      .select()
      .single();
    if (err) return setError(errorText(err));
    setTemplates([...templates, data as Template]);
    setNotice(`Saved "${name}" as a reusable section.`);
  };

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setNotice(await fn());
      clearDataCache();
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };
  const saveDraft = async () => {
    const { error: err } = await supabase!.from("page_drafts").upsert(pageToDraftRow(page));
    if (err) throw err;
    setDirty(false);
    setSaveCount((n) => n + 1);
  };
  const onSave = () =>
    run(async () => {
      await saveDraft();
      return "Draft saved. It isn't live until you publish.";
    });
  const onPublish = () =>
    run(async () => {
      await saveDraft();
      const { error: err } = await supabase!.rpc("publish_page", { p_slug: slug });
      if (err) throw err;
      setIsLive(true);
      setPublishAt(null);
      return "Published. The live site updates within about a minute.";
    });
  const onSchedule = () =>
    run(async () => {
      const when = new Date(scheduleAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now())
        throw new Error("Choose a future date and time.");
      await saveDraft();
      const { error: err } = await supabase!.rpc("schedule_page", {
        p_slug: slug,
        p_at: when.toISOString(),
      });
      if (err) throw err;
      setPublishAt(when.toISOString());
      return `Scheduled for ${when.toLocaleString()}.`;
    });
  const onCancelSchedule = () =>
    run(async () => {
      const { error: err } = await supabase!.rpc("schedule_page", { p_slug: slug, p_at: null });
      if (err) throw err;
      setPublishAt(null);
      return "Schedule cancelled.";
    });
  const onUnpublish = () => {
    if (!window.confirm("Take this page off the live site? Your draft is kept.")) return;
    void run(async () => {
      // Keep the content recoverable before the live copy is cleared.
      await saveDraft();
      const { error: err } = await supabase!.rpc("unpublish_page", { p_slug: slug });
      if (err) throw err;
      setIsLive(false);
      setPublishAt(null);
      return "Page removed from the live site.";
    });
  };
  const restore = (row: Record<string, unknown>) => {
    setPage({ ...pageFromRow({ ...row, published: page.published }), slug });
    setDirty(true);
    setNotice("Version loaded into the editor. Save or publish to keep it.");
  };

  const path = slug === "home" ? "/" : `/${slug}`;
  const issues = seoIssues(page.seoTitle, page.seoDescription);
  const addOptions = Object.entries(BLOCKS) as [BlockType, (typeof BLOCKS)[BlockType]][];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/pages" className="text-xs underline">
            All pages
          </Link>
          <h1 className="text-3xl text-primary">{page.title}</h1>
          <p className="text-xs text-muted-foreground">
            {isLive ? "Live" : "Not published from admin"}
            {dirty && " · unsaved changes"}
            {publishAt && ` · scheduled ${new Date(publishAt).toLocaleString()}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSave()}
              className={btnOutline}
            >
              <Save className="h-4 w-4" aria-hidden /> Save draft
            </button>
          )}
          {canPublish && (
            <button type="button" disabled={busy} onClick={() => void onPublish()} className={btn}>
              Publish
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(22rem,1fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-4">
          <section className="space-y-2 border border-border bg-card p-4">
            <h2 className="text-xl text-primary">Sections</h2>
            <ol className="space-y-2">
              {page.sections.map((b, i) => (
                <li
                  key={b.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex.current !== null) moveBlock(dragIndex.current, i);
                    dragIndex.current = null;
                  }}
                  className={`border border-border ${b.hidden ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-1 p-2">
                    <span
                      draggable
                      onDragStart={() => (dragIndex.current = i)}
                      title="Drag to reorder"
                      className="cursor-grab p-1 text-muted-foreground"
                    >
                      <GripVertical className="h-4 w-4" aria-hidden />
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpen(open === b.id ? "" : b.id)}
                      aria-expanded={open === b.id}
                      className="min-w-0 flex-1 truncate text-left text-sm"
                    >
                      <span className="font-medium">{BLOCKS[b.type]?.label ?? b.type}</span>
                      {blockSummary(b) && (
                        <span className="text-muted-foreground"> · {blockSummary(b)}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => moveBlock(i, i - 1)}
                      className="p-1 disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={i === page.sections.length - 1}
                      onClick={() => moveBlock(i, i + 1)}
                      className="p-1 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Duplicate section"
                      onClick={() => duplicateBlock(i)}
                      className="p-1"
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={b.hidden ? "Show section" : "Hide section"}
                      onClick={() => patchBlock(b.id, { hidden: !b.hidden })}
                      className="p-1"
                    >
                      {b.hidden ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete section"
                      onClick={() => {
                        if (window.confirm("Delete this section?"))
                          setSections(page.sections.filter((x) => x.id !== b.id));
                      }}
                      className="p-1 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  {open === b.id && (
                    <div className="space-y-3 border-t border-border p-3">
                      {BLOCKS[b.type]?.fields.map((f) => (
                        <FieldEditor
                          key={f.key}
                          field={f}
                          value={b.data[f.key]}
                          onChange={(v) => patchBlock(b.id, { data: { ...b.data, [f.key]: v } })}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => void saveTemplate(b)}
                        className={btnOutline}
                      >
                        Save as reusable section
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 pt-2">
              <select
                aria-label="Section type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className={`${input} mt-0 max-w-64`}
              >
                {addOptions.map(([type, def]) => (
                  <option key={type} value={type}>
                    {def.label}
                  </option>
                ))}
                {templates.length > 0 && (
                  <optgroup label="Reusable sections">
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button type="button" onClick={addBlock} className={btnOutline}>
                Add section
              </button>
            </div>
          </section>

          <section className="space-y-3 border border-border bg-card p-4">
            <h2 className="text-xl text-primary">Page details & SEO</h2>
            <Field label="Page name" value={page.title} onChange={(v) => update({ title: v })} />
            <Field
              label="SEO title"
              value={page.seoTitle}
              onChange={(v) => update({ seoTitle: v })}
            />
            <Area
              label="Meta description"
              value={page.seoDescription}
              onChange={(v) => update({ seoDescription: v })}
            />
            {issues.length > 0 && <p className="text-xs text-destructive">{issues.join(" · ")}</p>}
            <Field
              label="Canonical address (optional)"
              value={page.canonical}
              onChange={(v) => update({ canonical: v })}
            />
            <MediaField
              label="Social sharing image"
              value={page.ogImage}
              onChange={(v) => update({ ogImage: v })}
            />
            <Check
              label="Hide from search engines"
              checked={page.noindex}
              onChange={(v) => update({ noindex: v })}
            />
            <SeoPreview
              title={page.seoTitle}
              description={page.seoDescription}
              url={absoluteUrl(path)}
              image={page.ogImage || settings.seo.defaultOgImage}
            />
          </section>

          {canPublish && (
            <section className="space-y-3 border border-border bg-card p-4">
              <h2 className="text-xl text-primary">Publishing</h2>
              <label className="block text-sm">
                Publish automatically at
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className={input}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !scheduleAt}
                  onClick={() => void onSchedule()}
                  className={btnOutline}
                >
                  Schedule
                </button>
                {publishAt && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onCancelSchedule()}
                    className={btnOutline}
                  >
                    Cancel schedule
                  </button>
                )}
                {slug !== "home" && (
                  <button type="button" disabled={busy} onClick={onUnpublish} className={btnDanger}>
                    Unpublish
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled changes go live the next time the site refreshes after that time, usually
                within a minute of a visit.
              </p>
            </section>
          )}

          <History entity="page_drafts" id={slug} onRestore={restore} refreshKey={saveCount} />
        </div>

        <section className="min-w-0 self-start border border-border bg-card p-4 xl:sticky xl:top-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl text-primary">Live preview</h2>
            <div className="flex gap-1" role="group" aria-label="Preview size">
              {(Object.keys(WIDTHS) as Device[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  onClick={() => setDevice(d)}
                  className={`${btnOutline} ${device === d ? "border-primary" : ""}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 overflow-x-auto bg-stone">
            <iframe
              ref={frame}
              src="/admin-preview"
              title="Page preview"
              onLoad={postToPreview}
              className="mx-auto block h-[calc(100vh-7rem)] border-0 bg-background"
              style={{ width: WIDTHS[device], maxWidth: device === "Desktop" ? "100%" : undefined }}
            />
          </div>
        </section>
      </div>
    </>
  );
}
