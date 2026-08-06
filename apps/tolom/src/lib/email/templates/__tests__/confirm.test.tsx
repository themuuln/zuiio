import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfirmEmail } from "@/lib/email/templates/confirm";

const defaultProps = {
  userName: "Jane Doe",
  confirmationUrl: "https://tolom.app/confirm?token=abc123",
};

describe("ConfirmEmail", () => {
  it("renders the heading and preview text", () => {
    render(<ConfirmEmail {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "Confirm your email" }),
    ).toBeInTheDocument();
    // Preview content is rendered into the hidden <title> element
    expect(document.title).toBe("Confirm your email address for TOLOM");
  });

  it("greets the user by name", () => {
    render(<ConfirmEmail {...defaultProps} />);
    expect(screen.getByText("Hi Jane Doe,")).toBeInTheDocument();
  });

  it("renders the confirmation explanation copy", () => {
    render(<ConfirmEmail {...defaultProps} />);
    expect(
      screen.getByText(/Please confirm your email address by clicking/),
    ).toBeInTheDocument();
  });

  it("renders the confirmation CTA linking to the confirmation URL", () => {
    render(<ConfirmEmail {...defaultProps} />);
    const cta = screen.getByRole("link", {
      name: "Confirm email address",
    });
    expect(cta).toHaveAttribute(
      "href",
      "https://tolom.app/confirm?token=abc123",
    );
    expect(cta).toHaveAttribute("target", "_blank");
  });

  it("renders the ignore and team signature sections", () => {
    render(<ConfirmEmail {...defaultProps} />);
    expect(
      screen.getByText(/If you didn't create a TOLOM account/),
    ).toBeInTheDocument();
    expect(screen.getByText("— The TOLOM Team")).toBeInTheDocument();
  });

  it("passes a custom confirmation URL through to the CTA", () => {
    render(
      <ConfirmEmail
        userName="Jane Doe"
        confirmationUrl="https://auth.tolom.app/verify?email=jane%40example.com&code=xyz"
      />,
    );
    expect(
      screen.getByRole("link", { name: "Confirm email address" }),
    ).toHaveAttribute(
      "href",
      "https://auth.tolom.app/verify?email=jane%40example.com&code=xyz",
    );
  });

  it("renders without crashing when props are empty strings", () => {
    render(<ConfirmEmail userName="" confirmationUrl="" />);
    expect(screen.getByText("Hi ,")).toBeInTheDocument();
    // jsdom drops the link role when href is empty, so query the anchor directly
    const cta = screen.getByText("Confirm email address");
    expect(cta.tagName).toBe("A");
    expect(cta).toHaveAttribute("href", "");
    expect(
      screen.getByRole("heading", { name: "Confirm your email" }),
    ).toBeInTheDocument();
  });
});
