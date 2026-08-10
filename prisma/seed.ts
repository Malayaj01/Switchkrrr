import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/security/password";

const prisma = new PrismaClient();

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
  passwordHash: string;
}) {
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
          verificationStatus: "VERIFIED",
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

