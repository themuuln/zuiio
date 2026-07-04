"use client";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex h-screen items-center justify-center bg-bg">
			<div className="max-w-md text-center">
				<div className="mb-4 text-4xl">⚠️</div>
				<h2 className="mb-2 text-lg font-semibold text-text">
					Application Error
				</h2>
				<p className="mb-4 text-sm text-text-muted">
					{error.message || "An unexpected error occurred."}
				</p>
				{error.digest && (
					<p className="mb-4 text-xs text-text-muted">
						Error ID: {error.digest}
					</p>
				)}
				<button
					type="button"
					className="rounded-lg border border-accent/70 bg-accent/15 px-4 py-2 text-sm font-semibold text-text cursor-pointer transition-colors hover:bg-accent/25"
					onClick={reset}
				>
					Try again
				</button>
			</div>
		</div>
	);
}
