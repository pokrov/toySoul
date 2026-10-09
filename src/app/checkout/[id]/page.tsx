import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { price } from "@/lib/services";
import { Checkout } from "@/components/checkout";
import type { Design } from "@/lib/design";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/checkout/" + id);
  const toy = await db.toy.findUnique({
    where: { id },
    include: { design: true, payment: true, entry: true },
  });
  if (!toy || toy.creatorId !== session.user.id) notFound();
  if (toy.status === "DRAFT") redirect("/studio?id=" + id);
  return (
    <Checkout
      toy={{
        id: toy.id,
        name: toy.name,
        config: toy.design!.config as Design,
        status: toy.payment?.status ?? "PENDING",
        amount: toy.payment!.amount,
        joined: !!toy.entry,
      }}
      price={price()}
    />
  );
}
