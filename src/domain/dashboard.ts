import { LeadStatus } from "@prisma/client";

/** A lead only needs these fields to be summarised, so pages can select narrowly. */
export type LeadSummaryInput = {
  status: LeadStatus;
  followUpDate: Date | null;
};

/**
 * Statuses that still need work from the candidate or mentor. `OFFER` and
 * `REJECTED` are terminal, so they are excluded from "open" counts.
 */
export const openLeadStatuses: LeadStatus[] = [
  LeadStatus.TO_APPLY,
  LeadStatus.APPLIED,
  LeadStatus.CALLBACK,
  LeadStatus.INTERVIEW,
];

export type LeadBreakdown = {
  total: number;
  open: number;
  toApply: number;
  applied: number;
  inProcess: number;
  offers: number;
  rejected: number;
  byStatus: Record<LeadStatus, number>;
};

export function summarizeLeads(leads: LeadSummaryInput[]): LeadBreakdown {
  const byStatus = Object.values(LeadStatus).reduce(
    (accumulator, status) => {
      accumulator[status] = 0;
      return accumulator;
    },
    {} as Record<LeadStatus, number>,
  );

  for (const lead of leads) {
    byStatus[lead.status] += 1;
  }

  return {
    total: leads.length,
    open: openLeadStatuses.reduce((total, status) => total + byStatus[status], 0),
    toApply: byStatus.TO_APPLY,
    applied: byStatus.APPLIED,
    inProcess: byStatus.CALLBACK + byStatus.INTERVIEW,
    offers: byStatus.OFFER,
    rejected: byStatus.REJECTED,
    byStatus,
  };
}

export type FollowUpBuckets<T> = {
  overdue: T[];
  dueToday: T[];
  upcoming: T[];
  /** Overdue + due today: the ones that need attention right now. */
  due: T[];
  /** Everything still open, earliest first — the list the dashboards render. */
  all: T[];
};

/**
 * Splits leads into follow-up buckets against `now`. Terminal leads are ignored:
 * a rejected or won lead with a stale follow-up date is not an action item.
 */
export function bucketFollowUps<T extends LeadSummaryInput>(
  leads: T[],
  now: Date,
  upcomingWindowDays = 14,
): FollowUpBuckets<T> {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000 - 1);
  const windowEnd = new Date(startOfToday.getTime() + upcomingWindowDays * 86_400_000);

  const actionable = leads
    .filter((lead) => lead.followUpDate !== null && openLeadStatuses.includes(lead.status))
    .sort((left, right) => left.followUpDate!.getTime() - right.followUpDate!.getTime());

  const overdue = actionable.filter((lead) => lead.followUpDate! < startOfToday);
  const dueToday = actionable.filter(
    (lead) => lead.followUpDate! >= startOfToday && lead.followUpDate! <= endOfToday,
  );
  const upcoming = actionable.filter(
    (lead) => lead.followUpDate! > endOfToday && lead.followUpDate! <= windowEnd,
  );

  return {
    overdue,
    dueToday,
    upcoming,
    due: [...overdue, ...dueToday],
    all: [...overdue, ...dueToday, ...upcoming],
  };
}

export type Capacity = {
  used: number;
  max: number;
  remaining: number;
  percent: number;
  isFull: boolean;
  /** True once the last slot or two are gone, so the UI can warn before it blocks. */
  isNearlyFull: boolean;
  label: string;
};

export function toCapacity(used: number, max: number): Capacity {
  const remaining = Math.max(0, max - used);
  const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;

  return {
    used,
    max,
    remaining,
    percent,
    isFull: used >= max,
    isNearlyFull: remaining > 0 && remaining <= Math.max(1, Math.round(max * 0.2)),
    label: `${used} / ${max}`,
  };
}

export type NextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

/**
 * The single most useful thing a candidate can do next. Ordered by what unblocks
 * the rest of the journey: profile, then a mentor, then the leads they already have.
 */
export function resolveCandidateNextAction(input: {
  profileCompleted: boolean;
  activeHustles: number;
  pendingRequests: number;
  leadsToApply: number;
  followUpsDue: number;
}): NextAction {
  if (!input.profileCompleted) {
    return {
      title: "Complete your profile",
      description: "Mentor matching stays locked until your skills, targets and preferences are filled in.",
      href: "/dashboard/profile",
      cta: "Complete profile",
    };
  }

  if (input.followUpsDue > 0) {
    return {
      title: `Chase ${input.followUpsDue} follow-up${input.followUpsDue === 1 ? "" : "s"}`,
      description: "These leads have a follow-up date that has arrived or passed.",
      href: "/dashboard/hustles",
      cta: "Open Hustles",
    };
  }

  if (input.activeHustles === 0 && input.pendingRequests === 0) {
    return {
      title: "Find a mentor",
      description: "Browse anonymised mentor previews and send a request to start your first Hustle.",
      href: "/dashboard/mentors",
      cta: "Find mentors",
    };
  }

  if (input.activeHustles === 0) {
    return {
      title: "Wait for mentor approval",
      description: `${input.pendingRequests} request${input.pendingRequests === 1 ? " is" : "s are"} pending. A Hustle opens as soon as one is approved.`,
      href: "/dashboard/requests",
      cta: "View requests",
    };
  }

  if (input.leadsToApply > 0) {
    return {
      title: `Apply to ${input.leadsToApply} lead${input.leadsToApply === 1 ? "" : "s"}`,
      description: "Your mentor has posted leads that you have not applied to yet.",
      href: "/dashboard/hustles",
      cta: "Open Hustles",
    };
  }

  return {
    title: "Keep your leads up to date",
    description: "Move leads forward as you hear back, so your mentor can see where to help.",
    href: "/dashboard/hustles",
    cta: "Open Hustles",
  };
}

/** The mentor equivalent: requests first, then follow-ups, then idle candidates. */
export function resolveMentorNextAction(input: {
  isVerified: boolean;
  pendingRequests: number;
  followUpsDue: number;
  hustlesWithoutLeads: number;
}): NextAction {
  if (!input.isVerified) {
    return {
      title: "Verification pending",
      description: "An admin still has to verify your mentor profile. You stay hidden from new candidates until then.",
      href: "/dashboard/profile",
      cta: "Review profile",
    };
  }

  if (input.pendingRequests > 0) {
    return {
      title: `Review ${input.pendingRequests} request${input.pendingRequests === 1 ? "" : "s"}`,
      description: "Candidates are waiting on a decision. Approving one opens a Hustle workspace.",
      href: "/dashboard/requests",
      cta: "Review requests",
    };
  }

  if (input.followUpsDue > 0) {
    return {
      title: `${input.followUpsDue} follow-up${input.followUpsDue === 1 ? "" : "s"} due`,
      description: "Leads across your Hustles have hit their follow-up date.",
      href: "/dashboard/hustles",
      cta: "Open Hustles",
    };
  }

  if (input.hustlesWithoutLeads > 0) {
    return {
      title: `Post leads for ${input.hustlesWithoutLeads} candidate${input.hustlesWithoutLeads === 1 ? "" : "s"}`,
      description: "These Hustles have no leads yet, so the candidate has nothing to work on.",
      href: "/dashboard/hustles",
      cta: "Open Hustles",
    };
  }

  return {
    title: "You are all caught up",
    description: "No pending requests and no follow-ups due. Check in on candidate progress when you can.",
    href: "/dashboard/hustles",
    cta: "Open Hustles",
  };
}
