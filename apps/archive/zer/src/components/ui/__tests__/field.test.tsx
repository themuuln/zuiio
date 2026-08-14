import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../field";

describe("Field components", () => {
  it("renders Field with children", () => {
    render(
      <Field data-testid="field">
        <div>child</div>
      </Field>,
    );
    expect(screen.getByTestId("field")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders FieldLabel with htmlFor", () => {
    render(<FieldLabel htmlFor="email">Имэйл</FieldLabel>);
    const label = screen.getByText("Имэйл");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "email");
  });

  it("renders FieldDescription", () => {
    render(<FieldDescription>Тайлбар</FieldDescription>);
    expect(screen.getByText("Тайлбар")).toBeInTheDocument();
  });

  it("renders FieldGroup and nests Field inside", () => {
    render(
      <FieldGroup data-testid="group">
        <Field>
          <FieldLabel htmlFor="name">Нэр</FieldLabel>
        </Field>
      </FieldGroup>,
    );
    expect(screen.getByTestId("group")).toBeInTheDocument();
    expect(screen.getByText("Нэр")).toBeInTheDocument();
  });
});
