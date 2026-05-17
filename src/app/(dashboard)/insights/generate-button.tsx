"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateInsightsButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/insights/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      toast.success(`Generated ${data.insights?.length ?? 0} new insights`);
      router.refresh();
    } catch (e) {
      toast.error("Could not generate insights", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="gradient" onClick={generate} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" /> Generate insights
        </>
      )}
    </Button>
  );
}
