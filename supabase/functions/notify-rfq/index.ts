// Emails the export desk, and acknowledges the buyer, when an enquiry is stored.
// Triggered by a Supabase Database Webhook on INSERT into public.rfqs.
// Secrets: RESEND_API_KEY, WEBHOOK_SECRET, EXPORT_EMAIL, FROM_EMAIL.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }
  const { record: r } = await req.json();
  const from = Deno.env.get("FROM_EMAIL");
  const exportEmail = Deno.env.get("EXPORT_EMAIL") ?? "export@mridoraglobal.com";

  // Settings from the admin panel. If they can't be read, still notify the export desk.
  let config: { recipients?: string; ackEnabled?: boolean; ackSubject?: string; ackBody?: string } = {};
  try {
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/private_settings?key=eq.email&select=value`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (res.ok) config = (await res.json())[0]?.value ?? {};
  } catch (e) {
    console.error("Could not read email settings", e);
  }
  const recipients = (config.recipients ?? "").split(",").map((x) => x.trim()).filter(Boolean);

  const send = (body: Record<string, unknown>) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, ...body }),
    });

  const items = (r.items ?? [])
    .map((i: { name: string; sku: string; quantity: string }) => `- ${i.name}${i.sku ? ` (${i.sku})` : ""}: ${i.quantity || "quantity not given"}`)
    .join("\n");
  const text = [
    `Company: ${r.company}`, `Country: ${r.country}`, `Email: ${r.email}`, `Phone: ${r.phone}`,
    "", "Products:", items, "",
    `Material: ${r.material}`, `Colour / Finish: ${r.colour_finish}`, `Customization: ${r.customization}`,
    `Packaging: ${r.packaging}`, `Destination: ${r.destination}`, `Incoterm: ${r.incoterm}`,
    `Attachment: ${r.attachment_path ? "Yes, see the admin panel" : "None"}`, "", r.message,
  ].join("\n");

  const desk = await send({
    to: recipients.length ? recipients : [exportEmail],
    reply_to: r.email,
    subject: `New RFQ: ${r.company} (${r.country})`.replace(/[\r\n]+/g, " "),
    text,
  });
  if (!desk.ok) return new Response(`Desk email failed: ${await desk.text()}`, { status: 502 });

  if (config.ackEnabled !== false) {
    const ack = await send({
      to: r.email,
      reply_to: exportEmail,
      subject: (config.ackSubject || "We received your enquiry | MRIDORA").replace(/[\r\n]+/g, " "),
      text: config.ackBody || "Thank you for contacting MRIDORA. The export desk has received your enquiry and will reply by email.",
    });
    if (!ack.ok) console.error("Acknowledgement failed", await ack.text());
  }
  return new Response("ok");
});
