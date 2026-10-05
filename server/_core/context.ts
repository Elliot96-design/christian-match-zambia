import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { getBearerToken, verifyAuthToken } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  let user: User | null = null;
  const token = getBearerToken(opts.req.headers.authorization);
  if (token) {
    const payload = await verifyAuthToken(token);
    if (payload) user = (await getUserById(payload.userId)) ?? null;
  }
  return { req: opts.req, res: opts.res, user };
}
