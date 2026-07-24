"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center space-y-4 py-16">
      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
        <span className="text-error text-2xl">!</span>
      </div>
      <h2 className="text-lg font-semibold text-text dark:text-dark-text">Алдаа гарлаа</h2>
      <p className="text-sm text-text-secondary">
        Энэ хуудсыг харуулахад алдаа гарлаа. Дахин оролдоно уу.
      </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
        >
        Дахин оролдох
      </button>
    </div>
  );
}
