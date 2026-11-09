import { useLoaderData } from "@tanstack/react-router";

import type { SiteData } from "@/lib/data";

export const useSite = (): SiteData => useLoaderData({ from: "__root__" });
