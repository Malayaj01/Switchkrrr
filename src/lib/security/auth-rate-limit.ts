import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IDENTITY = 5;
/**
 * A single address gets more headroom than a single account, so shared NATs and
 * offices are not locked out by one careless user, while credential stuffing
 * across many accounts from one address still gets stopped.
 */
const MAX_FAILURES_PER_ADDRESS = 20;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

export type AuthAction = "login" | "signup";

/**
 * `x-forwarded-for` is only trustworthy when a proxy we control sets it. Vercel
 * and most managed hosts overwrite it, but when running directly a client can
 * send any value and mint itself a fresh bucket, so honouring it has to be opt
 * in. Set TRUST_PROXY_HEADERS=true only when a trusted proxy sits in front.
 */
function trustsProxyHeaders() {
  return process.env.TRUST_PROXY_HEADERS === "true" || process.env.VERCEL === "1";
}

function clientAddress(request: Request) {
  if (!trustsProxyHeaders()) return "direct";

  const forwarded = request.headers.get("x-forwarded-for");
  // The left-most entry is the original client; everything after it is a proxy.
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function identityKey(request: Request, identity: string) {
  return hash(`identity:${clientAddress(request)}:${identity.trim().toLowerCase()}`);
}

function addressKey(request: Request) {
  return hash(`address:${clientAddress(request)}`);
}

export async function isAuthRateLimited(request: Request, action: AuthAction, identity: string) {
  const key = identityKey(request, identity);
  const addressScopedKey = addressKey(request);
  const since = new Date(Date.now() - WINDOW_MS);

  const [identityFailures, addressFailures] = await Promise.all([
    prisma.authAttempt.count({ where: { key, action, createdAt: { gte: since } } }),
    prisma.authAttempt.count({ where: { key: addressScopedKey, createdAt: { gte: since } } }),
  ]);

  return {
    key,
    addressKey: addressScopedKey,
    limited:
      identityFailures >= MAX_FAILURES_PER_IDENTITY || addressFailures >= MAX_FAILURES_PER_ADDRESS,
  };
}

export async function recordAuthFailure(
  keys: { key: string; addressKey: string },
  action: AuthAction,
  userId?: string,
) {
  await prisma.authAttempt.createMany({
    data: [
      { key: keys.key, action, userId },
      { key: keys.addressKey, action, userId },
    ],
  });

  await pruneOldAttempts();
}

export async function clearAuthFailures(keys: { key: string; addressKey: string }, action: AuthAction) {
  // Only the identity bucket is cleared. The address bucket is deliberately left
  // alone so one valid login does not reset a stuffing run against other accounts.
  await prisma.authAttempt.deleteMany({ where: { key: keys.key, action } });
}

/**
 * Opportunistic cleanup. Rows are only cleared on a successful login for that
 * exact key, so without this the table grows forever from attempts that never
 * succeed. Piggy-backing on failures keeps it free of a scheduled job.
 */
async function pruneOldAttempts() {
  try {
    await prisma.authAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - PRUNE_AFTER_MS) } },
    });
  } catch (error) {
    // Pruning must never turn into a failed auth response.
    console.error("[auth-rate-limit] prune failed", error);
  }
}

export const authRateLimitMessage = "Too many attempts. Please wait 15 minutes before trying again.";
