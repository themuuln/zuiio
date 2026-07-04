"use client";

import React from "react";

type Props = {
	children: React.ReactNode;
	fallback?: React.ReactNode;
};

type State = {
	hasError: boolean;
	error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex h-full items-center justify-center bg-bg p-8">
					<div className="max-w-md text-center">
						<div className="mb-4 text-4xl">⚠️</div>
						<h2 className="mb-2 text-lg font-semibold text-text">
							Something went wrong
						</h2>
						<p className="mb-4 text-sm text-text-muted">
							{this.state.error?.message || "An unexpected error occurred."}
						</p>
						<button
							type="button"
							className="rounded-lg border border-accent/70 bg-accent/15 px-4 py-2 text-sm font-semibold text-text cursor-pointer transition-colors hover:bg-accent/25"
							onClick={() => {
								this.setState({ hasError: false, error: null });
								window.location.reload();
							}}
						>
							Reload page
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
