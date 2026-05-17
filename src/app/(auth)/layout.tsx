import Link from "next/link";
import { Wordmark } from "@/components/icons/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-noise" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-radial-fade opacity-70" />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.04]"
        style={{ backgroundSize: "48px 48px" }}
      />
      <header className="relative z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Wordmark />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
