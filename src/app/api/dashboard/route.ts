import { NextRequest } from "next/server";
import { actor, endpoint } from "@/lib/http";
import { db } from "@/lib/db";
export async function GET(req: NextRequest) {
  return endpoint(async () => {
    const user = await actor(req);
    const [toys, sent, incoming, collection, notifications, count] =
      await Promise.all([
        db.toy.findMany({
          where: { creatorId: user.id },
          include: { design: true, payment: true, entry: true },
          orderBy: { createdAt: "desc" },
        }),
        db.match.findMany({
          where: { senderId: user.id },
          include: {
            toy: { select: { name: true, publicId: true } },
            shipment: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        db.match.findMany({
          where: {
            recipientId: user.id,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            history: true,
            shipment: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        db.collectionEntry.findMany({
          where: { userId: user.id },
          include: {
            match: {
              include: {
                toy: {
                  include: {
                    design: true,
                    secret: true,
                    creator: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { revealedAt: "desc" },
        }),
        db.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.exchangePoolEntry.count({
          where: {
            status: "WAITING",
            user: { suspended: false },
            toy: {
              moderated: false,
              status: "READY",
              payment: { status: "PAID" },
              match: null,
            },
          },
        }),
      ]);
    // Only the creator sees their own toy; incoming payloads deliberately contain no toy or sender IDs.
    return {
      user: { id: user.id, name: user.name, role: user.role },
      toys,
      sent: sent.map(({ recipientId: _, ...m }) => m),
      incoming,
      collection,
      notifications,
      poolCount: count,
    };
  });
}
