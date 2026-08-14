import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

function renderOtp({
  value = "",
  onChange,
  maxLength = 6,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}) {
  const slots = Array.from({ length: maxLength }, (_, index) => (
    <InputOTPSlot key={index} index={index} />
  ));
  return render(
    <InputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange ?? (() => {})}
      disabled={disabled}
    >
      <InputOTPGroup>
        {slots.slice(0, 3)}
        <InputOTPSeparator />
        {slots.slice(3)}
      </InputOTPGroup>
    </InputOTP>,
  );
}

describe("InputOTP", () => {
  it("renders the OTP input and the expected slot count", () => {
    renderOtp({});
    expect(
      document.querySelector("[data-slot='input-otp']"),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll("[data-slot='input-otp-slot']"),
    ).toHaveLength(6);
  });

  it("renders a separator between groups", () => {
    renderOtp({});
    const separator = document.querySelector(
      "[data-slot='input-otp-separator']",
    );
    expect(separator).toBeInTheDocument();
    expect(separator?.getAttribute("role")).toBe("separator");
  });

  it("displays the characters of the provided value in slots", () => {
    renderOtp({ value: "123456" });
    const slots = document.querySelectorAll("[data-slot='input-otp-slot']");
    expect(slots[0]).toHaveTextContent("1");
    expect(slots[1]).toHaveTextContent("2");
    expect(slots[5]).toHaveTextContent("6");
  });

  it("fires onChange when typing into the hidden input", () => {
    const onChange = vi.fn();
    renderOtp({ onChange });
    const input = document.querySelector("[data-input-otp]");
    expect(input).not.toBeNull();
    fireEvent.change(input as Element, { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith("42");
  });

  it("disables the input when disabled", () => {
    renderOtp({ disabled: true });
    const input = document.querySelector("[data-input-otp]");
    expect(input).toBeDisabled();
  });

  it("marks the active slot as active", () => {
    renderOtp({});
    const input = document.querySelector("[data-input-otp]");
    fireEvent.focus(input as Element);
    const slots = document.querySelectorAll("[data-slot='input-otp-slot']");
    expect(slots[0]?.getAttribute("data-active")).toBe("true");
  });

  it("applies custom containerClassName", () => {
    const { container } = render(
      <InputOTP
        maxLength={4}
        value=""
        onChange={() => {}}
        containerClassName="custom-container"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(
      container.querySelector("[data-input-otp-container]")?.className,
    ).toContain("custom-container");
  });
});
