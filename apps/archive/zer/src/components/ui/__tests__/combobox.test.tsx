import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../combobox";

function TestCombobox({ initialItems = ["Apple", "Banana", "Cherry"] }) {
  const [value, setValue] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const filtered = query
    ? initialItems.filter((i) => i.toLowerCase().includes(query.toLowerCase()))
    : initialItems;

  return (
    <Combobox
      items={filtered}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        setQuery(next ?? "");
      }}
      itemToStringLabel={(item) => item ?? ""}
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxInput id="fruit" placeholder="Сонгох..." />
      <ComboboxContent>
        <ComboboxEmpty>Олдсонгүй</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

describe("Combobox", () => {
  it("renders input with placeholder", () => {
    render(<TestCombobox />);
    expect(screen.getByPlaceholderText("Сонгох...")).toBeInTheDocument();
  });

  it("shows items on focus", async () => {
    const user = userEvent.setup();
    render(<TestCombobox />);

    const input = screen.getByPlaceholderText("Сонгох...");
    await user.click(input);

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("filters items when typing", async () => {
    const user = userEvent.setup();
    render(<TestCombobox />);

    await user.click(screen.getByPlaceholderText("Сонгох..."));
    await user.keyboard("Ap");

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    expect(screen.queryByText("Cherry")).not.toBeInTheDocument();
  });

  it("shows empty state when no items match", async () => {
    const user = userEvent.setup();
    render(<TestCombobox />);

    await user.click(screen.getByPlaceholderText("Сонгох..."));
    await user.keyboard("XYZ");

    expect(screen.getByText("Олдсонгүй")).toBeInTheDocument();
  });
});
