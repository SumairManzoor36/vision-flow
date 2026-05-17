import { prisma } from "@/lib/prisma";
import { NewProductForm } from "./new-product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return <NewProductForm categories={categories} />;
}
