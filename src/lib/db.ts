import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
function makeClient() {
  const url = new URL(
    process.env.DATABASE_URL ??
      "mysql://soultoy:soultoy_local@127.0.0.1:3306/soultoy",
  );
  return new PrismaClient({
    adapter: new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      connectionLimit: 8,
      connectTimeout: 10000,
    }),
  });
}
export const db = globalDb.prisma ?? makeClient();
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
