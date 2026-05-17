import { prisma } from "@/lib/prisma";
import { NewAuditFlow } from "./new-audit-flow";

export const dynamic = "force-dynamic";

export default async function NewAuditPage() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, type: true },
  });

  return <NewAuditFlow locations={locations} />;
}
