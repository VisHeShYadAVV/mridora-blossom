// First-party, consent-gated measurement. Sent to /api/track, which adds the visitor's
// country from the CDN header without ever storing an IP address.
const CONSENT_KEY = "mridora-cookie-consent";
const SESSION_KEY = "mridora-session";

export type Consent = "accepted" | "declined" | null;

export function getConsent(): Consent {
  try {
    return window.localStorage.getItem(CONSENT_KEY) as Consent;
  } catch {
    return null;
  }
}

export function setConsent(value: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Without storage the banner returns next visit, and nothing is tracked until then.
  }
}

let trackingAllowed = false;
export const allowTracking = (allowed: boolean) => {
  trackingAllowed = allowed;
};

function sessionId() {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function source() {
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  if (utm) return utm.slice(0, 100);
  if (!document.referrer) return "";
  try {
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    return host === window.location.hostname.replace(/^www\./, "") ? "" : host;
  } catch {
    return "";
  }
}

export type TrackType = "pageview" | "product_view" | "collection_view" | "search" | "rfq";

export function track(type: TrackType, label = "") {
  if (!trackingAllowed || typeof window === "undefined") return;
  const body = JSON.stringify({
    type,
    label,
    path: window.location.pathname,
    source: type === "pageview" ? source() : "",
    sessionId: sessionId(),
  });
  // keepalive lets the request finish if the visitor is navigating away.
  void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

export function loadGoogleAnalytics(id: string) {
  if (!/^G-[A-Z0-9]+$/.test(id) || document.getElementById("ga-script")) return;
  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag.js only reads the arguments object form.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", id);
}
