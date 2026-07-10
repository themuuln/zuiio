import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InlineEditableField } from "./_inline-editable-field";

function formatMnt(value: number) {
  return `₮${value.toLocaleString("en-US")}`;
}

function parseMnt(raw: string) {
  const cleaned = raw.replace(/[₮,\s]/g, "").trim();
  return cleaned === "" ? 0 : Number(cleaned);
}

function EditableCurrencyField({
  onChange,
  onSave,
}: {
  onChange: (value: number) => void;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState(50000);

  return (
    <InlineEditableField
      value={value}
      onChange={onChange}
      onSave={(nextValue) => {
        onSave(nextValue);
        setValue(nextValue);
      }}
      formatDisplay={formatMnt}
      parseInput={parseMnt}
      type="number"
    />
  );
}

describe("InlineEditableField", () => {
  it("keeps raw numeric text stable while editing the leading digit", async () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableCurrencyField onChange={onChange} onSave={onSave} />);

    const input = screen.getByRole("textbox", {
      name: "₮50,000",
    }) as HTMLInputElement;
    expect(input.value).toBe("₮50,000");

    await user.click(input);
    expect(input.value).toBe("50000");

    input.setSelectionRange(0, 1);
    await user.keyboard("7");

    expect(input.value).toBe("70000");
    expect(onChange).toHaveBeenLastCalledWith(70000);

    await user.tab();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(70000);
    expect(input.value).toBe("₮70,000");
  });
});
