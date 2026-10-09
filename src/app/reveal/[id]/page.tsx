import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Reveal } from "@/components/reveal";
import type { Design } from "@/lib/design";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/reveal/" + id);
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.suspended) notFound();
  const match = await db.match.findUnique({
    where: { id },
    include: {
      collection: true,
      toy: {
        include: {
          design: true,
          secret: true,
          creator: { select: { name: true } },
        },
      },
    },
  });
  if (!match || match.recipientId !== session.user.id) notFound();
  const revealed = match.status === "COMPLETED" && !!match.collection;
  return (
    <Reveal
      id={id}
      status={match.status}
      initial={
        revealed
          ? {
              name: match.toy.name,
              config: match.toy.design!.config as Design,
              creator: match.toy.creator.name,
              secret: match.toy.secret?.text ?? "",
              publicId: match.toy.publicId!,
            }
          : undefined
      }
    />
  );
}
