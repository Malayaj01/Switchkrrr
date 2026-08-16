import { LeadStatus, PrismaClient, UserRole, VerificationStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/security/password";

const prisma = new PrismaClient();

/** Dates relative to the seed run, so follow-up buckets always have something in them. */
function daysFromNow(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const passwordHash = await hashPassword("Switchkrr@123");

  await prisma.user.upsert({
    where: { email: "admin@switchkrr.test" },
    update: {},
    create: {
      role: UserRole.ADMIN,
      name: "Switchkrr Admin",
      username: "admin",
      email: "admin@switchkrr.test",
      passwordHash,
    },
  });

  const mentors = await Promise.all([
    createMentor({
      name: "Aarav Mehta",
      username: "aarav_mentor",
      email: "aarav@switchkrr.test",
      currentCompany: "Razorpay",
      designation: "Senior Product Manager",
      yearsExperience: 8,
      domain: "Fintech",
      helpCompanies: ["Razorpay", "PhonePe", "Stripe", "Paytm"],
      mentorCode: "SWK-SEED-01",
      bio: "Helps candidates move into product roles across fintech and payments.",
      passwordHash,
    }),
    createMentor({
      name: "Nisha Rao",
      username: "nisha_mentor",
      email: "nisha@switchkrr.test",
      currentCompany: "Google",
      designation: "Staff Software Engineer",
      yearsExperience: 11,
      domain: "SaaS",
      helpCompanies: ["Google", "Microsoft", "Atlassian", "Freshworks"],
      mentorCode: "SWK-SEED-02",
      bio: "Guides software engineers on system design, interview loops, and Big Tech preparation.",
      passwordHash,
    }),
    createMentor({
      name: "Kabir Sethi",
      username: "kabir_mentor",
      email: "kabir@switchkrr.test",
      currentCompany: "Swiggy",
      designation: "Engineering Manager",
      yearsExperience: 9,
      domain: "Consumer apps",
      helpCompanies: ["Swiggy", "Zomato", "Meesho", "Zepto"],
      mentorCode: "SWK-SEED-03",
      bio: "Supports candidates targeting fast-growth consumer internet teams.",
      passwordHash,
    }),
    // Sits in the admin verification queue so the flow can be exercised.
    createMentor({
      name: "Ishita Nair",
      username: "ishita_mentor",
      email: "ishita@switchkrr.test",
      currentCompany: "Freshworks",
      designation: "Product Design Lead",
      yearsExperience: 6,
      domain: "SaaS",
      helpCompanies: ["Freshworks", "Zoho", "Atlassian"],
      mentorCode: "SWK-SEED-04",
      bio: "Design and product mentor for candidates moving into SaaS product teams.",
      verificationStatus: VerificationStatus.PENDING,
      passwordHash,
    }),
    // Rejected: must never appear in candidate recommendations.
    createMentor({
      name: "Rohan Verma",
      username: "rohan_mentor",
      email: "rohan@switchkrr.test",
      currentCompany: "Unverified Consulting",
      designation: "Career Coach",
      yearsExperience: 3,
      domain: "Fintech",
      helpCompanies: ["Paytm"],
      mentorCode: "SWK-SEED-05",
      bio: "Profile could not be verified.",
      verificationStatus: VerificationStatus.REJECTED,
      passwordHash,
    }),
  ]);

  const candidates = await Promise.all([
    createCandidate({
      name: "Riya Sharma",
      username: "riya_candidate",
      email: "riya@switchkrr.test",
      currentCompany: "TCS",
      designation: "Frontend Developer",
      goalRole: "Product Engineer",
      skills: ["React", "TypeScript", "SQL"],
      targetCompanies: ["Google", "Freshworks", "Razorpay"],
      preferredDomains: ["SaaS", "Fintech"],
      preferredLocations: ["Bengaluru", "Remote"],
      passwordHash,
    }),
    createCandidate({
      name: "Dev Patel",
      username: "dev_candidate",
      email: "dev@switchkrr.test",
      currentCompany: "Infosys",
      designation: "Backend Developer",
      goalRole: "Software Engineer 2",
      skills: ["Node.js", "PostgreSQL", "System design"],
      targetCompanies: ["Swiggy", "Zomato", "Zepto"],
      preferredDomains: ["Consumer apps"],
      preferredLocations: ["Bengaluru", "Hyderabad"],
      passwordHash,
    }),
    createCandidate({
      name: "Maya Iyer",
      username: "maya_candidate",
      email: "maya@switchkrr.test",
      currentCompany: "Wipro",
      designation: "Business Analyst",
      goalRole: "Associate Product Manager",
      skills: ["Analytics", "SQL", "User research"],
      targetCompanies: ["Razorpay", "PhonePe", "Paytm"],
      preferredDomains: ["Fintech"],
      preferredLocations: ["Delhi NCR", "Remote"],
      passwordHash,
    }),
  ]);

  const request = await prisma.mentorRequest.upsert({
    where: {
      candidateId_mentorId: {
        candidateId: candidates[0].candidateProfile!.id,
        mentorId: mentors[1].mentorProfile!.id,
      },
    },
    update: {},
    create: {
      candidateId: candidates[0].candidateProfile!.id,
      mentorId: mentors[1].mentorProfile!.id,
      candidateMessage: "I want help preparing for SaaS product engineering interviews.",
      status: "APPROVED",
    },
  });

  await prisma.mentorRequest.upsert({
    where: {
      candidateId_mentorId: {
        candidateId: candidates[2].candidateProfile!.id,
        mentorId: mentors[0].mentorProfile!.id,
      },
    },
    update: {},
    create: {
      candidateId: candidates[2].candidateProfile!.id,
      mentorId: mentors[0].mentorProfile!.id,
      candidateMessage: "I am targeting fintech APM roles and need direction.",
    },
  });

  const hustle = await prisma.hustle.upsert({
    where: {
      candidateId_mentorId: {
        candidateId: candidates[0].candidateProfile!.id,
        mentorId: mentors[1].mentorProfile!.id,
      },
    },
    update: {},
    create: {
      candidateId: candidates[0].candidateProfile!.id,
      mentorId: mentors[1].mentorProfile!.id,
      mentorRequestId: request.id,
    },
  });

  const lead = await prisma.lead.upsert({
    where: { id: "seed-lead-google-product-engineer" },
    update: {},
    create: {
      id: "seed-lead-google-product-engineer",
      hustleId: hustle.id,
      createdById: mentors[1].id,
      company: "Google",
      role: "Product Engineer",
      domain: "SaaS",
      location: "Bengaluru",
      jobLink: "https://careers.google.com/",
      priority: "HIGH",
      status: "APPLIED",
      followUpDate: daysFromNow(-3),
      mentorComment: "Prepare two frontend system design examples before referral.",
    },
  });

  await prisma.progressUpdate.upsert({
    where: { id: "seed-progress-google-applied" },
    update: {},
    create: {
      id: "seed-progress-google-applied",
      leadId: lead.id,
      userId: candidates[0].id,
      oldStatus: "TO_APPLY",
      newStatus: "APPLIED",
      note: "Applied after updating resume and portfolio links.",
    },
  });

  // Spread of statuses and follow-up dates so every dashboard panel has data:
  // one overdue, one due today, one upcoming, plus a terminal offer.
  const extraLeads = [
    {
      id: "seed-lead-atlassian-frontend",
      company: "Atlassian",
      role: "Senior Frontend Engineer",
      status: LeadStatus.INTERVIEW,
      followUpDate: daysFromNow(0),
      mentorComment: "Round 2 is a live coding round. Practise React state edge cases.",
    },
    {
      id: "seed-lead-freshworks-product",
      company: "Freshworks",
      role: "Product Engineer 2",
      status: LeadStatus.TO_APPLY,
      followUpDate: daysFromNow(4),
      mentorComment: "Apply through the referral link before Friday.",
    },
    {
      id: "seed-lead-microsoft-swe",
      company: "Microsoft",
      role: "Software Engineer 2",
      status: LeadStatus.CALLBACK,
      followUpDate: daysFromNow(9),
      mentorComment: "Recruiter will share the loop schedule.",
    },
    {
      id: "seed-lead-zoho-frontend",
      company: "Zoho",
      role: "UI Engineer",
      status: LeadStatus.REJECTED,
      followUpDate: null,
      mentorComment: "Rejected at screening. Not a blocker, keep moving.",
    },
  ];

  for (const item of extraLeads) {
    await prisma.lead.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        hustleId: hustle.id,
        createdById: mentors[1].id,
        company: item.company,
        role: item.role,
        domain: "SaaS",
        location: "Bengaluru",
        priority: "MEDIUM",
        status: item.status,
        followUpDate: item.followUpDate,
        mentorComment: item.mentorComment,
      },
    });
  }

  await prisma.progressUpdate.upsert({
    where: { id: "seed-progress-atlassian-interview" },
    update: {},
    create: {
      id: "seed-progress-atlassian-interview",
      leadId: "seed-lead-atlassian-frontend",
      userId: candidates[0].id,
      oldStatus: LeadStatus.APPLIED,
      newStatus: LeadStatus.INTERVIEW,
      note: "Cleared the screening round.",
    },
  });

  // A second Hustle so the mentor and admin dashboards show more than one row.
  const secondRequest = await prisma.mentorRequest.upsert({
    where: {
      candidateId_mentorId: {
        candidateId: candidates[1].candidateProfile!.id,
        mentorId: mentors[2].mentorProfile!.id,
      },
    },
    update: {},
    create: {
      candidateId: candidates[1].candidateProfile!.id,
      mentorId: mentors[2].mentorProfile!.id,
      candidateMessage: "Looking to move into a consumer internet backend team.",
      status: "APPROVED",
    },
  });

  const secondHustle = await prisma.hustle.upsert({
    where: {
      candidateId_mentorId: {
        candidateId: candidates[1].candidateProfile!.id,
        mentorId: mentors[2].mentorProfile!.id,
      },
    },
    update: {},
    create: {
      candidateId: candidates[1].candidateProfile!.id,
      mentorId: mentors[2].mentorProfile!.id,
      mentorRequestId: secondRequest.id,
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-swiggy-backend" },
    update: {},
    create: {
      id: "seed-lead-swiggy-backend",
      hustleId: secondHustle.id,
      createdById: mentors[2].id,
      company: "Swiggy",
      role: "Backend Engineer 2",
      domain: "Consumer apps",
      location: "Bengaluru",
      priority: "HIGH",
      status: LeadStatus.OFFER,
      mentorComment: "Offer received. Negotiate the joining bonus.",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-zepto-backend" },
    update: {},
    create: {
      id: "seed-lead-zepto-backend",
      hustleId: secondHustle.id,
      createdById: mentors[2].id,
      company: "Zepto",
      role: "SDE 2",
      domain: "Consumer apps",
      location: "Bengaluru",
      priority: "MEDIUM",
      status: LeadStatus.TO_APPLY,
      followUpDate: daysFromNow(-1),
      mentorComment: "Apply today, the posting closes this week.",
    },
  });

  await prisma.progressUpdate.upsert({
    where: { id: "seed-progress-swiggy-offer" },
    update: {},
    create: {
      id: "seed-progress-swiggy-offer",
      leadId: "seed-lead-swiggy-backend",
      userId: candidates[1].id,
      oldStatus: LeadStatus.INTERVIEW,
      newStatus: LeadStatus.OFFER,
      note: "Offer letter received.",
    },
  });
}

async function createMentor(input: {
  name: string;
  username: string;
  email: string;
  currentCompany: string;
  designation: string;
  yearsExperience: number;
  domain: string;
  helpCompanies: string[];
  mentorCode: string;
  bio: string;
  verificationStatus?: VerificationStatus;
  passwordHash: string;
}) {
  const verificationStatus = input.verificationStatus ?? VerificationStatus.VERIFIED;

  return prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      role: UserRole.MENTOR,
      name: input.name,
      username: input.username,
      email: input.email,
      passwordHash: input.passwordHash,
      mentorProfile: {
        create: {
          currentCompany: input.currentCompany,
          designation: input.designation,
          yearsExperience: input.yearsExperience,
          domain: input.domain,
          helpCompanies: input.helpCompanies,
          mentorCode: input.mentorCode,
          bio: input.bio,
          verificationStatus,
          verifiedAt: verificationStatus === VerificationStatus.PENDING ? null : new Date(),
        },
      },
    },
    include: { mentorProfile: true },
  });
}

async function createCandidate(input: {
  name: string;
  username: string;
  email: string;
  currentCompany: string;
  designation: string;
  goalRole: string;
  skills: string[];
  targetCompanies: string[];
  preferredDomains: string[];
  preferredLocations: string[];
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      role: UserRole.CANDIDATE,
      name: input.name,
      username: input.username,
      email: input.email,
      passwordHash: input.passwordHash,
      candidateProfile: {
        create: {
          currentCompany: input.currentCompany,
          designation: input.designation,
          goalRole: input.goalRole,
          skills: input.skills,
          targetCompanies: input.targetCompanies,
          preferredDomains: input.preferredDomains,
          preferredLocations: input.preferredLocations,
          jobTypePreference: "FLEXIBLE",
          profileCompletedAt: new Date(),
        },
      },
    },
    include: { candidateProfile: true },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

