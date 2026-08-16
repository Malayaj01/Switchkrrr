import { UserRole } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { leadStatusUpdateSchema } from "@/validation/lead";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.CANDIDATE) return fail("Only candidates can update lead progress.", 403);

    const { id } = await context.params;
    const payload = leadStatusUpdateSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id },
        include: {
          hustle: {
            select: {
              status: true,
              candidate: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!lead) throw new LeadUpdateError("Lead not found.", 404);
      if (lead.hustle.candidate.userId !== user.id) {
        throw new LeadUpdateError("You can only update leads assigned to your Hustles.", 403);
      }
      if (lead.hustle.status !== "ACTIVE") {
        throw new LeadUpdateError("Lead progress can only be updated in an active Hustle.", 409);
      }

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: payload.status,
          candidateComment: payload.candidateComment || lead.candidateComment,
        },
      });

      const progressUpdate =
        lead.status === payload.status && !payload.note
          ? null
          : await tx.progressUpdate.create({
              data: {
                leadId: lead.id,
                userId: user.id,
                oldStatus: lead.status,
                newStatus: payload.status,
                note: payload.note || null,
              },
            });

      return { lead: updatedLead, progressUpdate };
    });

    return ok(result);
  } catch (error) {
    if (error instanceof LeadUpdateError) return fail(error.message, error.status);
    return handleRouteError(error);
  }
}

class LeadUpdateError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
