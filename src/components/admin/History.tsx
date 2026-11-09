import { useEffect, useState } from "react";

import { btnOutline, errorText, Message } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

interface Version {
  id: number;
  at: string;
  action: string;
  who: string;
  new_row: Record<string, unknown>;
}

/** Past versions of one record. Restoring loads it into the editor; nothing changes until saved. */
export function History({
  entity,
  id,
  onRestore,
  refreshKey,
}: {
  entity: string;
  id: string;
  onRestore: (row: Record<string, unknown>) => void;
  refreshKey?: unknown;
}) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    void supabase!
      .rpc("entity_history", { p_entity: entity, p_id: id })
      .then(({ data, error: err }) => {
        if (err) setError(errorText(err));
        setVersions((data ?? []) as Version[]);
      });
  }, [open, entity, id, refreshKey]);
  return (
    <section className="border border-border bg-card p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="text-xl text-primary"
      >
        Version history
      </button>
      {open && (
        <div className="mt-3">
          <Message kind="error">{error}</Message>
          {versions.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">No earlier versions yet.</p>
          )}
          <ul className="divide-y divide-border">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  {new Date(v.at).toLocaleString()} · {v.who} · {v.action}
                </span>
                <button type="button" onClick={() => onRestore(v.new_row)} className={btnOutline}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
