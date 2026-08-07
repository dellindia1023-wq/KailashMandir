import { describe, expect, it } from "vitest";
import { getCompletionWorkflowSummary } from "@/lib/pujaCompletion";

describe("getCompletionWorkflowSummary", () => {
  it("marks approved completions as approved", () => {
    const summary = getCompletionWorkflowSummary({ approval_status: "approved" } as any, []);
    expect(summary.badgeLabel).toBe("Approved");
    expect(summary.badgeVariant).toBe("default");
  });

  it("marks pending completions for review", () => {
    const summary = getCompletionWorkflowSummary({ approval_status: "pending" } as any, []);
    expect(summary.badgeLabel).toBe("Pending Review");
    expect(summary.badgeVariant).toBe("secondary");
  });

  it("returns a draft state when nothing has been saved yet", () => {
    const summary = getCompletionWorkflowSummary(null, []);
    expect(summary.badgeLabel).toBe("Draft");
    expect(summary.badgeVariant).toBe("outline");
  });
});
