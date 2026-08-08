"use client";

export default function CandidatsRecentsAvatars({ candidats }) {
  if (!candidats || candidats.length === 0) return null;

  const affiches = candidats.slice(0, 3);
  const reste = candidats.length - affiches.length;

  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex -space-x-2.5">
        {affiches.map((c) => (
          <div
            key={c.idCandidature}
            title={`${c.prenom} ${c.nom}`}
            className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-primary text-[10px] font-bold text-primary-foreground"
          >
            {c.photoProfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.photoProfilUrl}
                alt={`${c.prenom} ${c.nom}`}
                className="h-full w-full object-cover"
              />
            ) : (
              `${c.prenom?.[0] || ""}${c.nom?.[0] || ""}`
            )}
          </div>
        ))}
      </div>
      {reste > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          +{reste} autre{reste > 1 ? "s" : ""} candidat{reste > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}