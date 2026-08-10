import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExampleCustomerForm } from "@/components/examples/example-customer-form";

describe("ExampleCustomerForm", () => {
  it("renders all fields and the submit button", () => {
    render(<ExampleCustomerForm />);
    expect(screen.getByPlaceholderText("Бат-Эрдэнэ")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("99112233")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("optional@example.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Customer" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty required fields", async () => {
    render(<ExampleCustomerForm />);
    fireEvent.click(screen.getByRole("button", { name: "Create Customer" }));

    expect(
      await screen.findByText("Name must be at least 2 characters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid Mongolian phone number (8 digits)"),
    ).toBeInTheDocument();
  });

  it("accepts a valid Mongolian name and phone number", async () => {
    render(<ExampleCustomerForm />);
    fireEvent.change(screen.getByPlaceholderText("Бат-Эрдэнэ"), {
      target: { value: "Бат-Эрдэнэ" },
    });
    fireEvent.change(screen.getByPlaceholderText("99112233"), {
      target: { value: "99112233" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Customer" }));

    expect(
      screen.queryByText("Name must be at least 2 characters"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Enter a valid Mongolian phone number (8 digits)"),
    ).not.toBeInTheDocument();
  });

  it("rejects an invalid phone number", async () => {
    render(<ExampleCustomerForm />);
    fireEvent.change(screen.getByPlaceholderText("Бат-Эрдэнэ"), {
      target: { value: "Бат" },
    });
    fireEvent.change(screen.getByPlaceholderText("99112233"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Customer" }));

    expect(
      await screen.findByText(
        "Enter a valid Mongolian phone number (8 digits)",
      ),
    ).toBeInTheDocument();
  });
});
