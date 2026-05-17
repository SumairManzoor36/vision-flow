import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-card/70 p-8 shadow-elevated backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start auditing inventory with AI in under 60 seconds
          </p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
