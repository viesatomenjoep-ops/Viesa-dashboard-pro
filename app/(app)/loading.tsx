/**
 * Skeleton die direct verschijnt bij navigatie (Next.js streamt dit meteen),
 * zodat het klikken op een categorie snel aanvoelt terwijl de data laadt.
 */
export default function Laden() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-24 rounded-2xl bg-navy/10" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-navy/10 bg-white" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-navy/10 bg-white" />
        <div className="h-64 rounded-xl border border-navy/10 bg-white" />
      </div>
    </div>
  );
}
