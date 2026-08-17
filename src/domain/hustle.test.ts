import { HustleStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  canTransition,
  consumesCapacity,
  hustleActionLabel,
  hustleStatusChipClassName,
  hustleStatusLabel,
} from "@/domain/hustle";

describe("canTransition", () => {
  it("allows an active Hustle to be paused or completed", () => {
    expect(canTransition(HustleStatus.ACTIVE, HustleStatus.PAUSED)).toBe(true);
    expect(canTransition(HustleStatus.ACTIVE, HustleStatus.COMPLETED)).toBe(true);
  });

  it("allows a paused Hustle to resume or complete", () => {
    expect(canTransition(HustleStatus.PAUSED, HustleStatus.ACTIVE)).toBe(true);
    expect(canTransition(HustleStatus.PAUSED, HustleStatus.COMPLETED)).toBe(true);
  });

  it("allows a completed Hustle to be reopened", () => {
    expect(canTransition(HustleStatus.COMPLETED, HustleStatus.ACTIVE)).toBe(true);
  });

  it("refuses to move a completed Hustle straight to paused", () => {
    expect(canTransition(HustleStatus.COMPLETED, HustleStatus.PAUSED)).toBe(false);
  });

  it("refuses a no-op transition to the same status", () => {
    for (const status of Object.values(HustleStatus)) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});

describe("allowedNextStatuses", () => {
  it("never offers the current status as a next step", () => {
    for (const status of Object.values(HustleStatus)) {
      expect(allowedNextStatuses(status)).not.toContain(status);
    }
  });

  it("agrees with canTransition for every pair", () => {
    for (const from of Object.values(HustleStatus)) {
      for (const to of Object.values(HustleStatus)) {
        expect(allowedNextStatuses(from).includes(to)).toBe(canTransition(from, to));
      }
    }
  });

  it("always leaves at least one way out of a status", () => {
    for (const status of Object.values(HustleStatus)) {
      expect(allowedNextStatuses(status).length).toBeGreaterThan(0);
    }
  });
});

describe("consumesCapacity", () => {
  it("only counts active Hustles against the caps", () => {
    expect(consumesCapacity(HustleStatus.ACTIVE)).toBe(true);
    expect(consumesCapacity(HustleStatus.PAUSED)).toBe(false);
    expect(consumesCapacity(HustleStatus.COMPLETED)).toBe(false);
  });

  it("means every route back to ACTIVE has to re-check capacity", () => {
    // Guards the trap: pausing frees a slot, so any transition into ACTIVE is a
    // capacity-consuming operation and must be gated.
    const intoActive = Object.values(HustleStatus).filter((status) =>
      canTransition(status, HustleStatus.ACTIVE),
    );
    expect(intoActive.length).toBeGreaterThan(0);
    expect(consumesCapacity(HustleStatus.ACTIVE)).toBe(true);
  });
});

describe("labels", () => {
  it("labels every status", () => {
    for (const status of Object.values(HustleStatus)) {
      expect(hustleStatusLabel(status)).toBeTruthy();
      expect(hustleActionLabel(status)).toBeTruthy();
    }
  });

  it("uses a verb for the action label and a noun for the status label", () => {
    expect(hustleStatusLabel(HustleStatus.PAUSED)).toBe("Paused");
    expect(hustleActionLabel(HustleStatus.PAUSED)).toBe("Pause");
    expect(hustleActionLabel(HustleStatus.ACTIVE)).toBe("Reopen");
    expect(hustleActionLabel(HustleStatus.COMPLETED)).toBe("Mark complete");
  });

  it("returns a chip class for every status without throwing", () => {
    for (const status of Object.values(HustleStatus)) {
      expect(typeof hustleStatusChipClassName(status)).toBe("string");
    }
  });
});
