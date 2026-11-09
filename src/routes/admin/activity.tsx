import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { errorText, Message, Title } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/activity")({ component: Page });

interface Row {
  id: number;
  at: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
}

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      const [log, users] = await Promise.all([
        supabase!
          .from("audit_log")
          .select("id, at, user_id, action, entity, entity_id")
          .order("id", { ascending: false })
          .limit(300),
        supabase!.from("admin_users").select("user_id, email"),
      ]);
      if (log.error) return setError(errorText(log.error));
      setRows((log.data ?? []) as Row[]);
      return setEmails(
        Object.fromEntries((users.data ?? []).map((u) => [u.user_id as string, u.email as string])),
      );
    })();
  }, []);
  return (
    <>
      <Title>Activity Log</Title>
      <Message kind="error">{error}</Message>
      <p className="mb-3 text-sm text-muted-foreground">
        The latest 300 changes. Each entry also stores the before and after values in the database.
      </p>
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">
                  {new Date(r.at).toLocaleString()}
                </td>
                <td className="p-3">
                  {r.user_id ? (emails[r.user_id] ?? "Former staff") : "Website visitor"}
                </td>
                <td className="p-3 capitalize">{r.action}</td>
                <td className="p-3">{r.entity}</td>
                <td className="p-3 font-mono text-xs">{r.entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
