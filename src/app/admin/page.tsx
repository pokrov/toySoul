import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Admin } from "@/components/admin";
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/admin");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN" || user.suspended) notFound();
  return <Admin />;
}
