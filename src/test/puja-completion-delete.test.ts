import { describe, it, expect } from "vitest";
import { extractStorageObjectPath } from "@/lib/pujaCompletion";

describe("puja completion media deletion helpers", () => {
  it("extracts the storage object path from a public Supabase URL", () => {
    const url = "https://xyz.supabase.co/storage/v1/object/public/content/booking-123/photo/abc123.png";

    expect(extractStorageObjectPath(url)).toBe("booking-123/photo/abc123.png");
  });

  it("returns null for URLs that do not belong to the content bucket", () => {
    const url = "https://example.com/assets/image.png";

    expect(extractStorageObjectPath(url)).toBeNull();
  });
});
