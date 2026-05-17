"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export function InventoryFilterBar({
  categories,
  initialQuery,
  initialCategory,
  initialLow,
}: {
  categories: Category[];
  initialQuery: string;
  initialCategory: string;
  initialLow: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(initialQuery);

  // Debounce the query update to URL
  React.useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      const next = params.toString();
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    const next = params.toString();
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  }

  const activeCount =
    (initialQuery ? 1 : 0) + (initialCategory ? 1 : 0) + (initialLow ? 1 : 0);

  function clearAll() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, SKU, or barcode…"
          className="pl-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden items-center gap-1 text-xs font-medium text-muted-foreground sm:flex">
          <Filter className="h-3.5 w-3.5" /> Filter
        </span>
        <button
          type="button"
          onClick={() => setParam("category", null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !initialCategory
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              setParam("category", initialCategory === c.id ? null : c.id)
            }
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              initialCategory === c.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setParam("low", initialLow ? null : "1")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            initialLow
              ? "border-warning bg-warning/10 text-warning"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          Low stock
        </button>
        {activeCount > 0 && (
          <Button size="sm" variant="ghost" onClick={clearAll}>
            <X className="h-3.5 w-3.5" /> Clear
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
