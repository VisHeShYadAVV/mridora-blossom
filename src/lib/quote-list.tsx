import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { RfqItem } from "@/lib/types";

// A list of products for one quotation enquiry. Not a cart: no prices, no checkout.
const KEY = "mridora-quote-list";

interface QuoteList {
  items: RfqItem[];
  add: (item: { sku: string; name: string }) => void;
  remove: (sku: string) => void;
  setQuantity: (sku: string, quantity: string) => void;
  clear: () => void;
  has: (sku: string) => boolean;
}

/** Products typed in by hand have no SKU, so they are identified by name. */
export const itemKey = (item: { sku: string; name: string }) => item.sku || item.name;

const Ctx = createContext<QuoteList | null>(null);

export function QuoteListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RfqItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as RfqItem[]);
    } catch {
      // Storage unavailable or corrupt: start with an empty list.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // The list still works for this page view.
    }
  }, [items, loaded]);

  const add = useCallback((item: { sku: string; name: string }) => {
    setItems((cur) =>
      cur.some((i) => itemKey(i) === itemKey(item)) ? cur : [...cur, { ...item, quantity: "" }],
    );
  }, []);
  const remove = useCallback(
    (key: string) => setItems((cur) => cur.filter((i) => itemKey(i) !== key)),
    [],
  );
  const setQuantity = useCallback(
    (key: string, quantity: string) =>
      setItems((cur) => cur.map((i) => (itemKey(i) === key ? { ...i, quantity } : i))),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      add,
      remove,
      setQuantity,
      clear,
      has: (sku: string) => items.some((i) => i.sku === sku),
    }),
    [items, add, remove, setQuantity, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQuoteList() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useQuoteList must be used inside QuoteListProvider");
  return value;
}
