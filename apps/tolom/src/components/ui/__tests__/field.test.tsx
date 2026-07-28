import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";

describe("Field", () => {
  it("renders with default orientation", () => {
    render(
      <Field>
        <FieldLabel>Name</FieldLabel>
        <FieldContent>
          <input />
        </FieldContent>
      </Field>,
    );
    const field = document.querySelector("[data-slot='field']");
    expect(field).toBeInTheDocument();
    expect(field).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders with horizontal orientation", () => {
    render(
      <Field orientation="horizontal">
        <FieldLabel>Email</FieldLabel>
        <FieldContent>
          <input />
        </FieldContent>
      </Field>,
    );
    const field = document.querySelector("[data-slot='field']");
    expect(field).toBeInTheDocument();
    expect(field).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders with responsive orientation", () => {
    render(
      <Field orientation="responsive">
        <FieldContent>
          <input />
        </FieldContent>
      </Field>,
    );
    const field = document.querySelector("[data-slot='field']");
    expect(field).toHaveAttribute("data-orientation", "responsive");
  });

  it("renders children correctly", () => {
    render(
      <Field>
        <FieldContent>
          <input data-testid="field-input" />
        </FieldContent>
      </Field>,
    );
    expect(screen.getByTestId("field-input")).toBeInTheDocument();
  });

  it("renders FieldLabel with text", () => {
    render(
      <Field>
        <FieldLabel>Username</FieldLabel>
      </Field>,
    );
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("renders FieldLabel as a label element", () => {
    render(
      <Field>
        <FieldLabel htmlFor="test-input">Label</FieldLabel>
      </Field>,
    );
    const label = document.querySelector("[data-slot='field-label']");
    expect(label?.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "test-input");
  });
});

describe("FieldError", () => {
  it("renders nothing when no errors and no children", () => {
    const { container } = render(<FieldError />);
    // Should render null — check container has no direct content
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when errors array is empty", () => {
    const { container } = render(<FieldError errors={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders single error message", () => {
    render(<FieldError errors={[{ message: "This field is required" }]} />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    const error = document.querySelector("[data-slot='field-error']");
    expect(error).toHaveAttribute("role", "alert");
  });

  it("renders multiple unique error messages as a list", () => {
    render(
      <FieldError
        errors={[{ message: "Required" }, { message: "Too short" }]}
      />,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Too short")).toBeInTheDocument();
    const list = document.querySelector("ul");
    expect(list).toBeInTheDocument();
    expect(list?.className).toContain("list-disc");
  });

  it("deduplicates error messages", () => {
    render(
      <FieldError
        errors={[
          { message: "Required" },
          { message: "Required" },
          { message: "Too short" },
        ]}
      />,
    );
    const list = document.querySelector("ul");
    expect(list?.children.length).toBe(2);
  });

  it("renders children instead of errors when both are provided", () => {
    render(
      <FieldError errors={[{ message: "Hidden error" }]}>
        Custom error message
      </FieldError>,
    );
    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(screen.queryByText("Hidden error")).not.toBeInTheDocument();
  });

  it("renders error with alert role", () => {
    render(<FieldError errors={[{ message: "Error" }]} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("FieldSet and FieldLegend", () => {
  it("renders fieldset and legend", () => {
    render(
      <FieldSet>
        <FieldLegend>Contact Info</FieldLegend>
      </FieldSet>,
    );
    const fieldset = document.querySelector("[data-slot='field-set']");
    expect(fieldset).toBeInTheDocument();
    expect(fieldset?.tagName).toBe("FIELDSET");
    expect(screen.getByText("Contact Info")).toBeInTheDocument();
  });

  it("renders FieldLegend with label variant", () => {
    render(
      <FieldSet>
        <FieldLegend variant="label">Small Label</FieldLegend>
      </FieldSet>,
    );
    const legend = document.querySelector("[data-slot='field-legend']");
    expect(legend).toHaveAttribute("data-variant", "label");
  });
});

describe("FieldDescription", () => {
  it("renders description text", () => {
    render(
      <Field>
        <FieldDescription>Enter your full name</FieldDescription>
      </Field>,
    );
    const desc = document.querySelector("[data-slot='field-description']");
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveTextContent("Enter your full name");
  });
});

describe("FieldSeparator", () => {
  it("renders separator without content", () => {
    render(<FieldSeparator />);
    const sep = document.querySelector("[data-slot='field-separator']");
    expect(sep).toBeInTheDocument();
  });

  it("renders separator with content", () => {
    render(<FieldSeparator>OR</FieldSeparator>);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });
});

describe("FieldGroup", () => {
  it("renders group container", () => {
    render(
      <FieldGroup>
        <FieldContent>Input 1</FieldContent>
        <FieldContent>Input 2</FieldContent>
      </FieldGroup>,
    );
    const group = document.querySelector("[data-slot='field-group']");
    expect(group).toBeInTheDocument();
    expect(group).toHaveTextContent("Input 1");
    expect(group).toHaveTextContent("Input 2");
  });
});
