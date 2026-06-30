import { zodResolver } from "@hookform/resolvers/zod";
import type {
  FieldError,
  FieldErrors,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { useForm as useRHFForm } from "react-hook-form";

export { zodResolver };
export type { FieldError, FieldErrors, UseFormProps, UseFormReturn };
export { useRHFForm as useForm };
