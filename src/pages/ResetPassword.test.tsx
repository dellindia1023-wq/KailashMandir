import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPassword from "./ResetPassword";

const { getSessionMock, getUserMock, updateUserMock, onAuthStateChangeMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getUserMock: vi.fn(),
  updateUserMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      getUser: getUserMock,
      updateUser: updateUserMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
  },
}));

describe("ResetPassword", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getUserMock.mockReset();
    updateUserMock.mockReset();
    onAuthStateChangeMock.mockReset();
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    getSessionMock.mockResolvedValue({ data: { session: null } });
  });

  it("renders noindex metadata while the recovery session is being verified", () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow"
    );
  });
});
