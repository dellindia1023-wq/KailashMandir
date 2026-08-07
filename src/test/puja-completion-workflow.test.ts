import { describe, expect, it } from "vitest";
import { getCompletionWorkflowSummary, getVisibleCompletionMedia } from "@/lib/pujaCompletion";

describe("puja completion workflow", () => {
  it("marks approved records as shareable to devotees", () => {
    const summary = getCompletionWorkflowSummary({ approval_status: "approved" }, []);

    expect(summary.badgeLabel).toBe("Approved");
    expect(summary.canShowMedia).toBe(true);
  });

  it("filters out hidden and unapproved media from the public view", () => {
    const visible = getVisibleCompletionMedia([
      { id: "1", completion_id: "c1", media_type: "photo", url: "https://example.com/a.jpg", caption: null, approval_status: "approved", is_hidden: false, created_at: "", updated_at: "", uploaded_by: null },
      { id: "2", completion_id: "c1", media_type: "video", url: "https://example.com/b.mp4", caption: null, approval_status: "pending", is_hidden: false, created_at: "", updated_at: "", uploaded_by: null },
      { id: "3", completion_id: "c1", media_type: "certificate", url: "https://example.com/c.pdf", caption: null, approval_status: "approved", is_hidden: true, created_at: "", updated_at: "", uploaded_by: null },
    ]);

    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("1");
  });
});
