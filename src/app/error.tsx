"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-6">
      <div className="max-w-md text-center">
        <div className="relative inline-flex">
          <div className="absolute inset-0 rounded-full bg-destructive/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground shadow-xl">
            <AlertOctagon className="h-10 w-10" />
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. The team has been notified.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-muted-foreground/70">
            ref · {error.digest}
          </p>
        )}
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset} variant="gradient">
            <RotateCw className="h-4 w-4" /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Home className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
