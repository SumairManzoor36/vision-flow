import Link from "next/link";
import { ArrowRight, BarChart3, Camera, CheckCircle2, Cpu, Layers, Lock, Sparkles, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/icons/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: Camera,
    title: "AI Vision Audit",
    desc: "Snap a photo of any shelf, warehouse aisle, or stockroom and Gemini Vision instantly counts and identifies every item with bounding boxes.",
  },
  {
    icon: Cpu,
    title: "Gemini 2.0 Flash",
    desc: "Powered by Google's latest multi-modal AI. Sub-second inference, multi-language detection, and confidence scoring built in.",
  },
  {
    icon: Workflow,
    title: "Automated Reconciliation",
    desc: "Auto-match detected items against your master catalog. Flag missing, extra, and damaged stock for review.",
  },
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    desc: "Anomaly detection, reorder forecasting, and risk scoring so you act before shrinkage becomes a problem.",
  },
  {
    icon: Layers,
    title: "Multi-Location",
    desc: "Warehouses, retail stores, stockrooms, transit. One source of truth across your entire operation.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "Role-based access, audit trails, encrypted storage, and Plesk-ready deployment for self-hosting.",
  },
];

const STATS = [
  { value: "99.4%", label: "Detection accuracy" },
  { value: "<800ms", label: "Avg AI response" },
  { value: "60×", label: "Faster than manual count" },
  { value: "24/7", label: "Always-on monitoring" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-noise" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[600px] bg-radial-fade opacity-70" />
      <div className="pointer-events-none absolute inset-0 -z-0 bg-grid-pattern opacity-[0.04]" style={{ backgroundSize: "48px 48px" }} />

      {/* Nav */}
      <header className="relative z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#stack" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Tech stack
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="gradient" size="sm">
              <Link href="/register">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Google Gemini Vision 2.0
            </div>
            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
              The future of <span className="text-gradient">inventory audits</span> is here.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Vision Audit Flow Pro turns any camera into a fully automated, AI-powered stock-counting machine.
              Reconcile inventory in seconds — not days.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="gradient">
                <Link href="/register">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/login">Live demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · Deployable on Plesk · MariaDB 11.x compatible
            </p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-6 rounded-2xl border bg-card/40 p-8 backdrop-blur md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold tracking-tight md:text-4xl">
                  <span className="text-gradient">{s.value}</span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 border-t bg-card/30">
        <div className="container py-20">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to audit at scale
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built from the ground up for warehouses, retail chains, and manufacturers who refuse to lose another dollar to shrinkage.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-glow"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-60" />
                <div className="relative">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10">
        <div className="container py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">Three steps from photo to fully reconciled audit.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Capture", d: "Upload or stream a photo from any device. Mobile, IP camera, drone — anything." },
              { n: "02", t: "Detect", d: "Gemini Vision identifies every item, counts quantities, and outputs confidence-scored JSON." },
              { n: "03", t: "Reconcile", d: "Auto-match against your catalog. Review discrepancies. Sign off in one click." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border bg-card/50 p-8 backdrop-blur">
                <div className="text-sm font-mono text-primary">{s.n}</div>
                <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section id="stack" className="relative z-10 border-t bg-card/30">
        <div className="container py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Modern, fast, self-hostable</h2>
            <p className="mt-4 text-muted-foreground">
              Built on Next.js 15 + React 19, MariaDB 11 via Prisma, deploys to Plesk in minutes.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {["Next.js 15", "MariaDB 11.x", "Prisma ORM", "Gemini Vision", "Auth.js", "Tailwind CSS", "React 19", "Plesk-ready"].map(
              (t) => (
                <div
                  key={t}
                  className="flex items-center justify-center gap-2 rounded-xl border bg-card/60 px-4 py-3 text-sm font-medium"
                >
                  <Zap className="h-4 w-4 text-primary" />
                  {t}
                </div>
              )
            )}
          </div>
          <div className="mt-12 flex flex-col items-center gap-3">
            <Button asChild size="xl" variant="gradient">
              <Link href="/register">
                Deploy your own instance <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Production-ready · MIT-licensed components · Self-hosted on your infra
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <Wordmark />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vision Audit Flow Pro · Built with ♥ for operations teams worldwide
          </p>
        </div>
      </footer>
    </div>
  );
}
