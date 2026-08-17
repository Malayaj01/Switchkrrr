import { LeadStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  bucketFollowUps,
  openLeadStatuses,
  resolveCandidateNextAction,
  resolveMentorNextAction,
  summarizeLeads,
  toCapacity,
} from "@/domain/dashboard";

function lead(status: LeadStatus, followUpDate: Date | null = null) {
  return { status, followUpDate };
}

/** Fixed reference point so these tests never depend on the day they run. */
const now = new Date("2026-06-15T14:30:00.000Z");
const daysFrom = (days: number) => new Date("2026-06-15T12:00:00.000Z").getTime() + days * 86_400_000;
const at = (days: number) => new Date(daysFrom(days));

describe("summarizeLeads", () => {
  it("returns zeroed counts for an empty list", () => {
    const summary = summarizeLeads([]);
    expect(summary.total).toBe(0);
    expect(summary.open).toBe(0);
    expect(summary.offers).toBe(0);
    expect(Object.values(summary.byStatus).every((count) => count === 0)).toBe(true);
  });

  it("excludes terminal statuses from the open count", () => {
    const summary = summarizeLeads([
      lead(LeadStatus.TO_APPLY),
      lead(LeadStatus.APPLIED),
      lead(LeadStatus.CALLBACK),
      lead(LeadStatus.INTERVIEW),
      lead(LeadStatus.OFFER),
      lead(LeadStatus.REJECTED),
    ]);

    expect(summary.total).toBe(6);
    // This is the bug the original dashboard had: offers and rejections were
    // being counted as open work.
    expect(summary.open).toBe(4);
    expect(summary.offers).toBe(1);
    expect(summary.rejected).toBe(1);
  });

  it("counts callbacks and interviews as in process", () => {
    const summary = summarizeLeads([
      lead(LeadStatus.CALLBACK),
      lead(LeadStatus.CALLBACK),
      lead(LeadStatus.INTERVIEW),
      lead(LeadStatus.APPLIED),
    ]);
    expect(summary.inProcess).toBe(3);
    expect(summary.applied).toBe(1);
  });

  it("keeps openLeadStatuses and the open count consistent", () => {
    const summary = summarizeLeads(openLeadStatuses.map((status) => lead(status)));
    expect(summary.open).toBe(openLeadStatuses.length);
  });
});

describe("bucketFollowUps", () => {
  it("ignores leads with no follow-up date", () => {
    const buckets = bucketFollowUps([lead(LeadStatus.APPLIED)], now);
    expect(buckets.all).toHaveLength(0);
  });

  it("ignores follow-ups on terminal leads", () => {
    // A won or lost lead with a stale date is not an action item.
    const buckets = bucketFollowUps(
      [lead(LeadStatus.OFFER, at(-5)), lead(LeadStatus.REJECTED, at(-5))],
      now,
    );
    expect(buckets.overdue).toHaveLength(0);
    expect(buckets.all).toHaveLength(0);
  });

  it("splits overdue, due today and upcoming", () => {
    const overdue = lead(LeadStatus.APPLIED, at(-3));
    const today = lead(LeadStatus.APPLIED, at(0));
    const soon = lead(LeadStatus.APPLIED, at(4));
    const buckets = bucketFollowUps([soon, overdue, today], now);

    expect(buckets.overdue).toEqual([overdue]);
    expect(buckets.dueToday).toEqual([today]);
    expect(buckets.upcoming).toEqual([soon]);
    expect(buckets.due).toEqual([overdue, today]);
  });

  it("orders everything earliest first", () => {
    const buckets = bucketFollowUps(
      [lead(LeadStatus.APPLIED, at(6)), lead(LeadStatus.APPLIED, at(-2)), lead(LeadStatus.APPLIED, at(1))],
      now,
    );
    const dates = buckets.all.map((item) => item.followUpDate!.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });

  it("excludes follow-ups beyond the upcoming window", () => {
    const buckets = bucketFollowUps([lead(LeadStatus.APPLIED, at(40))], now, 14);
    expect(buckets.all).toHaveLength(0);
  });

  it("treats a follow-up later today as due today, not overdue", () => {
    // now is 14:30; a 12:00 stamp on the same date must still read as due today.
    const buckets = bucketFollowUps([lead(LeadStatus.APPLIED, at(0))], now);
    expect(buckets.overdue).toHaveLength(0);
    expect(buckets.dueToday).toHaveLength(1);
  });
});

describe("toCapacity", () => {
  it("reports remaining slots and percent", () => {
    const capacity = toCapacity(2, 5);
    expect(capacity.remaining).toBe(3);
    expect(capacity.percent).toBe(40);
    expect(capacity.isFull).toBe(false);
    expect(capacity.label).toBe("2 / 5");
  });

  it("flags full at the limit", () => {
    expect(toCapacity(5, 5).isFull).toBe(true);
    expect(toCapacity(5, 5).remaining).toBe(0);
  });

  it("never reports negative remaining or over 100 percent when over the cap", () => {
    const capacity = toCapacity(9, 5);
    expect(capacity.remaining).toBe(0);
    expect(capacity.percent).toBe(100);
    expect(capacity.isFull).toBe(true);
  });

  it("warns before it blocks", () => {
    expect(toCapacity(9, 10).isNearlyFull).toBe(true);
    expect(toCapacity(1, 10).isNearlyFull).toBe(false);
    // Full is not "nearly full" — it is a different message.
    expect(toCapacity(10, 10).isNearlyFull).toBe(false);
  });

  it("does not divide by zero when the cap is zero", () => {
    expect(toCapacity(0, 0).percent).toBe(0);
  });
});

describe("resolveCandidateNextAction", () => {
  const base = {
    profileCompleted: true,
    activeHustles: 1,
    pendingRequests: 0,
    leadsToApply: 0,
    followUpsDue: 0,
  };

  it("puts profile completion above everything else", () => {
    const action = resolveCandidateNextAction({
      ...base,
      profileCompleted: false,
      followUpsDue: 5,
    });
    expect(action.href).toBe("/dashboard/profile");
  });

  it("prioritises due follow-ups over new applications", () => {
    const action = resolveCandidateNextAction({ ...base, followUpsDue: 2, leadsToApply: 3 });
    expect(action.title).toContain("2 follow-ups");
  });

  it("sends a candidate with no mentor to discovery", () => {
    const action = resolveCandidateNextAction({ ...base, activeHustles: 0 });
    expect(action.href).toBe("/dashboard/mentors");
  });

  it("tells a candidate waiting on approval to sit tight", () => {
    const action = resolveCandidateNextAction({ ...base, activeHustles: 0, pendingRequests: 2 });
    expect(action.href).toBe("/dashboard/requests");
  });

  it("uses singular wording for one item", () => {
    expect(resolveCandidateNextAction({ ...base, followUpsDue: 1 }).title).toBe("Chase 1 follow-up");
    expect(resolveCandidateNextAction({ ...base, leadsToApply: 1 }).title).toBe("Apply to 1 lead");
  });

  it("always returns something actionable", () => {
    const action = resolveCandidateNextAction(base);
    expect(action.title).not.toBe("");
    expect(action.href).toBeTruthy();
    expect(action.cta).toBeTruthy();
  });
});

describe("resolveMentorNextAction", () => {
  const base = {
    isVerified: true,
    pendingRequests: 0,
    followUpsDue: 0,
    hustlesWithoutLeads: 0,
  };

  it("surfaces verification above all other work", () => {
    const action = resolveMentorNextAction({ ...base, isVerified: false, pendingRequests: 4 });
    expect(action.title).toBe("Verification pending");
  });

  it("prioritises pending requests over follow-ups", () => {
    const action = resolveMentorNextAction({ ...base, pendingRequests: 3, followUpsDue: 9 });
    expect(action.title).toContain("3 requests");
  });

  it("nudges mentors whose Hustles have no leads", () => {
    const action = resolveMentorNextAction({ ...base, hustlesWithoutLeads: 2 });
    expect(action.title).toContain("2 candidates");
  });

  it("says so when there is nothing to do", () => {
    expect(resolveMentorNextAction(base).title).toBe("You are all caught up");
  });
});
