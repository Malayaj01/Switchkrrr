import { HustleStatus, UserRole, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { platformLimits } from "@/domain/limits";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

const schema = z.object({ mentorId: z.string().min(1) });
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser(); if (!user) return fail("Not authenticated.", 401); if (user.role !== UserRole.ADMIN) return fail("Only admins can reassign Hustles.", 403);
    const { id } = await context.params; const { mentorId } = schema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const hustle = await tx.hustle.findUnique({ where: { id }, include: { mentor: { select: { verificationStatus: true } } } });
      if (!hustle) throw new Error("Hustle not found.");
      if (hustle.mentor.verificationStatus !== VerificationStatus.REJECTED) throw new Error("Only Hustles owned by rejected mentors can be reassigned.");
      const mentor = await tx.mentorProfile.findUnique({ where: { id: mentorId }, select: { id: true, verificationStatus: true } });
      if (!mentor || mentor.verificationStatus !== VerificationStatus.VERIFIED) throw new Error("Choose a verified mentor.");
      if (hustle.status === HustleStatus.ACTIVE && await tx.hustle.count({ where: { mentorId, status: HustleStatus.ACTIVE } }) >= platformLimits.maxActiveHustlesPerMentor) throw new Error("That mentor is at capacity.");
      return tx.hustle.update({ where: { id }, data: { mentorId }, select: { id: true, mentorId: true, updatedAt: true } });
    });
    return ok({ hustle: result });
  } catch (error) { return handleRouteError(error); }
}
