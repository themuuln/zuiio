import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import type { ReactElement, ReactNode } from "react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

interface WrapperOptions {
  locale?: string;
  messages?: Record<string, string>;
}

function createWrapper(options?: WrapperOptions) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale={options?.locale ?? "mn"}
          messages={options?.messages ?? {}}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  };
}

function customRender(ui: ReactElement, options?: WrapperOptions) {
  return render(ui, { wrapper: createWrapper(options) });
}

function customRenderHook<Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: WrapperOptions,
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}

export {
  customRender as render,
  customRenderHook as renderHook,
  createTestQueryClient,
  createWrapper,
};
