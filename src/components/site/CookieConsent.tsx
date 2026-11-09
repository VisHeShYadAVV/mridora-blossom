import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { SmartLink } from "@/components/site/Blocks";
import { allowTracking, getConsent, loadGoogleAnalytics, setConsent, track } from "@/lib/analytics";
import { useSite } from "@/lib/use-site";

/** Asks for consent when enabled, and runs analytics only once it is allowed. */
export function CookieConsent() {
  const { settings, collections } = useSite();
  const [ask, setAsk] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef("");
  const { gaMeasurementId } = settings.analytics;

  useEffect(() => {
    if (!settings.technical.cookieBanner) return setAllowed(true);
    const consent = getConsent();
    if (consent === "accepted") setAllowed(true);
    else if (consent === null) setAsk(true);
    return undefined;
  }, [settings.technical.cookieBanner]);

  useEffect(() => {
    allowTracking(allowed);
    if (allowed && gaMeasurementId) loadGoogleAnalytics(gaMeasurementId);
  }, [allowed, gaMeasurementId]);

  useEffect(() => {
    if (!allowed || lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("pageview");
    const match = /^\/collections\/([^/]+)/.exec(pathname);
    const collection = collections.find((c) => c.slug === match?.[1]);
    if (collection) track("collection_view", collection.name);
    const product = /^\/products\/([^/]+)/.exec(pathname);
    if (product?.[1]) track("product_view", product[1]);
  }, [allowed, pathname, collections]);

  if (!ask) return null;
  const decide = (accepted: boolean) => {
    setConsent(accepted ? "accepted" : "declined");
    setAsk(false);
    setAllowed(accepted);
  };
  return (
    <div
      role="dialog"
      aria-label="Cookie choice"
      className="fixed inset-x-4 bottom-4 z-50 max-w-lg border border-border bg-card p-5 shadow-soft sm:right-auto"
    >
      <p className="text-sm leading-relaxed">
        {settings.technical.cookieText}{" "}
        <SmartLink href="/cookie-policy" className="underline">
          Cookie Policy
        </SmartLink>
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => decide(true)}
          className="btn-shape bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => decide(false)}
          className="btn-shape border border-input px-4 py-2 text-sm"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
