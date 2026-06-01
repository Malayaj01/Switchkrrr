import { fail, ok } from "@/lib/http";
import { getCurrentUser } from "@/lib/security/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated.", 401);

  const { passwordHash, ...safeUser } = user;
  return ok({ user: safeUser });
}
