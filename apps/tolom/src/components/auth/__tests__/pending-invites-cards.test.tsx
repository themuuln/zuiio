import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PendingInvitesCards } from "../pending-invites-cards";

const hooks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hooks.push }),
}));

const COPY = {
  title: "Invitations",
  description: "Accept an invite to join",
  accept: "Accept",
};

describe("PendingInvitesCards", () => {
  beforeEach(() => {
    hooks.push.mockClear();
  });

  it("renders nothing when there are no invites", () => {
    render(<PendingInvitesCards invites={[]} copy={COPY} />);
    expect(screen.queryByText(COPY.title)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: COPY.accept }),
    ).not.toBeInTheDocument();
  });

  it("renders invite cards with org and inviter names", () => {
    render(
      <PendingInvitesCards
        invites={[
          {
            token: "tok-1",
            organization_name: "Acme Garage",
            inviter_name: "Bold",
          },
          {
            token: "tok-2",
            organization_name: "Solo Shop",
            inviter_name: null,
          },
        ]}
        copy={COPY}
      />,
    );

    expect(screen.getByText(COPY.title)).toBeInTheDocument();
    expect(screen.getByText("Acme Garage")).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Solo Shop")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: COPY.accept })).toHaveLength(
      2,
    );
  });

  it("navigates to the invite page when accepting", async () => {
    const user = userEvent.setup();
    render(
      <PendingInvitesCards
        invites={[
          {
            token: "tok-9",
            organization_name: "Acme Garage",
            inviter_name: null,
          },
        ]}
        copy={COPY}
      />,
    );

    await user.click(screen.getByRole("button", { name: COPY.accept }));
    expect(hooks.push).toHaveBeenCalledWith("/invite/tok-9");
  });
});
