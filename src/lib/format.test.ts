import { LeadStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  calendarDaysBetween,
  describeFollowUp,
  experienceRange,
  formatEnumLabel,
  formatList,
  leadStatusClassName,
} from "@/lib/format";

describe("formatEnumLabel", () => {
  it("turns a snake-case enum into a readable label", () => {
    expect(formatEnumLabel("TO_APPLY")).toBe("To Apply");
    expect(formatEnumLabel("OFFER")).toBe("Offer");
  });

  it("survives an empty string instead of throwing", () => {
    // The original implementation indexed part[0] and crashed on empty segments.
    expect(formatEnumLabel("")).toBe("");
    expect(formatEnumLabel("__")).toBe("");
  });
});

describe("leadStatusClassName", () => {
  it("groups the promising statuses together", () => {
    expect(leadStatusClassName(LeadStatus.CALLBACK)).toBe("interview");
    expect(leadStatusClassName(LeadStatus.INTERVIEW)).toBe("interview");
    expect(leadStatusClassName(LeadStatus.OFFER)).toBe("interview");
  });

  it("returns a class for every status", () => {
    for (const status of Object.values(LeadStatus)) {
      expect(leadStatusClassName(status)).toBeTruthy();
    }
  });
});

describe("experienceRange", () => {
  it.each([
    [0, "0-3 years"],
    [3, "0-3 years"],
    [4, "4-6 years"],
    [6, "4-6 years"],
    [7, "7-9 years"],
    [9, "7-9 years"],
    [10, "10+ years"],
    [30, "10+ years"],
  ])("buckets %i years as %s", (years, expected) => {
    expect(experienceRange(years)).toBe(expected);
  });

  it("never leaks the exact number, which is the point of the bucket", () => {
    expect(experienceRange(11)).not.toContain("11");
  });
});

describe("formatList", () => {
  it("joins up to the limit", () => {
    expect(formatList(["a", "b", "c"], 2)).toBe("a, b");
  });

  it("returns an empty string for an empty list", () => {
    expect(formatList([])).toBe("");
  });
});

describe("calendarDaysBetween", () => {
  it("ignores the time of day", () => {
    const morning = new Date(2026, 5, 15, 8, 0, 0);
    const lateSameDay = new Date(2026, 5, 15, 23, 30, 0);
    expect(calendarDaysBetween(morning, lateSameDay)).toBe(0);
  });

  it("counts a next-day stamp as one day even a minute apart", () => {
    const beforeMidnight = new Date(2026, 5, 15, 23, 59, 0);
    const afterMidnight = new Date(2026, 5, 16, 0, 1, 0);
    expect(calendarDaysBetween(beforeMidnight, afterMidnight)).toBe(1);
  });

  it("goes negative for past dates", () => {
    expect(calendarDaysBetween(new Date(2026, 5, 15), new Date(2026, 5, 10))).toBe(-5);
  });

  it("spans month boundaries", () => {
    expect(calendarDaysBetween(new Date(2026, 5, 28), new Date(2026, 6, 2))).toBe(4);
  });
});

describe("describeFollowUp", () => {
  const now = new Date(2026, 5, 15, 14, 30);

  it.each([
    [0, "Due today"],
    [1, "Due tomorrow"],
    [5, "Due in 5 days"],
    [-1, "Overdue by 1 day"],
    [-4, "Overdue by 4 days"],
  ])("describes an offset of %i days as %s", (offset, expected) => {
    const target = new Date(2026, 5, 15 + offset, 9, 0);
    expect(describeFollowUp(target, now)).toBe(expected);
  });

  it("uses singular wording at exactly one day overdue", () => {
    const yesterday = new Date(2026, 5, 14, 23, 0);
    expect(describeFollowUp(yesterday, now)).not.toContain("1 days");
  });
});
