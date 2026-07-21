export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg dark:bg-dark-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <span className="text-white text-2xl font-bold">Г</span>
          </div>
          <h1 className="text-2xl font-bold text-text dark:text-dark-text">Gerbul</h1>
          <p className="text-text-secondary text-sm mt-1">Бид хоёрын орон зай</p>
        </div>
        {children}
      </div>
    </div>
  );
}
