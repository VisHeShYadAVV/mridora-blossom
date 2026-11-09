import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { btn, btnDanger, btnOutline, Field, Message, Title } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/security")({ component: Page });

function Page() {
  const [factorId, setFactorId] = useState("");
  const [enrol, setEnrol] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const { data } = await supabase!.auth.mfa.listFactors();
    setFactorId(data?.totp.find((f) => f.status === "verified")?.id ?? "");
  };
  useEffect(() => void load(), []);

  const start = async () => {
    setError("");
    const { data, error: err } = await supabase!.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${Date.now()}`,
    });
    if (err) return setError(err.message);
    return setEnrol({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };
  const verify = async () => {
    if (!enrol) return undefined;
    setError("");
    const { error: err } = await supabase!.auth.mfa.challengeAndVerify({
      factorId: enrol.id,
      code: code.trim(),
    });
    if (err) return setError("That code was not accepted. Try the current code.");
    setEnrol(null);
    setCode("");
    setNotice("Two-factor authentication is on. You will need a code at each sign-in.");
    return load();
  };
  const disable = async () => {
    if (!window.confirm("Turn off two-factor authentication for this account?")) return undefined;
    const { error: err } = await supabase!.auth.mfa.unenroll({ factorId });
    if (err) return setError(err.message);
    setNotice("Two-factor authentication is off.");
    return load();
  };
  const changePassword = async () => {
    setError("");
    if (password.length < 12) return setError("Use at least 12 characters.");
    const { error: err } = await supabase!.auth.updateUser({ password });
    if (err) return setError(err.message);
    setPassword("");
    return setNotice("Password changed.");
  };

  const signOutOthers = async () => {
    setError("");
    const { error: err } = await supabase!.auth.signOut({ scope: "others" });
    if (err) return setError(err.message);
    return setNotice("Signed out of all other devices.");
  };

  return (
    <>
      <Title>Security</Title>
      <div className="max-w-xl space-y-5">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        <section className="space-y-3 border border-border bg-card p-5">
          <h2 className="text-xl text-primary">Two-factor authentication</h2>
          {factorId ? (
            <button onClick={() => void disable()} className={btnDanger}>
              Turn off
            </button>
          ) : enrol ? (
            <>
              <p className="text-sm text-muted-foreground">
                Scan with an authenticator app, then enter its code.
              </p>
              <img
                src={enrol.qr}
                alt="QR code for your authenticator app"
                className="h-44 w-44 bg-white p-2"
              />
              <p className="break-all font-mono text-xs">{enrol.secret}</p>
              <Field label="6-digit code" value={code} onChange={setCode} />
              <button onClick={() => void verify()} className={btn}>
                Confirm
              </button>
            </>
          ) : (
            <button onClick={() => void start()} className={btn}>
              Set up
            </button>
          )}
        </section>
        <section className="space-y-3 border border-border bg-card p-5">
          <h2 className="text-xl text-primary">Change password</h2>
          <Field label="New password" type="password" value={password} onChange={setPassword} />
          <button onClick={() => void changePassword()} className={btn}>
            Change password
          </button>
        </section>
        <section className="space-y-3 border border-border bg-card p-5">
          <h2 className="text-xl text-primary">Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Sign out everywhere except this browser, for example after losing a device.
          </p>
          <button onClick={() => void signOutOthers()} className={btnOutline}>
            Sign out other devices
          </button>
        </section>
      </div>
    </>
  );
}
