// Loaded on demand, so these libraries never reach public website visitors.
export async function writeXlsx(filename: string, headers: string[], rows: string[][]) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const data = [
    headers.map((value) => ({ value, fontWeight: "bold" as const })),
    ...rows.map((row) => row.map((value) => ({ value, type: String }))),
  ];
  await writeXlsxFile(data).toFile(filename);
}

export async function readXlsxRows(file: File): Promise<Record<string, string>[]> {
  const { readSheet } = await import("read-excel-file/browser");
  const rows = await readSheet(file);
  const [header, ...body] = rows;
  if (!header) return [];
  const keys = header.map((h) => String(h ?? "").trim());
  return body
    .map((row) =>
      Object.fromEntries(keys.map((k, i) => [k, row[i] == null ? "" : String(row[i]).trim()])),
    )
    .filter((r) => Object.values(r).some(Boolean));
}
