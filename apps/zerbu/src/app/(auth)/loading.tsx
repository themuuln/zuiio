export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
          <div className="w-6 h-6 rounded-full bg-primary/30" />
        </div>
        <div className="h-5 w-40 bg-secondary/20 rounded animate-pulse mx-auto" />
        <div className="h-4 w-56 bg-secondary/20 rounded animate-pulse mx-auto" />
      </div>
    </div>
  );
}
