export function Loading({ message = "Yükleniyor..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600" />
      {message && <p className="mt-4 text-slate-600">{message}</p>}
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-slate-200 border-t-blue-600 ${sizeClasses[size]}`}
    />
  );
}
