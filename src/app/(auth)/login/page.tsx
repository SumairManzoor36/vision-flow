import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-card/70 p-8 shadow-elevated backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your Vision Audit Flow Pro workspace
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Demo:{" "}
        <span className="font-mono">admin@vision-audit.app</span> /{" "}
        <span className="font-mono">admin1234</span>
      </p>
    </div>
  );
}
