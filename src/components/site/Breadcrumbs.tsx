import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

export function Breadcrumbs({ items }: { items: { name: string; path?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs tracking-wide text-muted-foreground">
      {items.map((item, i) => (
        <Fragment key={item.name}>
          {i > 0 && <span className="mx-2 text-gold">/</span>}
          {item.path ? (
            <Link to={item.path} className="hover:text-primary">
              {item.name}
            </Link>
          ) : (
            <span aria-current="page" className="text-foreground">
              {item.name}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
