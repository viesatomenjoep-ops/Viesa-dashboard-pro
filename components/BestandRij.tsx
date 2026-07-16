"use client";

import { useState } from "react";
import {
  Cloud,
  FileText,
  Folder,
  HardDrive,
  Link2,
  Table2,
  type LucideIcon,
} from "lucide-react";
import {
  DRIVE_LINK_TYPES,
  driveTypeLabel,
  type DriveLink,
  type DriveLinkType,
} from "@/lib/drivelinks";
import { datumKort } from "@/lib/format";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/** Icoon + gekleurde tegel per bestandstype (naar het voorbeeld van beeld #14). */
const TYPE_STIJL: Record<DriveLinkType, { icoon: LucideIcon; vlak: string }> = {
  drive: { icoon: HardDrive, vlak: "bg-blue-100 text-blue-700" },
  sheet: { icoon: Table2, vlak: "bg-emerald-100 text-emerald-700" },
  doc: { icoon: FileText, vlak: "bg-blue-100 text-blue-700" },
  map: { icoon: Folder, vlak: "bg-amber-100 text-amber-700" },
  pdf: { icoon: FileText, vlak: "bg-red-100 text-red-700" },
  icloud: { icoon: Cloud, vlak: "bg-purple-100 text-purple-700" },
  overig: { icoon: Link2, vlak: "bg-navy/10 text-navy" },
};

/**
 * Eén rij in de bestanden-lijst. Standaard tonen; met "Bewerk" klap je een
 * inline formulier open om titel, url, type én categorie aan te passen.
 */
export function BestandRij({
  link,
  categorieenLijstId,
  bewerkActie,
  verwijderActie,
  bovenrand,
}: {
  link: DriveLink;
  categorieenLijstId: string;
  bewerkActie: (formData: FormData) => void;
  verwijderActie: (formData: FormData) => void;
  bovenrand: boolean;
}) {
  const [bewerken, setBewerken] = useState(false);

  return (
    <li className={bovenrand ? "border-t border-navy/10" : ""}>
      {bewerken ? (
        <form
          action={bewerkActie}
          className="grid gap-2 px-5 py-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto_auto]"
        >
          <input type="hidden" name="id" value={link.id} />
          <input
            name="titel"
            defaultValue={link.titel}
            placeholder="Titel"
            className={inputCls}
          />
          <input
            name="url"
            type="url"
            required
            defaultValue={link.url}
            placeholder="https://… *"
            className={inputCls}
          />
          <select name="type" defaultValue={link.type} className={inputCls}>
            {DRIVE_LINK_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            name="categorie"
            list={categorieenLijstId}
            defaultValue={link.categorie ?? ""}
            placeholder="Categorie"
            className={inputCls}
          />
          <button
            type="submit"
            className="rounded-lg bg-oranje px-3 py-2 text-sm font-medium text-white hover:bg-oranje/90"
          >
            Opslaan
          </button>
          <button
            type="button"
            onClick={() => setBewerken(false)}
            className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy hover:bg-navy/5"
          >
            Annuleren
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 sm:gap-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {(() => {
              const { icoon: Icoon, vlak } = TYPE_STIJL[link.type] ?? TYPE_STIJL.overig;
              return (
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${vlak}`}
                  title={driveTypeLabel(link.type)}
                >
                  <Icoon size={16} />
                </span>
              );
            })()}
            <a
              href={link.drive_file_id ? `/api/bestand?id=${link.id}` : link.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-[15px] font-medium text-navy hover:underline"
            >
              {link.titel}
            </a>
            {link.categorie ? (
              <span className="hidden text-xs text-navy/40 sm:inline">
                · {link.categorie}
              </span>
            ) : (
              <span className="hidden text-xs italic text-oranje/70 sm:inline">
                · geen categorie
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <span className="hidden text-xs text-navy/40 sm:inline">
              {datumKort(link.created_at)}
            </span>
            <button
              type="button"
              onClick={() => setBewerken(true)}
              className="text-sm font-medium text-navy/50 hover:text-navy"
            >
              Bewerk
            </button>
            <form action={verwijderActie}>
              <input type="hidden" name="id" value={link.id} />
              <button type="submit" className="text-navy/30 hover:text-red-500">
                ×
              </button>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}
