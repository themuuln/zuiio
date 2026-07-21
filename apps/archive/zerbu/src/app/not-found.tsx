import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
          <span className="text-text-secondary text-4xl">?</span>
        </div>
        <h1 className="text-2xl font-bold text-text dark:text-dark-text">Хуудас олдсонгүй</h1>
        <p className="text-sm text-text-secondary">
          Таны хайсан хуудас байхгүй эсвэл устгагдсан байна.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
