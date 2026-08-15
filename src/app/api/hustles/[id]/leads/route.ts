import { UserRole } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { leadCreateSchema } from "@/validation/lead";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.MENTOR) return fail("Only mentors can add leads.", 403);

    const { id } = await context.params;
    const payload = leadCreateSchema.parse(await request.json());

    const hustle = await prisma.hustle.findUnique({
      where: { id },
      select: {
        id: true,
        mentor: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!hustle) return fail("Hustle not found.", 404);
    if (hustle.mentor.userId !== user.id) return fail("You can only add leads to your own Hustles.", 403);

    const lead = await prisma.lead.create({
      data: {
        hustleId: hustle.id,
        createdById: user.id,
        company: payload.company,
        role: payload.role,
        domain: payload.domain || null,
        location: payload.location || null,
        jobLink: payload.jobLink || null,
        applicationLink: payload.applicationLink || null,
        contactName: payload.contactName || null,
        contactEmail: payload.contactEmail || null,
        priority: payload.priority,
        mentorComment: payload.mentorComment || null,
        followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
      },
    });

    return ok({ lead }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

