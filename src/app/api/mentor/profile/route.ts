import { UserRole } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { mentorProfileSchema } from "@/validation/mentor-profile";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.MENTOR) return fail("Only mentors can update this profile.", 403);
    const payload = mentorProfileSchema.parse(await request.json());
    const profile = await prisma.mentorProfile.update({
      where: { userId: user.id },
      data: { ...payload, linkedinUrl: payload.linkedinUrl || null, bio: payload.bio || null },
    });
    return ok({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
