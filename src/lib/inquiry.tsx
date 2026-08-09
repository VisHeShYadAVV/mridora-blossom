import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ProductRecord } from "@/data/catalog";

export interface InquiryItem {
  sku: string;
  name: string;
  slug: string;
  quantity: string;
}

interface InquiryContextValue {
  items: InquiryItem[];
  count: number;
  isOpen: boolean;
  openInquiry: () => void;
  closeInquiry: () => void;
  addProduct: (product: ProductRecord) => void;
  removeItem: (sku: string) => void;
  setQuantity: (sku: string, quantity: string) => void;
  clearInquiry: () => void;
  hasProduct: (sku: string) => boolean;
}

const STORAGE_KEY = "mridora-inquiry-v1";

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted state after hydration so server and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as InquiryItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore unreadable storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage may be unavailable */
    }
  }, [items, hydrated]);

  const addProduct = useCallback((product: ProductRecord) => {
    setItems((current) => {
      if (current.some((item) => item.sku === product.sku)) return current;
      return [
        ...current,
        { sku: product.sku, name: product.name, slug: product.slug, quantity: "" },
      ];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((sku: string) => {
    setItems((current) => current.filter((item) => item.sku !== sku));
  }, []);

  const setQuantity = useCallback((sku: string, quantity: string) => {
    setItems((current) =>
      current.map((item) => (item.sku === sku ? { ...item, quantity } : item)),
    );
  }, []);

  const clearInquiry = useCallback(() => setItems([]), []);

  const value = useMemo<InquiryContextValue>(
    () => ({
      items,
      count: items.length,
      isOpen,
      openInquiry: () => setIsOpen(true),
      closeInquiry: () => setIsOpen(false),
      addProduct,
      removeItem,
      setQuantity,
      clearInquiry,
      hasProduct: (sku: string) => items.some((item) => item.sku === sku),
    }),
    [items, isOpen, addProduct, removeItem, setQuantity, clearInquiry],
  );

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useInquiry(): InquiryContextValue {
  const context = useContext(InquiryContext);
  if (!context) throw new Error("useInquiry must be used inside InquiryProvider");
  return context;
}

export function formatInquiryLines(items: InquiryItem[]): string {
  return items
    .map((item) =>
      item.quantity.trim()
        ? `${item.sku} — ${item.name} — Quantity: ${item.quantity.trim()}`
        : `${item.sku} — ${item.name} — Quantity: To Be Confirmed`,
    )
    .join("\n");
}
