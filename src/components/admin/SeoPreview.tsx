const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** Shows roughly how a page appears in search results and when shared on social media. */
export function SeoPreview({
  title,
  description,
  url,
  image,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="border border-border bg-white p-4">
        <p className="text-xs text-muted-foreground">Search result preview</p>
        <p className="mt-2 truncate text-xs text-[#4d5156]">{url}</p>
        <p className="mt-1 text-lg leading-snug text-[#1a0dab]">
          {clip(title || "Missing title", 60)}
        </p>
        <p className="mt-1 text-sm text-[#4d5156]">
          {clip(description || "Missing description", 160)}
        </p>
      </div>
      <div className="border border-border bg-white">
        <p className="p-3 pb-2 text-xs text-muted-foreground">Social sharing preview</p>
        {image && <img src={image} alt="" className="aspect-[1.91/1] w-full object-cover" />}
        <div className="bg-[#f0f2f5] p-3">
          <p className="truncate text-xs uppercase text-[#65676b]">
            {url.replace(/^https?:\/\//, "").split("/")[0]}
          </p>
          <p className="truncate font-medium text-[#1c1e21]">{title || "Missing title"}</p>
          <p className="truncate text-sm text-[#65676b]">{description || "Missing description"}</p>
        </div>
      </div>
    </div>
  );
}

export function seoIssues(title: string, description: string) {
  const issues: string[] = [];
  if (!title) issues.push("Missing title");
  else if (title.length > 60) issues.push(`Title long (${title.length}/60)`);
  if (!description) issues.push("Missing description");
  else if (description.length > 160) issues.push(`Description long (${description.length}/160)`);
  else if (description.length < 50) issues.push("Description short");
  return issues;
}
