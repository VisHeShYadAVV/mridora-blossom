import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  AdminCtx,
  btn,
  btnOutline,
  errorText,
  Field,
  Message,
  type AdminContext,
} from "@/components/admin/ui";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/lib/supabase";
import { allowed, type Area, type Overrides } from "@/lib/permissions";
import { STAFF_ROLES, type StaffRole } from "@/lib/types";
import { useSite } from "@/lib/use-site";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "MRIDORA Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone p-4">
      <div className="w-full max-w-md border border-border bg-card p-8">
        <Logo className="mx-auto mb-6 w-32" />
        {children}
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase!.auth.signInWithPassword({ email, password });
    if (err) setError("Sign-in failed. Check your email and password.");
    else void logEvent("sign_in", email);
    setBusy(false);
  };
  return (
    <Shell>
      <form onSubmit={submit} className="space-y-4">
        <h1 className="text-2xl text-primary">Admin sign in</h1>
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        <Message kind="error">{error}</Message>
        <button disabled={busy} className={`${btn} w-full`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Shell>
  );
}

function MfaChallenge({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const factors = await supabase!.auth.mfa.listFactors();
    const factor = factors.data?.totp.find((f) => f.status === "verified");
    if (!factor) return setError("No authenticator is set up for this account.");
    const { error: err } = await supabase!.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: code.trim(),
    });
    if (err) return setError("That code was not accepted. Try the current code.");
    onDone();
  };
  return (
    <Shell>
      <form onSubmit={submit} className="space-y-4">
        <h1 className="text-2xl text-primary">Authenticator code</h1>
        <Field label="6-digit code" value={code} onChange={setCode} />
        <Message kind="error">{error}</Message>
        <button className={`${btn} w-full`}>Verify</button>
      </form>
    </Shell>
  );
}

const NAV: [string, string, Area | null][] = [
  ["Dashboard", "/admin", null],
  ["Pages", "/admin/pages", "pages"],
  ["Products", "/admin/products", "catalogue"],
  ["Collections", "/admin/collections", "catalogue"],
  ["Enquiries", "/admin/enquiries", "enquiries"],
  ["Media Library", "/admin/media", "media"],
  ["Documents", "/admin/documents", "documents"],
  ["Design & Navigation", "/admin/design", "design"],
  ["SEO", "/admin/seo", "seo"],
  ["Analytics", "/admin/analytics", "analytics"],
  ["Website Settings", "/admin/settings", null],
  ["System", "/admin/system", "technical"],
  ["Users & Roles", "/admin/users", "users"],
  ["Activity Log", "/admin/activity", "users"],
  ["Security", "/admin/security", null],
];

/** Records a security event. Never blocks the action it describes. */
const logEvent = (event: "sign_in" | "sign_out" | "timeout", email: string) =>
  supabase
    ?.from("login_events")
    .insert({ event, email, user_agent: navigator.userAgent.slice(0, 500) })
    .then(({ error }) => {
      if (error) console.error("Could not record login event", error.message);
    });

function AdminLayout() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<"loading" | "mfa" | "denied" | "ready">("loading");
  const [admin, setAdmin] = useState<AdminContext | null>(null);
  const [error, setError] = useState("");
  const { settings } = useSite();
  const timeoutMinutes = settings.technical.sessionTimeoutMinutes;

  const resolve = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s || !supabase) return setState("ready");
    try {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data?.nextLevel === "aal2" && aal.data.currentLevel !== "aal2")
        return setState("mfa");
      const { data, error: err } = await supabase
        .from("admin_users")
        .select("role, permissions")
        .eq("user_id", s.user.id)
        .maybeSingle();
      if (err) throw err;
      if (!data) return setState("denied");
      const role = data.role as StaffRole;
      const overrides = (data.permissions ?? {}) as Overrides;
      setAdmin({
        email: s.user.email ?? "",
        userId: s.user.id,
        role,
        can: (area, action) => allowed(role, overrides, area, action),
      });
      return setState("ready");
    } catch (e) {
      setError(errorText(e));
      return setState("denied");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => resolve(data.session));
    // Supabase warns against awaiting its own calls inside this callback, hence the timeout.
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(() => void resolve(s), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [resolve]);

  // Signs out after a period of inactivity.
  const signedInEmail = admin?.email;
  useEffect(() => {
    if (!signedInEmail || !supabase || !(timeoutMinutes > 0)) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void Promise.resolve(logEvent("timeout", signedInEmail)).finally(
          () => void supabase!.auth.signOut(),
        );
      }, timeoutMinutes * 60_000);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [signedInEmail, timeoutMinutes]);

  if (!mounted)
    return (
      <Shell>
        <p className="text-center text-muted-foreground">Loading…</p>
      </Shell>
    );
  if (!supabase) {
    return (
      <Shell>
        <h1 className="text-2xl text-primary">Admin panel not connected</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The database is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then
          follow supabase/README.md. The public website runs on its default content until then.
        </p>
      </Shell>
    );
  }
  if (state === "loading")
    return (
      <Shell>
        <p className="text-center text-muted-foreground">Loading…</p>
      </Shell>
    );
  if (!session) return <Login />;
  if (state === "mfa")
    return (
      <MfaChallenge
        onDone={() => void supabase!.auth.getSession().then(({ data }) => resolve(data.session))}
      />
    );
  if (state === "denied" || !admin) {
    return (
      <Shell>
        <h1 className="text-2xl text-primary">No admin access</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error || "This account has not been given an admin role."}
        </p>
        <button
          onClick={() => void supabase!.auth.signOut()}
          className={`${btnOutline} mt-5 w-full`}
        >
          Sign out
        </button>
      </Shell>
    );
  }

  const roleLabel = STAFF_ROLES.find((r) => r.value === admin.role)?.label;
  return (
    <AdminCtx.Provider value={admin}>
      <div className="min-h-screen bg-stone md:grid md:grid-cols-[14rem_1fr]">
        <aside className="bg-navy-deep p-4 text-navy-foreground md:min-h-screen">
          <span className="inline-block bg-ivory p-2">
            <Logo className="w-24" />
          </span>
          <nav className="mt-6 flex flex-wrap gap-1 md:flex-col">
            {NAV.filter(([, , area]) => !area || admin.can(area, "read")).map(([label, to]) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/admin" }}
                activeProps={{ className: "bg-navy text-gold-soft" }}
                className="px-3 py-2 text-sm hover:text-gold-soft"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-navy-foreground/20 pt-4 text-xs text-navy-foreground/70">
            <p className="break-words">{admin.email}</p>
            <p className="mt-1">{roleLabel}</p>
            <div className="mt-3 flex gap-3">
              <a href="/" target="_blank" rel="noreferrer" className="underline">
                View site
              </a>
              <button
                onClick={() => {
                  void Promise.resolve(logEvent("sign_out", admin.email)).finally(
                    () => void supabase!.auth.signOut(),
                  );
                }}
                className="underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>
        <main className="min-w-0 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </AdminCtx.Provider>
  );
}
