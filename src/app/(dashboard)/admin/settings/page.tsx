import { redirect } from "next/navigation";
import { Cpu, Database, Lock, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { VISION_MODEL, TEXT_MODEL } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const items: { icon: React.ReactNode; title: string; value: string; status: "success" | "info" }[] = [
    {
      icon: <Cpu className="h-4 w-4" />,
      title: "Gemini Vision model",
      value: VISION_MODEL,
      status: "info",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Gemini Text model",
      value: TEXT_MODEL,
      status: "info",
    },
    {
      icon: <Database className="h-4 w-4" />,
      title: "Database",
      value: "MariaDB 11.x via Prisma",
      status: "success",
    },
    {
      icon: <Lock className="h-4 w-4" />,
      title: "Authentication",
      value: "Auth.js · JWT sessions · bcrypt",
      status: "success",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System settings"
        description="Configuration and integrations for Vision Audit Flow Pro"
      />

      <Card>
        <CardHeader>
          <CardTitle>System status</CardTitle>
          <CardDescription>Current configuration of integrations and runtime</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {items.map((it) => (
            <div
              key={it.title}
              className="flex items-center justify-between rounded-lg border bg-card/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {it.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{it.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {it.value}
                  </div>
                </div>
              </div>
              <Badge variant={it.status === "success" ? "success" : "info"}>
                {it.status === "success" ? "Healthy" : "Active"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment variables</CardTitle>
          <CardDescription>
            All sensitive configuration is loaded from environment variables. Edit{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env</code>{" "}
            and restart the server to apply changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>
              <code className="font-mono text-primary">DATABASE_URL</code> — MariaDB
              connection string
            </li>
            <li>
              <code className="font-mono text-primary">AUTH_SECRET</code> — Auth.js JWT
              signing key
            </li>
            <li>
              <code className="font-mono text-primary">GEMINI_API_KEY</code> — Google
              Generative AI key
            </li>
            <li>
              <code className="font-mono text-primary">GEMINI_VISION_MODEL</code> /{" "}
              <code className="font-mono text-primary">GEMINI_TEXT_MODEL</code> — model IDs
            </li>
            <li>
              <code className="font-mono text-primary">UPLOAD_DIR</code> — storage path
              for audit images
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
