import { ok } from "@/lib/http";
import { destroySession } from "@/lib/security/session";

export async function POST() {
  await destroySession();
  return ok({ success: true });
}
