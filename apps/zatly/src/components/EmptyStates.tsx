"use client";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondary?: string;
}

export function EmptyState({ icon, title, description, action, secondary }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="m-0 text-lg font-semibold text-text">{title}</h3>
      <p className="mt-1.5 text-sm text-text-muted max-w-sm leading-relaxed">{description}</p>
      {action && (
        <button
          type="button"
          className="mt-5 h-9 px-4 rounded-xl border border-accent/60 bg-accent/10 text-text text-sm font-medium cursor-pointer transition-all hover:bg-accent/20"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
      {secondary && (
        <p className="mt-2 text-xs text-text-muted/60">{secondary}</p>
      )}
    </div>
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-4xl mb-3 opacity-50">🔍</div>
      <h3 className="m-0 text-base font-semibold text-text">No results for "{query}"</h3>
      <p className="mt-1 text-sm text-text-muted">Try different keywords or filters</p>
    </div>
  );
}
