"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in dev; Sentry captures via sentry-init.tsx
    console.error("Admin error boundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Empty className="min-h-[400px]">
          <EmptyMedia variant="icon">
            <AlertTriangle className="size-12 text-destructive" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Алдаа гарлаа</EmptyTitle>
            <EmptyDescription>
              {this.state.error?.message ??
                "Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="mr-2 size-4" />
              Дахин оролдох
            </Button>
          </EmptyContent>
        </Empty>
      );
    }

    return this.props.children;
  }
}
