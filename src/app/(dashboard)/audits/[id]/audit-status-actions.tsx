"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Play, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuditStatusActions({
  auditId,
  status,
}: {
  auditId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/audits/${auditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed");
      toast.success(`Audit marked as ${next.replace("_", " ").toLowerCase()}`);
      router.refresh();
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {status !== "IN_PROGRESS" && status !== "COMPLETED" && (
          <DropdownMenuItem onClick={() => setStatus("IN_PROGRESS")}>
            <Play className="h-4 w-4" /> Start audit
          </DropdownMenuItem>
        )}
        {status !== "COMPLETED" && (
          <DropdownMenuItem onClick={() => setStatus("COMPLETED")}>
            <CheckCircle2 className="h-4 w-4" /> Mark completed
          </DropdownMenuItem>
        )}
        {status !== "CANCELLED" && status !== "COMPLETED" && (
          <DropdownMenuItem
            onClick={() => setStatus("CANCELLED")}
            className="text-destructive focus:text-destructive"
          >
            <X className="h-4 w-4" /> Cancel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
