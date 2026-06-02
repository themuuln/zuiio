"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface NumericKeypadProps {
  value: number;
  onChange: (value: number) => void;
  children: React.ReactNode;
}

export function NumericKeypad({
  value,
  onChange,
  children,
}: NumericKeypadProps) {
  const t = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  const [buffer, setBuffer] = React.useState("");
  const previousRef = React.useRef(value);

  const openKeypad = React.useCallback(() => {
    previousRef.current = value;
    setBuffer(value ? value.toString() : "");
    setOpen(true);
  }, [value]);

  const handleKey = React.useCallback((key: string) => {
    setBuffer((prev) => {
      if (key === "backspace") return prev.slice(0, -1);
      if (key === "clear") return "";
      if (key === ".") {
        // Allow one decimal point only
        if (prev.includes(".")) return prev;
        // Don't start with a decimal
        if (prev === "") return "0.";
        return `${prev}.`;
      }
      // Prevent leading zeros (allow "0" alone and "0.x")
      if (prev === "0" && key === "0") return prev;
      if (prev === "0" && key !== ".") return key;
      // Enforce max 2 decimal places
      const next = prev + key;
      const parts = next.split(".");
      if (parts.length === 2 && parts[1].length > 2) return prev;
      return next;
    });
  }, []);

  const handleOK = React.useCallback(() => {
    const num = parseFloat(buffer);
    onChange(Number.isNaN(num) ? 0 : Math.round(num * 100) / 100);
    setOpen(false);
  }, [buffer, onChange]);

  // Clone children to add interaction handlers
  const trigger = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const element = child as React.ReactElement<any>;
    return React.cloneElement(element, {
      readOnly: true,
      onClick: (e: React.MouseEvent) => {
        element.props?.onClick?.(e);
        if (!e.defaultPrevented) openKeypad();
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        element.props?.onKeyDown?.(e);
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openKeypad();
        }
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent
        showCloseButton={false}
        className="w-[300px] sm:w-[340px] gap-0 p-4 [&>button:last-child]:hidden"
      >
        {/* Value display */}
        <div className="mb-4 flex items-center justify-end rounded-none bg-muted px-4 py-3.5">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            {buffer || "0"}
          </span>
        </div>

        {/* Keypad grid */}
        <fieldset
          className="grid grid-cols-4 gap-2 border-0 p-0 m-0"
          aria-label={t("numericKeypad")}
        >
          {/* Row 1: 7 8 9 ⌫ */}
          <KeyButton onClick={() => handleKey("7")}>7</KeyButton>
          <KeyButton onClick={() => handleKey("8")}>8</KeyButton>
          <KeyButton onClick={() => handleKey("9")}>9</KeyButton>
          <KeyButton
            onClick={() => handleKey("backspace")}
            variant="muted"
            aria-label={t("backspace")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </KeyButton>

          {/* Row 2: 4 5 6 C */}
          <KeyButton onClick={() => handleKey("4")}>4</KeyButton>
          <KeyButton onClick={() => handleKey("5")}>5</KeyButton>
          <KeyButton onClick={() => handleKey("6")}>6</KeyButton>
          <KeyButton
            onClick={() => handleKey("clear")}
            variant="muted"
            aria-label={t("clear")}
          >
            C
          </KeyButton>

          {/* Row 3: 1 2 3 OK */}
          <KeyButton onClick={() => handleKey("1")}>1</KeyButton>
          <KeyButton onClick={() => handleKey("2")}>2</KeyButton>
          <KeyButton onClick={() => handleKey("3")}>3</KeyButton>
          <KeyButton onClick={handleOK} variant="primary">
            OK
          </KeyButton>

          {/* Row 4: 0 (wide) . */}
          <KeyButton onClick={() => handleKey("0")} className="col-span-2">
            0
          </KeyButton>
          <KeyButton
            onClick={() => handleKey(".")}
            aria-label={t("decimalPoint")}
          >
            .
          </KeyButton>
          <div aria-hidden="true" />
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}

interface KeyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "muted" | "primary";
}

function KeyButton({
  className,
  variant = "default",
  children,
  ...props
}: KeyButtonProps) {
  return (
    <button
      type="button"
      data-slot="keypad-btn"
      className={cn(
        "flex min-h-[56px] cursor-pointer items-center justify-center rounded-xl text-base font-semibold transition-all select-none",
        "active:scale-95 active:opacity-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "default" &&
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "muted" &&
          "bg-muted text-muted-foreground hover:bg-muted/70",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
