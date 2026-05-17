import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-md text-center">
        <div className="relative inline-flex">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-xl">
            <Compass className="h-10 w-10" />
          </div>
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-lg font-semibold">Page not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="gradient">
            <Link href="/dashboard">
              <Home className="h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
