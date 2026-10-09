import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { APIError } from "better-auth/api";
import { designSchema } from "./design";
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "mysql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, minPasswordLength: 10 },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const name = designSchema.shape.name.max(40).safeParse(user.name);
          if (!name.success)
            throw new APIError("BAD_REQUEST", {
              message: "Choose a kind creator name of 1–40 characters.",
            });
          return { data: { ...user, name: name.data } };
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "USER", input: false },
      suspended: { type: "boolean", defaultValue: false, input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 30 },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
