import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
import { ACTIONS, AREAS, roleCan, type Overrides } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";
import { STAFF_ROLES, type StaffRole } from "@/lib/types";

export const Route = createFileRoute("/admin/users")({ component: Page });

interface Row {
  user_id: string;
  email: string;
  role: StaffRole;
  permissions: Overrides;
}
interface LoginEvent {
  id: number;
  at: string;
  email: string;
  event: string;
  user_agent: string;
}

function Matrix({ row, onSave }: { row: Row; onSave: (overrides: Overrides) => void }) {
  const [overrides, setOverrides] = useState<Overrides>(row.permissions);
  const toggle = (key: string, value: string) => {
    const next = { ...overrides };
    if (value === "default") delete next[key];
    else next[key] = value === "allow";
    setOverrides(next);
  };
  return (
    <div className="space-y-3 border-t border-border bg-stone p-3">
      <p className="text-xs text-muted-foreground">
        “Role default” follows the user's role. Allow or Deny overrides it for this person only.
        Export controls hide the export buttons; anyone who can read data could still copy it.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              <th className="p-1 font-normal">Area</th>
              {ACTIONS.map((a) => (
                <th key={a} className="p-1 font-normal capitalize">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREAS.map(([area, label]) => (
              <tr key={area} className="border-t border-border">
                <td className="p-1">{label}</td>
                {ACTIONS.map((action) => {
                  const key = `${area}.${action}`;
                  const value = overrides[key];
                  return (
                    <td key={action} className="p-1">
                      <select
                        aria-label={`${label} ${action}`}
                        value={value === undefined ? "default" : value ? "allow" : "deny"}
                        onChange={(e) => toggle(key, e.target.value)}
                        className="w-full border border-input bg-card p-1"
                      >
                        <option value="default">
                          Role default ({roleCan(row.role, area, action) ? "yes" : "no"})
                        </option>
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => onSave(overrides)} className={btn}>
        Save permissions
      </button>
    </div>
  );
}

function Page() {
  const { userId, can } = useAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("content_editor");
  const [open, setOpen] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [users, logins] = await Promise.all([
      supabase!.from("admin_users").select("user_id, email, role, permissions").order("email"),
      supabase!
        .from("login_events")
        .select("id, at, email, event, user_agent")
        .order("id", { ascending: false })
        .limit(100),
    ]);
    if (users.error) return setError(errorText(users.error));
    setEvents((logins.data ?? []) as LoginEvent[]);
    return setRows((users.data ?? []) as Row[]);
  };
  useEffect(() => void load(), []);

  const act = async (fn: () => PromiseLike<{ error: unknown }>, done: string) => {
    setError("");
    setNotice("");
    const { error: err } = await fn();
    if (err) return setError(errorText(err));
    setNotice(done);
    return load();
  };
  const canEdit = can("users", "edit");

  return (
    <>
      <Title>Users & Roles</Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        {canEdit && (
          <section className="grid items-end gap-3 border border-border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
            <Field
              label="Email of an existing account"
              type="email"
              value={email}
              onChange={setEmail}
              hint="Create the account first under Authentication in Supabase."
            />
            <label className="block text-sm">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className={input}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!email}
              onClick={() =>
                void act(
                  () =>
                    supabase!.rpc("grant_staff_role", {
                      target_email: email.trim(),
                      target_role: role,
                    }),
                  `Access granted to ${email}.`,
                )
              }
              className={btn}
            >
              Grant access
            </button>
          </section>
        )}
        <div className="space-y-2">
          {rows.map((r) => (
            <article key={r.user_id} className="border border-border bg-card">
              <div className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="min-w-48 flex-1 break-words">
                  {r.email}
                  {Object.keys(r.permissions ?? {}).length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">custom permissions</span>
                  )}
                </span>
                <select
                  aria-label={`Role for ${r.email}`}
                  value={r.role}
                  disabled={r.user_id === userId || !canEdit}
                  onChange={(e) =>
                    void act(
                      () =>
                        supabase!
                          .from("admin_users")
                          .update({ role: e.target.value })
                          .eq("user_id", r.user_id),
                      `Role updated for ${r.email}.`,
                    )
                  }
                  className={`${input} mt-0 max-w-64`}
                >
                  {STAFF_ROLES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {canEdit && r.user_id !== userId && (
                  <button
                    type="button"
                    aria-expanded={open === r.user_id}
                    onClick={() => setOpen(open === r.user_id ? "" : r.user_id)}
                    className={btnOutline}
                  >
                    Permissions
                  </button>
                )}
                {can("users", "delete") && r.user_id !== userId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove admin access for ${r.email}?`))
                        void act(
                          () => supabase!.from("admin_users").delete().eq("user_id", r.user_id),
                          `Removed ${r.email}.`,
                        );
                    }}
                    className={btnDanger}
                  >
                    Remove
                  </button>
                )}
              </div>
              {open === r.user_id && (
                <Matrix
                  row={{ ...r, permissions: r.permissions ?? {} }}
                  onSave={(permissions) =>
                    void act(
                      () =>
                        supabase!
                          .from("admin_users")
                          .update({ permissions })
                          .eq("user_id", r.user_id),
                      `Permissions saved for ${r.email}.`,
                    )
                  }
                />
              )}
            </article>
          ))}
        </div>
        <section className="border border-border bg-card p-4">
          <h2 className="text-xl text-primary">Recent admin sign-ins</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Successful sign-ins and sign-outs. Failed attempts are in the Supabase authentication
            logs.
          </p>
          <div className="mt-3 max-h-80 overflow-auto">
            <table className="w-full text-left text-xs">
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="whitespace-nowrap p-2">{new Date(e.at).toLocaleString()}</td>
                    <td className="p-2">{e.email}</td>
                    <td className="p-2">{e.event.replace("_", " ")}</td>
                    <td
                      className="max-w-64 truncate p-2 text-muted-foreground"
                      title={e.user_agent}
                    >
                      {e.user_agent}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td className="p-3 text-muted-foreground">No sign-ins recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
