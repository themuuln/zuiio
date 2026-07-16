"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
          <span className="text-error text-2xl">!</span>
        </div>
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Нэвтрэхэд алдаа гарлаа</h1>
        <p className="text-sm text-text-secondary">
          Дахин оролдоно уу эсвэл дараа орж үзнэ үү.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Дахин оролдох
        </button>
      </div>
    </div>
  );
}
