/** Grijs, pulserend blok als plaatshouder tijdens het laden. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-navy/10 ${className}`} />;
}
