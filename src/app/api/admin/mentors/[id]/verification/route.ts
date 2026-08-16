import { UserRole, VerificationStatus } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { mentorVerificationSchema } from "@/validation/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.ADMIN) return fail("Only admins can verify mentors.", 403);

    const { id } = await context.params;
    const payload = mentorVerificationSchema.parse(await request.json());

    const existing = await prisma.mentorProfile.findUnique({
      where: { id },
      select: { id: true, verificationStatus: true },
    });
    if (!existing) return fail("Mentor not found.", 404);
    if (existing.verificationStatus === payload.status) {
      return fail(`Mentor is already ${payload.status.toLowerCase()}.`, 409);
    }

    // Resetting to PENDING clears the audit trail so the queue shows a clean
    // re-review rather than a stale decision from a previous admin.
    const isReset = payload.status === VerificationStatus.PENDING;

    const mentor = await prisma.mentorProfile.update({
      where: { id },
      data: {
        verificationStatus: payload.status,
        verificationNote: payload.note ? payload.note : null,
        verifiedAt: isReset ? null : new Date(),
        verifiedById: isReset ? null : user.id,
      },
      select: {
        id: true,
        verificationStatus: true,
        verificationNote: true,
        verifiedAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return ok({ mentor });
  } catch (error) {
    return handleRouteError(error);
  }
}
