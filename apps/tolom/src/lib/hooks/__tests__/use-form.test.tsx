import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useForm, zodResolver } from "../use-form";

const schema = z.object({
  name: z.string().min(3, "Name too short"),
  email: z.string().email("Invalid email"),
});

type Values = z.infer<typeof schema>;

describe("useForm", () => {
  it("registers fields with name, change handler and ref", () => {
    const { result } = renderHook(() =>
      useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "" },
      }),
    );

    const register = result.current.register("name");
    expect(register.name).toBe("name");
    expect(typeof register.onChange).toBe("function");
    expect(typeof register.ref).toBe("function");
  });

  it("tracks field values set through setValue", () => {
    const { result } = renderHook(() =>
      useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "" },
      }),
    );

    act(() => {
      result.current.setValue("name", "John");
    });

    expect(result.current.getValues("name")).toBe("John");
  });

  it("blocks submit and reports field errors for invalid values", async () => {
    const onValid = vi.fn();
    const onInvalid = vi.fn();
    const { result } = renderHook(() =>
      useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { name: "Jo", email: "not-an-email" },
      }),
    );

    // Subscribe to errors first so formState re-renders after the submit
    expect(result.current.formState.errors).toEqual({});

    await act(async () => {
      await result.current.handleSubmit(onValid, onInvalid)();
    });

    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(onInvalid.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        name: expect.objectContaining({ message: "Name too short" }),
        email: expect.objectContaining({ message: "Invalid email" }),
      }),
    );
    expect(result.current.formState.errors.name?.message).toBe(
      "Name too short",
    );
    expect(result.current.formState.errors.email?.message).toBe(
      "Invalid email",
    );
  });

  it("submits valid values to the handler", async () => {
    const onValid = vi.fn();
    const { result } = renderHook(() =>
      useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { name: "John", email: "john@example.com" },
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid.mock.calls[0][0]).toEqual({
      name: "John",
      email: "john@example.com",
    });
  });
});
