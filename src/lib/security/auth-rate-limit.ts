import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function attemptKey(request: Request, identity: string) {
  return createHash("sha256").update(`${clientAddress(request)}:${identity.toLowerCase()}`).digest("hex");
}

export async function isAuthRateLimited(request: Request, action: "login" | "signup", identity: string) {
  const key = attemptKey(request, identity);
  const failures = await prisma.authAttempt.count({
    where: { key, action, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
  });
  return { key, limited: failures >= MAX_FAILURES };
}

export async function recordAuthFailure(key: string, action: "login" | "signup", userId?: string) {
  await prisma.authAttempt.create({ data: { key, action, userId } });
}

export async function clearAuthFailures(key: string, action: "login" | "signup") {
  await prisma.authAttempt.deleteMany({ where: { key, action } });
}

export const authRateLimitMessage = "Too many attempts. Please wait 15 minutes before trying again.";
