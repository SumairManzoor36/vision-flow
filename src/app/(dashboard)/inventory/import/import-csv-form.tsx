"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

type RowResult = {
  row: number;
  sku: string;
  status: "created" | "updated" | "skipped";
  error?: string;
};

type ImportResult = {
  dryRun: boolean;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  unknownHeaders: string[];
  results: RowResult[];
};

const SAMPLE_CSV = `sku,name,barcode,description,category,unit,costPrice,sellPrice,reorderPoint,reorderQty,tags
SKU-001,Premium Coffee Beans,8901234567890,Arabica blend 1kg,Beverages,kg,12.50,24.99,10,50,coffee;premium
SKU-002,Notebook A4,8901234567891,200 pages ruled,Office,pcs,2.00,4.50,20,100,
SKU-003,Wireless Mouse,8901234567892,Bluetooth 5.0,Electronics,pcs,8.75,19.99,5,20,wireless;mouse`;

export function ImportCsvForm() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [dryRunResult, setDryRunResult] = React.useState<ImportResult | null>(null);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setDryRunResult(null);
    setImportResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    const isCSV =
      f.type === "text/csv" ||
      f.type === "application/vnd.ms-excel" ||
      f.name.toLowerCase().endsWith(".csv");
    if (!isCSV) {
      toast.error("Please select a .csv file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }

  async function submit(dryRun: boolean) {
    if (!file) {
      toast.error("Choose a CSV file first");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("dryRun", String(dryRun));
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Import failed");
      }
      if (dryRun) {
        setDryRunResult(data);
        toast.success("Preview ready", {
          description: `${data.created} new · ${data.updated} updates · ${data.skipped} skipped`,
        });
      } else {
        setImportResult(data);
        toast.success("Import complete", {
          description: `${data.created} created · ${data.updated} updated`,
        });
        router.refresh();
      }
    } catch (e) {
      toast.error("Import failed", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const result = importResult ?? dryRunResult;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" /> Back to inventory
          </Link>
        </Button>
        <PageHeader
          title="Import products"
          description="Bulk add or update products from a CSV file. Existing SKUs will be updated."
          actions={
            <Button variant="outline" size="sm" onClick={downloadSample}>
              <Download className="h-4 w-4" /> Download template
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Maximum 5MB · 2,000 rows. Required columns: <code>sku</code>,{" "}
              <code>name</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    Drop your CSV here, or{" "}
                    <span className="text-primary">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Up to 5MB · UTF-8 encoded
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!file || submitting}
                onClick={() => submit(true)}
              >
                {submitting && dryRunResult === null && !importResult ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Preview (dry-run)"
                )}
              </Button>
              <Button
                type="button"
                variant="gradient"
                disabled={!file || submitting}
                onClick={() => submit(false)}
              >
                {submitting && (importResult !== null || dryRunResult !== null) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Import products
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Column reference</CardTitle>
            <CardDescription>
              Headers are case-insensitive. Unknown columns are ignored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs">
              <li>
                <code className="rounded bg-muted px-1 font-mono">sku</code>{" "}
                <span className="text-destructive">*</span>{" "}
                <span className="text-muted-foreground">unique identifier</span>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">name</code>{" "}
                <span className="text-destructive">*</span>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">barcode</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">description</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">category</code>{" "}
                <span className="text-muted-foreground">name; auto-created</span>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">unit</code>{" "}
                <span className="text-muted-foreground">default: pcs</span>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">costPrice</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">sellPrice</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">reorderPoint</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">reorderQty</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 font-mono">tags</code>{" "}
                <span className="text-muted-foreground">semicolon-separated</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.dryRun ? (
                <>
                  <AlertCircle className="h-4 w-4 text-warning" /> Preview
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" /> Import complete
                </>
              )}
            </CardTitle>
            <CardDescription>
              Processed {formatNumber(result.total)} rows
              {result.unknownHeaders.length > 0 && (
                <span className="ml-2 text-warning">
                  · ignored columns: {result.unknownHeaders.join(", ")}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatBox label="Created" value={result.created} accent="success" />
              <StatBox label="Updated" value={result.updated} accent="info" />
              <StatBox
                label="Skipped"
                value={result.skipped}
                accent={result.skipped > 0 ? "warning" : "muted"}
              />
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.slice(0, 100).map((r) => (
                    <TableRow key={`${r.row}-${r.sku}`}>
                      <TableCell className="font-mono text-xs">{r.row}</TableCell>
                      <TableCell className="font-mono text-xs">{r.sku || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "created"
                              ? "success"
                              : r.status === "updated"
                                ? "info"
                                : "warning"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.error ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {result.results.length > 100 && (
                <div className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
                  Showing first 100 of {result.results.length} rows
                </div>
              )}
            </div>

            {!result.dryRun && (
              <div className="flex justify-end">
                <Button asChild variant="gradient">
                  <Link href="/inventory">
                    View inventory <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "success" | "info" | "warning" | "muted";
}) {
  const colors = {
    success: "border-success/30 bg-success/5 text-success",
    info: "border-info/30 bg-info/5 text-info",
    warning: "border-warning/30 bg-warning/5 text-warning",
    muted: "border-border bg-muted/30 text-muted-foreground",
  } as const;
  return (
    <div className={cn("rounded-lg border p-4", colors[accent])}>
      <div className="text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
