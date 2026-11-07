export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin-slow" />
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}
