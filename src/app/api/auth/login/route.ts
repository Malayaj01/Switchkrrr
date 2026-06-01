import { handleRouteError, fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/security/password";
import { createSession } from "@/lib/security/session";
import { loginSchema } from "@/validation/auth";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const identity = payload.emailOrUsername.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identity }, { username: payload.emailOrUsername }],
      },
      include: {
        mentorProfile: true,
        candidateProfile: true,
      },
    });

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      return fail("Invalid email, username, or password.", 401);
    }

    await createSession(user.id);

    return ok({ user: sanitizeUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}

function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
