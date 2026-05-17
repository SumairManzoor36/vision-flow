"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  MinusCircle,
  Package,
  Pencil,
  PlusCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  detectedLabel: string;
  detectedQty: number;
  expectedQty: number;
  confidence: number | null;
  status: string;
  productId: string | null;
  product: { id: string; name: string; sku: string } | null;
  notes: string | null;
};

const ITEM_BADGE: Record<string, BadgeProps["variant"]> = {
  DETECTED: "info",
  MATCHED: "success",
  MISSING: "destructive",
  EXTRA: "warning",
  DAMAGED: "destructive",
  UNKNOWN: "secondary",
};

export function AuditItemsTable({
  items: initialItems,
  canEdit,
}: {
  items: Item[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftQty, setDraftQty] = React.useState<string>("");
  const [savingId, setSavingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  function startEdit(item: Item) {
    setEditingId(item.id);
    setDraftQty(String(item.detectedQty));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftQty("");
  }

  async function persist(id: string, patch: Partial<Item>) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/audit-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
      );
      router.refresh();
      return true;
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "",
      });
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function saveQty(id: string) {
    const qty = parseInt(draftQty, 10);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Quantity must be a non-negative integer");
      return;
    }
    const ok = await persist(id, { detectedQty: qty });
    if (ok) {
      toast.success("Quantity updated");
      cancelEdit();
    }
  }

  async function adjustQty(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = Math.max(0, item.detectedQty + delta);
    await persist(id, { detectedQty: next });
  }

  async function setStatus(id: string, status: Item["status"]) {
    const ok = await persist(id, { status });
    if (ok) toast.success(`Marked as ${status.toLowerCase()}`);
  }

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No items have been detected yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-center">Detected</TableHead>
          <TableHead className="text-center">Expected</TableHead>
          <TableHead className="text-center">Δ</TableHead>
          <TableHead className="text-center">Conf.</TableHead>
          <TableHead>Status</TableHead>
          {canEdit && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => {
          const diff = it.detectedQty - it.expectedQty;
          const isEditing = editingId === it.id;
          const isSaving = savingId === it.id;
          return (
            <TableRow key={it.id} className={cn(isEditing && "bg-primary/5")}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {it.product ? (
                    <Package className="h-3.5 w-3.5 shrink-0 text-success" />
                  ) : (
                    <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {it.product?.name ?? it.detectedLabel}
                    </div>
                    {it.product && (
                      <div className="font-mono text-xs text-muted-foreground">
                        SKU {it.product.sku}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center">
                {isEditing ? (
                  <div className="flex items-center justify-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={draftQty}
                      onChange={(e) => setDraftQty(e.target.value)}
                      className="h-8 w-20 text-center"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveQty(it.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                  </div>
                ) : canEdit ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustQty(it.id, -1)}
                      disabled={isSaving || it.detectedQty <= 0}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Decrease"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2ch] font-semibold tabular-nums">
                      {it.detectedQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustQty(it.id, 1)}
                      disabled={isSaving}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Increase"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="font-semibold">{it.detectedQty}</span>
                )}
              </TableCell>

              <TableCell className="text-center text-muted-foreground">
                {it.expectedQty}
              </TableCell>

              <TableCell className="text-center">
                {diff === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      diff > 0 ? "text-warning" : "text-destructive"
                    )}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                )}
              </TableCell>

              <TableCell className="text-center text-xs">
                {it.confidence !== null
                  ? `${Math.round((it.confidence ?? 0) * 100)}%`
                  : "—"}
              </TableCell>

              <TableCell>
                <Badge variant={ITEM_BADGE[it.status] ?? "secondary"}>
                  {it.status}
                </Badge>
              </TableCell>

              {canEdit && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {isSaving && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveQty(it.id)}
                          disabled={isSaving}
                        >
                          <Check className="h-3.5 w-3.5 text-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={isSaving}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(it)}
                          title="Edit quantity"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {it.status !== "MATCHED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatus(it.id, "MATCHED")}
                            title="Mark matched"
                          >
                            <PlusCircle className="h-3.5 w-3.5 text-success" />
                          </Button>
                        )}
                        {it.status !== "MISSING" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatus(it.id, "MISSING")}
                            title="Mark missing"
                          >
                            <MinusCircle className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
