import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { rankMentorsForCandidate } from "@/domain/matching";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated.", 401);
  if (user.role !== UserRole.CANDIDATE) return fail("Only candidates can view mentor recommendations.", 403);

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    include: {
      mentorRequests: {
        select: {
          mentorId: true,
          status: true,
        },
      },
    },
  });
  if (!candidate) return fail("Candidate profile not found.", 404);

  const mentors = await prisma.mentorProfile.findMany({
    where: {
      userId: { not: user.id },
    },
    orderBy: [{ verificationStatus: "asc" }, { yearsExperience: "desc" }],
  });

  const requestByMentorId = new Map(candidate.mentorRequests.map((request) => [request.mentorId, request.status]));
  const rankedMentors = rankMentorsForCandidate(candidate, mentors).map(({ mentor, score, reasons }) => ({
    id: mentor.id,
    domain: mentor.domain,
    designation: anonymizeDesignation(mentor.designation),
    experienceRange: toExperienceRange(mentor.yearsExperience),
    companySignal: mentor.helpCompanies.slice(0, 3),
    currentCompanyType: toCompanyType(mentor.currentCompany),
    verificationStatus: mentor.verificationStatus,
    score,
    reasons,
    requestStatus: requestByMentorId.get(mentor.id) ?? null,
  }));

  return ok({ mentors: rankedMentors });
}

function anonymizeDesignation(designation: string) {
  if (/manager|lead|head/i.test(designation)) return "Leadership mentor";
  if (/product/i.test(designation)) return "Product mentor";
  if (/engineer|developer|architect/i.test(designation)) return "Engineering mentor";
  return "Career mentor";
}

function toExperienceRange(years: number) {
  if (years >= 10) return "10+ years";
  if (years >= 7) return "7-9 years";
  if (years >= 4) return "4-6 years";
  return "0-3 years";
}

function toCompanyType(company: string) {
  if (/google|microsoft|amazon|meta|apple/i.test(company)) return "Big Tech";
  if (/razorpay|phonepe|paytm|stripe/i.test(company)) return "Fintech";
  if (/swiggy|zomato|zepto|meesho/i.test(company)) return "Consumer internet";
  return "Growth company";
}

