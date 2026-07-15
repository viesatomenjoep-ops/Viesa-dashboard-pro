"use client";

/**
 * Knop die een server-actie uitvoert na een bevestiging (window.confirm).
 * `actie` is een reeds gebonden server-actie (bijv. verwijderAudit.bind(null, id)).
 */
export function BevestigKnop({
  actie,
  vraag,
  label,
  className = "text-navy/30 hover:text-red-500",
}: {
  actie: (formData: FormData) => void;
  vraag: string;
  label: string;
  className?: string;
}) {
  return (
    <form action={actie}>
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm(vraag)) e.preventDefault();
        }}
        className={className}
      >
        {label}
      </button>
    </form>
  );
}
