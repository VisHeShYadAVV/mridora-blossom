import type { StaffRole } from "@/lib/types";

export const AREAS = [
  ["catalogue", "Products & collections"],
  ["pages", "Pages & content"],
  ["design", "Design & navigation"],
  ["seo", "SEO"],
  ["media", "Media library"],
  ["documents", "Compliance documents"],
  ["enquiries", "Enquiries"],
  ["analytics", "Analytics"],
  ["company", "Company information"],
  ["technical", "Technical settings"],
  ["users", "Users & activity"],
] as const;
export const ACTIONS = ["read", "edit", "publish", "delete", "export"] as const;

export type Area = (typeof AREAS)[number][0];
export type Action = (typeof ACTIONS)[number];
export type Overrides = Record<string, boolean>;

/** Mirrors public.role_can in the database, which is what actually enforces access. */
export function roleCan(role: StaffRole, area: Area, action: Action): boolean {
  switch (role) {
    case "super_admin":
      return true;
    case "website_admin":
      return area !== "users";
    case "product_manager":
      return (
        area === "catalogue" ||
        ((area === "media" || area === "documents") && (action === "read" || action === "edit"))
      );
    case "content_editor":
      return (
        ((area === "pages" || area === "media") && (action === "read" || action === "edit")) ||
        (area === "catalogue" && action === "read")
      );
    case "seo_manager":
      return (
        area === "seo" ||
        area === "analytics" ||
        ((area === "pages" || area === "catalogue") && (action === "read" || action === "edit")) ||
        (area === "media" && action === "read")
      );
    case "sales_manager":
      return (
        (area === "enquiries" && action !== "delete") ||
        (area === "analytics" && action === "read") ||
        (area === "catalogue" && action === "read") ||
        (area === "documents" && action === "read")
      );
    default:
      return false;
  }
}

export function allowed(role: StaffRole, overrides: Overrides, area: Area, action: Action) {
  return overrides[`${area}.${action}`] ?? roleCan(role, area, action);
}
