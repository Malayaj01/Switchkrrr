import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "switchkrr_session";
const SESSION_DURATION_DAYS = 14;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });

  const jwt = await new SignJWT({ token: rawToken })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SESSION_COOKIE)?.value;

  if (jwt) {
    try {
      const payload = await verifySessionToken(jwt);
      const token = String(payload.token || "");
      if (token) {
        await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
      }
    } catch {
      // Invalid cookies are cleared below.
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;

  try {
    const payload = await verifySessionToken(jwt);
    const token = String(payload.token || "");
    const userId = String(payload.sub || "");

    if (!token || !userId) return null;

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          include: {
            mentorProfile: true,
            candidateProfile: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || session.userId !== userId) return null;

    return session.user;
  } catch {
    return null;
  }
}

async function verifySessionToken(jwt: string) {
  const { payload } = await jwtVerify(jwt, secretKey());
  return payload;
}
