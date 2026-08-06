import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WelcomeEmail } from "@/lib/email/templates/welcome";

const defaultProps = {
  userName: "Test User",
  loginUrl: "https://tolom.app/login",
};

describe("WelcomeEmail", () => {
  it("renders the heading and preview text", () => {
    render(<WelcomeEmail {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "Welcome to TOLOM" }),
    ).toBeInTheDocument();
    // Preview content is rendered into the hidden <title> element
    expect(document.title).toBe(
      "Welcome to TOLOM — your auto service management platform",
    );
  });

  it("greets the user by name", () => {
    render(<WelcomeEmail {...defaultProps} />);
    expect(screen.getByText("Hi Test User,")).toBeInTheDocument();
  });

  it("renders the account creation copy", () => {
    render(<WelcomeEmail {...defaultProps} />);
    expect(
      screen.getByText(/Your account has been created successfully/),
    ).toBeInTheDocument();
  });

  it("renders the login CTA linking to the login URL", () => {
    render(<WelcomeEmail {...defaultProps} />);
    const cta = screen.getByRole("link", {
      name: "Log in to your account",
    });
    expect(cta).toHaveAttribute("href", "https://tolom.app/login");
    expect(cta).toHaveAttribute("target", "_blank");
  });

  it("renders the help-center and team signature sections", () => {
    render(<WelcomeEmail {...defaultProps} />);
    expect(
      screen.getByText(/If you have any questions, reply to this email/),
    ).toBeInTheDocument();
    expect(screen.getByText("— The TOLOM Team")).toBeInTheDocument();
  });

  it("passes a custom login URL through to the CTA", () => {
    render(
      <WelcomeEmail
        userName="Test User"
        loginUrl="https://auth.tolom.app/login?next=%2Fdashboard"
      />,
    );
    expect(
      screen.getByRole("link", { name: "Log in to your account" }),
    ).toHaveAttribute("href", "https://auth.tolom.app/login?next=%2Fdashboard");
  });

  it("renders without crashing when props are empty strings", () => {
    render(<WelcomeEmail userName="" loginUrl="" />);
    expect(screen.getByText("Hi ,")).toBeInTheDocument();
    // jsdom drops the link role when href is empty, so query the anchor directly
    const cta = screen.getByText("Log in to your account");
    expect(cta.tagName).toBe("A");
    expect(cta).toHaveAttribute("href", "");
    expect(
      screen.getByRole("heading", { name: "Welcome to TOLOM" }),
    ).toBeInTheDocument();
  });
});
