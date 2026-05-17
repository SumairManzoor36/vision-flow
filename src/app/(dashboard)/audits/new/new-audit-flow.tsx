"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import { CameraCapture } from "@/components/audit/camera-capture";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";

type Location = { id: string; name: string; code: string; type: string };

type Step = "details" | "capture" | "analyzing" | "results";

type Detection = {
  id: string;
  detectedLabel: string;
  detectedQty: number;
  confidence: number | null;
  status: string;
  productId: string | null;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
};

export function NewAuditFlow({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("details");
  const [creating, setCreating] = React.useState(false);

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    locationId: locations[0]?.id ?? "",
  });

  const [auditId, setAuditId] = React.useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<{
    summary: string;
    overallConfidence: number;
    totalItems: number;
    latencyMs: number;
    warnings?: string[];
  } | null>(null);
  const [items, setItems] = React.useState<Detection[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [imageRef, setImageRef] = React.useState<{ width: number; height: number } | null>(null);
  const [captureMode, setCaptureMode] = React.useState<"choose" | "camera" | "upload">(
    "choose"
  );

  const fileRef = React.useRef<HTMLInputElement | null>(null);

  // Step 1: create audit
  async function handleCreate() {
    if (!form.title.trim() || !form.locationId) {
      toast.error("Add a title and select a location.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          locationId: form.locationId,
          method: "AI_VISION",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setAuditId(data.audit.id);
      setStep("capture");
    } catch (e) {
      toast.error("Could not create audit", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setCreating(false);
    }
  }

  // Step 2: capture / upload
  function onFileChosen(file: File) {
    if (file.size > 18 * 1024 * 1024) {
      toast.error("Image too large", { description: "Max 18MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  // Step 3: analyze
  async function runAnalysis() {
    if (!imageDataUrl || !auditId) return;
    setStep("analyzing");
    setProgress(8);
    const tick = setInterval(
      () => setProgress((p) => (p < 92 ? p + Math.random() * 8 : p)),
      350
    );

    try {
      const res = await fetch(`/api/audits/${auditId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Vision analysis failed");

      setAnalysis({
        summary: data.analysis.summary,
        overallConfidence: data.analysis.overallConfidence,
        totalItems: data.analysis.totalItems,
        latencyMs: data.analysis.latencyMs,
        warnings: data.analysis.warnings,
      });
      setItems(data.items);
      setProgress(100);
      setTimeout(() => setStep("results"), 400);
    } catch (e) {
      toast.error("AI analysis failed", {
        description: e instanceof Error ? e.message : "",
      });
      setStep("capture");
    } finally {
      clearInterval(tick);
    }
  }

  function reset() {
    setImageDataUrl(null);
    setAnalysis(null);
    setItems([]);
    setProgress(0);
    setCaptureMode("choose");
    setStep("capture");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New AI Vision Audit"
        description="Capture a photo, let Gemini Vision count, then reconcile with your catalog."
      />

      {/* Stepper */}
      <Card className="overflow-hidden">
        <div className="flex border-b">
          {(["details", "capture", "analyzing", "results"] as Step[]).map((s, i) => {
            const order: Record<Step, number> = {
              details: 0,
              capture: 1,
              analyzing: 2,
              results: 3,
            };
            const isActive = step === s;
            const isDone = order[step] > i;
            return (
              <div
                key={s}
                className={cn(
                  "flex flex-1 items-center gap-3 px-4 py-3 text-sm transition-colors",
                  isActive && "bg-primary/10",
                  isDone && "bg-success/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isDone && "border-success bg-success text-success-foreground",
                    !isActive && !isDone && "border-border bg-card text-muted-foreground"
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "font-medium capitalize",
                    !isActive && !isDone && "text-muted-foreground"
                  )}
                >
                  {s === "analyzing" ? "AI analysis" : s}
                </span>
              </div>
            );
          })}
        </div>

        {step === "details" && (
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Audit title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Q4 Warehouse A — Aisle 12 spot check"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc">Location</Label>
                <Select
                  value={form.locationId}
                  onValueChange={(v) => setForm({ ...form, locationId: v })}
                >
                  <SelectTrigger id="loc">
                    <SelectValue placeholder="Pick a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No locations yet — create one first
                      </SelectItem>
                    ) : (
                      locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} <span className="opacity-60">({l.code})</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea
                  id="desc"
                  placeholder="Notes for auditors / context for the AI"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={handleCreate}
                disabled={creating || !form.title || !form.locationId}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    Continue to capture <Camera className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}

        {step === "capture" && (
          <CardContent className="pt-6">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileChosen(f);
              }}
            />
            {!imageDataUrl && captureMode === "choose" && (
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card/30 py-16 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) onFileChosen(f);
                }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 text-primary">
                  <ImagePlus className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Capture or upload an image</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Snap a live photo of the shelf, aisle, or stockroom — or drop a file here.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setCaptureMode("camera")} variant="gradient">
                    <Video className="h-4 w-4" /> Open live camera
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Upload file
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP up to 18MB</p>
              </div>
            )}

            {!imageDataUrl && captureMode === "camera" && (
              <CameraCapture
                onCapture={(dataUrl) => {
                  setImageDataUrl(dataUrl);
                  setCaptureMode("choose");
                }}
                onCancel={() => setCaptureMode("choose")}
              />
            )}

            {imageDataUrl && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt="Preview"
                    className="max-h-[480px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4" /> Replace image
                  </Button>
                  <Button variant="gradient" size="lg" onClick={runAnalysis}>
                    <Sparkles className="h-4 w-4" /> Analyze with Gemini Vision
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}

        {step === "analyzing" && (
          <CardContent className="space-y-6 pt-12 pb-12 text-center">
            <div className="relative mx-auto h-20 w-20">
              <div className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-primary" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-glow">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gemini is counting your inventory…</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Detecting items, estimating quantities, and reconciling against your catalog.
              </p>
            </div>
            <div className="mx-auto max-w-md">
              <Progress value={progress} />
              <div className="mt-2 text-xs text-muted-foreground">
                {Math.round(progress)}%
              </div>
            </div>
          </CardContent>
        )}

        {step === "results" && analysis && (
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <SmallStat label="Items detected" value={items.length} />
              <SmallStat label="Total qty" value={analysis.totalItems} />
              <SmallStat
                label="Confidence"
                value={`${Math.round(analysis.overallConfidence * 100)}%`}
                accent={analysis.overallConfidence > 0.7 ? "success" : "warning"}
              />
              <SmallStat
                label="AI latency"
                value={`${(analysis.latencyMs / 1000).toFixed(2)}s`}
              />
            </div>

            <div className="rounded-xl border bg-primary/5 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI summary
              </div>
              <p className="text-sm">{analysis.summary}</p>
              {analysis.warnings && analysis.warnings.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-warning">
                  {analysis.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              )}
            </div>

            {imageDataUrl && (
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt="Analyzed"
                    onLoad={(e) => {
                      const target = e.currentTarget;
                      setImageRef({
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      });
                    }}
                    className="block w-full"
                  />
                  {imageRef &&
                    items.map((it) =>
                      it.boundingBox ? (
                        <div
                          key={it.id}
                          className="absolute rounded border-2 border-primary bg-primary/10"
                          style={{
                            left: `${(it.boundingBox.x ?? 0) * 100}%`,
                            top: `${(it.boundingBox.y ?? 0) * 100}%`,
                            width: `${(it.boundingBox.width ?? 0) * 100}%`,
                            height: `${(it.boundingBox.height ?? 0) * 100}%`,
                          }}
                        >
                          <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-primary px-1 py-0.5 text-[10px] font-medium text-primary-foreground">
                            {it.detectedLabel} × {it.detectedQty}
                          </span>
                        </div>
                      ) : null
                    )}
                </div>
              </div>
            )}

            <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-base">Detected items</CardTitle>
                <CardDescription>
                  Review, edit quantities, and confirm. Unmatched items can be linked to products later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-0">
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">No items detected.</p>
                )}
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-4 rounded-lg border bg-card/50 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{it.detectedLabel}</span>
                        {!it.productId && (
                          <Badge variant="warning" className="shrink-0">
                            Unmatched
                          </Badge>
                        )}
                      </div>
                      {it.confidence !== null && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {Math.round((it.confidence ?? 0) * 100)}% confidence
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                        × {it.detectedQty}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={reset}>
                <Camera className="h-4 w-4" /> Scan another
              </Button>
              <Button
                variant="gradient"
                size="lg"
                onClick={() => router.push(`/audits/${auditId}`)}
              >
                Open audit detail <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function SmallStat({
  label,
  value,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  accent?: "primary" | "success" | "warning";
}) {
  return (
    <div className="rounded-xl border bg-card/50 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold tracking-tight",
          accent === "success" && "text-success",
          accent === "warning" && "text-warning"
        )}
      >
        {value}
      </div>
    </div>
  );
}
